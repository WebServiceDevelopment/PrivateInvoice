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

// Import Modules
const sub = require('../invoice_sub.js')
const tran = require('../invoice_sub_transaction.js')
const to_buyer = require('../seller_to_buyer.js')

const sign_your_credentials = require('../sign_your_credentials.js')
const { makePresentation } = require('../presentations_out.js')

// Table Name
const SELLER_DRAFT_DOCUMENT = 'seller_document_draft'
const SELLER_DRAFT_STATUS = 'seller_status_draft'

const SELLER_DOCUMENT = 'seller_document'
const SELLER_STATUS = 'seller_status'

const CONTACTS = 'contacts'
const { getPrivateKeys } = require('../verify_utils.js')

const sendInvoice = async (
    member_did, // string did:key:123
    document_uuid // string
) => {

    const start = Date.now()

    // 1.
    const [buyer_did, err1] = await sub.getBuyerDidForDraft(
        SELLER_DRAFT_STATUS,
        document_uuid,
        member_did
    )

    if (err1) {
        throw new Error('Error (send invoice): Could not get buyer did')
    }

    if (buyer_did === null) {
        throw new Error('Error (send invoice): buyer_did is not found')
    }

    // 2.
    const [buyer_host, err2] = await sub.getBuyerHost(
        CONTACTS,
        member_did,
        buyer_did
    )

    if (err2) {
        throw new Error('Error (send invoice): Could not get buyer host')
    }

    //3. buyer connect check
    //
    // 20221102 undo

console.log('Buyer host: ', buyer_host);

    const [code3, err3] = await to_buyer.connect(
        buyer_host,
        member_did,
        buyer_did
    )

    if (code3 !== 200) {

        if (code3 === 500) {
            throw new Error('Error (send invoice): buyer connect check:ECONNRESET')
        } else {
            switch (err3) {
                case 'Not found.':
                    throw new Error('Error (send invoice): derp The destination node cannot be found')
                default:
                    throw new Error('Error (send invoice): Invalid request')
            }
        }

    }

    // 4.
    // DRAFT_STATUS
    // First we go ahead and get the draft status.
    //
    const [status, _4] = await sub.getStatus(SELLER_DRAFT_STATUS, document_uuid)

    if (status.document_uuid == null) {
        throw new Error('Error (send invoice): document_uuid is null')
    }

    // 5.
    // Creating Send data.
    //
    status.document_uuid = document_uuid
    status.document_type = 'invoice'
    status.document_folder = 'sent'

    // 6.
    // Second we go ahead and get the draft document
    //
    const [document] = await sub.getDraftDocumentForSend(
        SELLER_DRAFT_DOCUMENT,
        document_uuid
    )

    if (document.document_uuid === null) {
        throw new Error('Error (send invoice): document_uuid is null')
    }

    document.seller_did = member_did
    document.buyer_did = buyer_did

    // 7.
    // signInvoice
    //

    const [keyPair] = await getPrivateKeys(member_did)
    const signedCredential = await sign_your_credentials.signInvoice(
        document.document_uuid,
        document.document_json,
        keyPair
    )

    const document_json = JSON.stringify(signedCredential)
    document.document_json = document_json

    if (document.document_json == null) {
        throw new Error('Error (send invoice): document_json is null')
    }

    // 8.
    // Does document_uuid already notexist in the status table?
    //
    const [_8, err8] = await sub.notexist_check(SELLER_STATUS, document_uuid)
    if (err8) {
        throw new Error('Error (send invoice): document_uuid is not exist')
    }

    // 9.
    // Does document_uuid already notexist in the document table?
    //
    const [_9, err9] = await sub.notexist_check(SELLER_DOCUMENT, document_uuid)
    if (err9) {
        throw new Error('Error (send invoice): document_uuid is not exist')
    }

    // 10.
    // begin Transaction
    //
    const [conn, _10] = await tran.connection()
    await tran.beginTransaction(conn)

    // 11.
    // Then we go ahead and insert into the status
    //
    const [_11, err11] = await tran.insertStatus(conn, SELLER_STATUS, status)

    if (err11) {
        errno = 11
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err11, errno, METHOD)
        )
        return
    }

    // 12.
    // And then we need to insert into database
    //
    const [_12, err12] = await tran.insertDocument(
        conn,
        SELLER_DOCUMENT,
        status,
        document_json
    )
    if (err12) {
        errno = 12
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err12, errno, METHOD)
        )
        return
    }

    // 13.
    // Remove from SELLER_DRAFT_STATUS with docunent_uuid key
    //
    const [_13, err13] = await tran.deleteStatus(
        conn,
        SELLER_DRAFT_STATUS,
        status
    )
    if (err13) {
        errno = 13
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err13, errno, METHOD)
        )
        return
    }

    // 14.
    // Remove from SELLER_DRAFT_DOCUMENT with docunent_uuid key
    //
    const [_14, err14] = await tran.deleteDocument(
        conn,
        SELLER_DRAFT_DOCUMENT,
        status
    )
    if (err14) {
        errno = 14
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err14, errno, METHOD)
        )
        return
    }

    // 15.
    // Send 'send' message to buyer.

    const presenationSlug = '/api/presentations/available'
    const url = buyer_host + presenationSlug

    const vc = JSON.parse(document.document_json)
    const [code15, err15] = await makePresentation(url, keyPair, vc)

    if (err15) {
        res.status(400).json(
            tran.rollbackAndReturn(conn, code15, 15, errno, METHOD)
        )
        return
    }

    // 16.
    // commit
    //
    const [_16, err16] = await tran.commit(conn)

    if (err16) {
        errno = 16
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err16, errno, METHOD)
        )
        return
    }

    conn.end()
    const end = Date.now()
    console.log('/send Time: %d ms', end - start)
}

module.exports = {
    sendInvoice
}
