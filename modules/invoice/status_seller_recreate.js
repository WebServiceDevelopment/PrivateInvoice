/**

 Apache-2.0 License
 Copyright 2020 - 2022 Web Service Development Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 Author: Ogawa Kousei (kogawa@wsd.co.jp)
	
**/

'use strict'

// Libraries

const uuidv1 = require('uuid').v1
const uniqid = require('uniqid')
const moment = require('moment')

// Import Modules
const sub = require('../invoice_sub.js')
const tran = require('../invoice_sub_transaction.js')
const to_buyer = require('../seller_to_buyer.js')

const { makePresentation } = require('../presentations_out.js')

// delete createTrashMessage
const { createRecreateMessage } = require('../update_status.js')

// Database
const config = require('../../config.json')

// Table Name
const SELLER_DRAFT_DOCUMENT = 'seller_document_draft'
const SELLER_DRAFT_STATUS = 'seller_status_draft'

const SELLER_DOCUMENT = 'seller_document'
const SELLER_STATUS = 'seller_status'

const SELLER_ARCHIVE_DOCUMENT = 'seller_document_archive'
const SELLER_ARCHIVE_STATUS = 'seller_status_archive'

const CONTACTS = 'contacts'
const { getPrivateKeys } = require('../verify_utils.js')

// CURRENCY
const CURRENCY = config.CURRENCY

const recreateInvoice = async (
    member_did, // string did:key:123
    document_uuid // string
) => {
    const METHOD = '/recreate'

    let start = Date.now()
    let status, document

    // 1.
    //
    const [buyer_did, err1] = await sub.getBuyerDid(
        SELLER_STATUS,
        document_uuid,
        member_did
    )
    if (err1) {
        let msg = `Error:${METHOD}: Could not get buyer did`

        return {
            err: 1,
            msg: msg,
        }
    }

    // 2.
    //
    const [buyer_host, err2] = await sub.getBuyerHost(
        CONTACTS,
        member_did,
        buyer_did
    )
    if (err2) {
        let msg = `Error:${METHOD}: Could not get buyer host`

        return {
            err: 1,
            msg: msg,
        }
    }

    //3. buyer connect check
    //

    const [code3, err3] = await to_buyer.connect(
        buyer_host,
        member_did,
        buyer_did
    )

    if (code3 !== 200) {
        let msg
        if (code == 500) {
            msg = `Error:${METHOD}: buyer connect check:ECONNRESET`
        } else {
            switch (err3) {
                case 'Not found.':
                    msg = `Error:${METHOD}: The destination node cannot be found`
                    break
                default:
                    msg = `Error:${METHOD}: Invalid request`
                    break
            }
        }

        return {
            err: 3,
            msg: msg,
        }
    }

    // 4
    // STATUS
    // First we go ahead and get the status.
    //
    const [old_status, _4] = await sub.getStatus(SELLER_STATUS, document_uuid)

    if (old_status.document_uuid == null) {
        let msg = `Error:${METHOD}: document_uuid is null`

        return {
            err: 4,
            msg: msg,
        }
    }

    // 5.
    // Creating Draft data.
    //
    let prefix = 'inv-'

    status = JSON.parse(JSON.stringify(old_status))
    status.document_uuid = uuidv1()
    status.document_type = 'invoice'
    status.document_folder = 'draft'

    status.document_number = prefix + uniqid.time()
    let d = new Date()
    status.create_on = d.toISOString()
    status.due_by = moment().add(30, 'days').format('YYYY-MM-DD')

    // 6.
    // Second we go ahead and get the document
    //
    const [old_document, _6] = await sub.getDocument(
        SELLER_DOCUMENT,
        document_uuid
    )

    if (old_document.document_uuid == null) {
        let msg = `Error:${METHOD}: document_uuid is null`

        return {
            err: 4,
            msg: msg,
        }
    }

    // 7.
    // Creating Send data.
    //

    document = {}

    // 7.1 document_uuid
    //
    document.document_uuid = status.document_uuid

    // 7.2 document_json
    //
    let document_json = JSON.parse(old_document.document_json)

    document_json.credentialSubject.type = 'Invoice'

    // Update if customerReferenceNumber is revised.
    //
    // document_json.credentialSubject.customerReferenceNumber = document_json.credentialSubject.customerReferenceNumber;

    document_json.credentialSubject.identifier = status.document_uuid
    document_json.credentialSubject.invoiceNumber = status.document_number
    document_json.credentialSubject.purchaseDate = status.due_by
    document_json.credentialSubject.invoiceDate = status.create_on

    document.document_json = JSON.stringify(document_json)

    // 7.3 document_type
    //
    document.document_type = status.document_type

    // 7.4 subject_line
    //
    document.subject_line = old_status.subject_line

    // 7.5 currency_options
    //

    document.currency_options = JSON.stringify(CURRENCY)

    // 7.6 seller_did
    //
    document.seller_did = old_status.seller_did

    // 7.7 seller_details
    //
    let seller = document_json.credentialSubject.seller
    let seller_details = {}
    seller_details.organization_name = seller.name
    seller_details.organization_tax_id = seller.taxId
    seller_details.organization_department = seller.description
    seller_details.organization_building = seller.address.streetAddress
    seller_details.building = seller.address.addressLocality
    seller_details.addressCountry = seller.address.addressCountry
    seller_details.addressRegion = seller.address.addressRegion
    seller_details.addressCity = seller.address.addressCity

    document.seller_details = JSON.stringify(seller_details)

    // 7.8 seller_membername
    //
    let seller_membername =
        document_json.credentialSubject.seller.contactPoint.split('@')[0]
    document.seller_membername = seller_membername

    // 7.9 buyer_did
    //
    document.buyer_did = old_status.buyer_did

    // 7.10 buyer_details
    //
    let buyer = document_json.credentialSubject.buyer
    let buyer_details = {}
    buyer_details.organization_name = buyer.name
    buyer_details.organization_tax_id = buyer.taxId
    buyer_details.organization_department = buyer.description
    buyer_details.organization_building = buyer.address.streetAddress
    buyer_details.building = buyer.address.addressLocality
    buyer_details.addressCountry = buyer.addressCountry
    buyer_details.addressRegion = buyer.addressRegion
    buyer_details.addressCity = buyer.addressCity

    document.buyer_details = JSON.stringify(buyer_details)

    // 7.11 buyer_membername
    //
    let buyer_membername =
        document_json.credentialSubject.buyer.contactPoint.split('@')[0]
    document.buyer_membername = buyer_membername

    // 7.12 create_on
    //
    document.create_on = status.create_on

    // 7.13 document_meta
    //
    document.document_meta = {}

    let document_meta = {}
    document_meta.document_number = status.document_number
    document_meta.created_on = status.create_on.substr(0, 10)
    document_meta.taxId = document_json.credentialSubject.seller.taxId
    document_meta.due_by = status.due_by

    document.document_meta = JSON.stringify(document_meta)

    // 7.14 document_body
    //
    let document_body = []
    let iS = document_json.credentialSubject.itemsShipped
    let max_rows = iS.length
    for (let i = 0; i < max_rows; i++) {
        document_body[i] = {}

        document_body[i].date = iS[i].description
        document_body[i].desc = iS[i].product.description
        document_body[i].price =
            iS[i].product.productPrice.price +
            ' ' +
            iS[i].product.productPrice.priceCurrency
        document_body[i].unit = iS[i].product.sizeOrAmount.unitCode
        document_body[i].quan = iS[i].product.sizeOrAmount.value
        document_body[i].subtotal =
            iS[i].lineItemTotalPrice.price +
            ' ' +
            iS[i].lineItemTotalPrice.priceCurrency
    }
    document.document_body = JSON.stringify(document_body)

    // 7.15 document_totals
    //
    let document_totals = {}
    document_totals.subtotal =
        document_json.credentialSubject.invoiceSubtotal.price +
        ' ' +
        document_json.credentialSubject.invoiceSubtotal.priceCurrency
    document_totals.total =
        document_json.credentialSubject.totalPaymentDue.price +
        ' ' +
        document_json.credentialSubject.totalPaymentDue.priceCurrency

    document.document_totals = JSON.stringify(document_totals)

    // 8.
    // Does document_uuid already notexist in the default status table?
    //
    const [_8, err8] = await sub.notexist_check(
        SELLER_DRAFT_STATUS,
        document_uuid
    )
    if (err8) {
        let msg = `Error:${METHOD}: document_uuid is not exist`

        return {
            err: 8,
            msg: msg,
        }
    }

    // 9.
    // Does document_uuid already notexist in the default document table?
    //
    const [_9, err9] = await sub.notexist_check(
        SELLER_DRAFT_DOCUMENT,
        document_uuid
    )
    if (err9) {
        let msg = `Error:${METHOD}: document_uuid is not exist`

        return {
            err: 9,
            msg: msg,
        }
    }

    // 10.
    // begin Transaction
    //
    const [conn, _10] = await tran.connection()
    await tran.beginTransaction(conn)

    // 11.
    // Then we go ahead and insert into the draft status
    //

    const [_11, err11] = await tran.insertStatus(
        conn,
        SELLER_DRAFT_STATUS,
        status
    )

    if (err11) {
        errno = 11
        code = 400
        return tran.rollbackAndReturn(conn, code, err11, errno, METHOD)
    }

    // 12.
    // And then we need to insert into the draft document
    //
    const [_12, err12] = await tran.insertDraftDocument(
        conn,
        SELLER_DRAFT_DOCUMENT,
        document
    )

    if (err12) {
        console.log('err12=' + err12)
        errno = 12
        code = 400
        return tran.rollbackAndReturn(conn, code, err12, errno, METHOD)
    }

    // 13.
    // Remove from SELLER_STATUS with docunent_uuid key
    //
    const [_13, err13] = await tran.deleteStatus(
        conn,
        SELLER_STATUS,
        old_status
    )

    if (err13) {
        errno = 13
        code = 400
        return tran.rollbackAndReturn(conn, code, err13, errno, METHOD)
    }

    // 14.
    // Remove from SELLER_DOCUMENT with docunent_uuid key
    //
    const [_14, err14] = await tran.deleteDocument(
        conn,
        SELLER_DOCUMENT,
        old_status
    )
    if (err14) {
        errno = 14
        code = 400
        return tran.rollbackAndReturn(conn, code, err14, errno, METHOD)
    }

    // 15.
    // Then we go ahead and insert into the archive status
    //

    old_status.document_folder = 'trash'
    const [_15, err15] = await tran.insertStatus(
        conn,
        SELLER_ARCHIVE_STATUS,
        old_status
    )

    if (err15) {
        errno = 15
        code = 400
        return tran.rollbackAndReturn(conn, code, err15, errno, METHOD)
    }

    // 16.
    // And then we need to insert into the archive document
    //
    const [_16, err16] = await tran.insertDocument(
        conn,
        SELLER_ARCHIVE_DOCUMENT,
        old_status,
        old_document.document_json
    )

    if (err16) {
        errno = 16
        code = 400
        return tran.rollbackAndReturn(conn, code, err16, errno, METHOD)
    }

    // 17.
    // Send 'recreate' message to buyer.
    //
    // Get private keys to sign credential

    const [keyPair, err17] = await getPrivateKeys(member_did)
    if (err17) {
        errno = 17
        code = 400
        return tran.rollbackAndReturn(conn, code, err17, errno, METHOD)
    }

    // 18. createRecreateMessage
    const url = `${buyer_host}/api/presentations/available`
    const [credential, err18] = await createRecreateMessage(
        document_uuid,
        member_did,
        keyPair
    )
    if (err18) {
        errno = 18
        code = 400
        return tran.rollbackAndReturn(conn, code, err18, errno, METHOD)
    }

    // 19. makePresentation
    //
    const [_19, err19] = await makePresentation(url, keyPair, credential)
    if (err19) {
        errno = 19
        code = 400
        return tran.rollbackAndReturn(conn, code, err19, errno, METHOD)
    }

    // 20.
    // commit
    //
    const [_20, err20] = await tran.commit(conn)

    if (err20) {
        errno = 20
        code = 400
        return tran.rollbackAndReturn(conn, code, err20, errno, METHOD)
    }

    // 21.
    //
    conn.end()

    let end = Date.now()
    console.log('/recreate Time: %d ms', end - start)

    return {
        err: 0,
        msg: status.document_uuid,
    }

    //console.log("recreate accepted");
}

module.exports = {
    recreateInvoice,
}
