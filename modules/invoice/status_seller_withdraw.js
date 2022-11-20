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

// Import Modules
const sub = require('../invoice_sub.js')
const tran = require('../invoice_sub_transaction.js')
const to_buyer = require('../seller_to_buyer.js')

const { makePresentation } = require('../presentations_out.js')

// delete createTrashMessage
const { createWithdrawMessage } = require('../update_status.js')

// Database
const config = require('../../config.json')

// Table Name

const SELLER_DOCUMENT = 'seller_document'
const SELLER_STATUS = 'seller_status'

const CONTACTS = 'contacts'
const { getPrivateKeys } = require('../verify_utils.js')

// CURRENCY
const CURRENCY = config.CURRENCY

const withdrawInvoice = async (
    member_did, // string did:key:123
    document_uuid // string
) => {
    const METHOD = '/withdraw'
    let start = Date.now()
    const document_folder = 'sent'

    // 1.

    const [buyer_did, err1] = await sub.getBuyerDid(
        SELLER_STATUS,
        document_uuid,
        member_did
    )

    if (err1) {
        let msg = `Error:${METHOD}: Could not get buyer did`

        res.status(400).json({
            err: 1,
            msg: msg,
        })
        return
    }

    // 2.

    const [buyer_host, err2] = await sub.getBuyerHost(
        CONTACTS,
        member_did,
        buyer_did
    )

    if (err2) {
        let msg = `Error:${METHOD}: buyer_did is not found`

        res.status(400).json({
            err: 1,
            msg: msg,
        })
        return
    }

    //3. buyer connect check

    const [code3, err3] = await to_buyer.connect(
        buyer_host,
        member_did,
        buyer_did
    )

    if (code3 !== 200) {
        let msg
        if (code3 == 500) {
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

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    // 4
    // STATUS
    // First we go ahead and get the status.
    //
    const [old_status, _4] = await sub.getStatus(SELLER_STATUS, document_uuid)

    // Does record exist?
    if (old_status.document_uuid == null) {
        let msg = `Error:${METHOD}: document_uuid is null`

        res.status(400).json({
            err: 4,
            msg: msg,
        })
        return
    }

    // 5.
    // Does document_uuid already exist in the status table?
    //
    const [_5, err5] = await sub.exist_check(SELLER_STATUS, document_uuid)

    if (err5) {
        let msg = `Error:${METHOD}: document_uuid is not exist`

        res.status(400).json({
            err: 5,
            msg: msg,
        })
        return
    }

    // 6.
    // Does document_uuid already exist in the document table?
    //
    const [_6, err6] = await sub.exist_check(SELLER_DOCUMENT, document_uuid)

    if (err6) {
        let msg = `Error:${METHOD}: document_uuid is not exist`

        res.status(400).json({
            err: 6,
            msg: msg,
        })
        return
    }

    // 7.
    // begin Transaction
    //
    const [conn, _7] = await tran.connection()
    await tran.beginTransaction(conn)

    // 8.
    // update status
    //

    const [_8, err8] = await tran.setWithdrawSeller(
        conn,
        SELLER_STATUS,
        document_uuid,
        member_did,
        document_folder
    )

    if (err8) {
        console.log('Error 8 status = 400 code=' + err8.msg)
        errno = 8
        code = 400
        return tran.rollbackAndReturn(conn, code, err8, errno, METHOD)
    }

    // 9.
    // Send 'withdraw" message to buyer.
    //
    // Get private keys to sign credential

    const [keyPair, err9] = await getPrivateKeys(member_did)
    if (err9) {
        return tran.rollbackAndReturn(conn, 'code9', err9, errno, METHOD)
    }

    // 10. createWithdrawMessage
    //
    const url = `${buyer_host}/api/presentations/available`
    const [credential, err10] = await createWithdrawMessage(
        document_uuid,
        member_did,
        keyPair
    )
    if (err10) {
        return tran.rollbackAndReturn(conn, 'code10', err10, errno, METHOD)
    }

    // 11.
    console.log('--- withdraw 11 ---')
    const [_11, err11] = await makePresentation(url, keyPair, credential)
    if (err11) {
        return tran.rollbackAndReturn(conn, 'code11', err11, errno, METHOD)
    }

    // 12
    // commit
    //
    console.log('--- withdraw 12 ---')
    const [_12, err12] = await tran.commit(conn)

    if (err12) {
        console.log('Error 12 status = 400 code=' + err12)
        errno = 12
        code = 400
        let msg = tran.rollbackAndReturn(conn, code, err12, errno, METHOD)

        // 13.
        //
        console.log('--- err: withdraw 13 ---')
        const [seller_host, err13] = await sub.getSellerHost(
            CONTACTS,
            member_did,
            buyer_did
        )

        if (err13) {
            msg = `Error:${METHOD}: Could not get host`

            return {
                err: 13,
                msg: msg,
            }
        }

        // 14.
        //
        console.log('--- err: withdraw 14 ---')
        const [code14, err14] = await to_buyer.rollbackReturnToSent(
            seller_host,
            buyer_did,
            member_did
        )

        if (code14 !== 200) {
            if (code14 == 500) {
                msg = `Error:${METHOD}: seller connect check:ECONNRESET`
            } else {
                msg = `Error:${METHOD}: Invalid request`
            }

            return {
                err: 14,
                msg: msg,
            }
        }

        return {
            err: 12,
            msg: msg,
        }
    }

    // 15.
    //
    conn.end()

    const end = Date.now()
    console.log('/withdraw Time: %d ms', end - start)

    return {
        err: 0,
        msg: document_uuid,
    }

    //console.log("/withdraw accepted");
}

module.exports = {
    withdrawInvoice,
}
