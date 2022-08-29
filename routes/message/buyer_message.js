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

// Import Router

const express = require('express')
const router = express.Router()
module.exports = router

// Import Modules

const sub = require('../../modules/invoice_sub.js')
const tran = require('../../modules/invoice_sub_transaction.js')

// Database

// Table Name
const BUYER__DOCUMENT = 'buyer_document'
const BUYER__STATUS = 'buyer_status'
const CONTACTS = 'contacts'

// ------------------------------- End Points -------------------------------

/*
 * ToConnect
 */
router.post('/buyerToConnect', async (req, res) => {
    const METHOD = '/buyerToConnect'

    const { seller_did, buyer_did } = req.body

    // 1.
    //
    const [seller_host, err] = await sub.getSellerHost(
        CONTACTS,
        seller_did,
        buyer_did
    )
    if (err) {
        let msg = `ERROR:${METHOD}: Could not find host`

        res.status(400).json({
            err: 1,
            msg: msg,
        })
        return
    }

    // 2.
    //
    if (!sub.check_ipadder(req.ip, seller_host)) {
        let msg = `ERROR:${METHOD}: Could not find host`

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    res.status(200).json({
        err: 0,
        msg: 'accepted',
    })

    console.log('/buyerToConnect accepted')
})

/*
 * form seller node <<< [ Send Invoice ]
 *
 * buyerToSend
 */
router.post('/buyerToSend', async (req, res) => {
    const METHOD = '/buyerToSend'

    const { document, status } = req.body
    const { document_uuid, seller_did, buyer_did, document_json } = document

    //console.log(document);
    let errno, code

    // 1.

    // 2.
    // Second we check to see if there is any contact information
    const [_2, err2] = await sub.getSellerHost(CONTACTS, seller_did, buyer_did)

    if (err2) {
        let msg = `ERROR:${METHOD}: Could not find host`

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    // 3.
    // Then we check to see if there is any data already registered
    //
    const [_3, err3] = await sub.checkForExistingDocument(
        BUYER__DOCUMENT,
        document_uuid
    )

    if (err3) {
        let msg = `ERROR:${METHOD}: Could not find Document`

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    /*
     * Convert time format from ISO format to Date format.
     */
    // 4.
    //
    status.due_by = new Date(Date.parse(status.due_by))

    // 5.
    // begin Transaction
    //
    const [conn, _5] = await tran.connection()
    await tran.beginTransaction(conn)

    // 6.
    const [_6, err6] = await tran.insertDocument(
        conn,
        BUYER__DOCUMENT,
        status,
        document_json
    )

    if (err6) {
        console.log('/buyerToSend:err 6')
        errno = 6
        code = 400
        res.status(400).json(tran.rollbackAndReturn(conn, code, err6, errno))
        return
    }

    // 7.
    //
    const [_7, err7] = await tran.insertStatus(conn, BUYER__STATUS, status)

    if (err7) {
        console.log('/buyerToSend:err 7')
        errno = 7
        code = 400
        res.status(400).json(tran.rollbackAndReturn(conn, code, err7, errno))
        return
    }

    // 8.
    // commit
    //
    const [_8, err8] = await tran.commit(conn)

    if (err8) {
        console.log('/buyerToSend:err 8')
        errno = 8
        code = 400
        res.status(400).json(tran.rollbackAndReturn(conn, code, err8, errno))
        return
    }

    // 9.
    //
    conn.end()

    res.status(200).json({
        err: 0,
        msg: 'accepted',
    })

    console.log('/buyerToSend accepted')
})

/*
 * from seller node <<< [ Withdraw ]
 *
 * buyerToWithdraw
 */
router.post('/buyerToWithdraw', async (req, res) => {
    const METHOD = '/buyerToWithdraw'

    const { document_uuid, buyer_did, document_folder } = req.body

    // 1.
    // STATUS
    // First we go ahead and get the status.
    //
    const [old_status, _1] = await sub.getStatus(BUYER__STATUS, document_uuid)

    if (old_status == undefined) {
        let msg = `ERROR:${METHOD}: Record is not exist`

        res.status(400).json({
            err: 1,
            msg: msg,
        })
        return
    }

    // 2.
    // Second we go ahead and get the document
    //
    const [old_document, _2] = await sub.getDocument(
        BUYER__DOCUMENT,
        document_uuid
    )

    if (old_document == undefined) {
        let msg = `ERROR:${METHOD}: Record is not exist`

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    // 3.
    const [_3, err3] = await sub.setWithdrawBuyer(
        BUYER__STATUS,
        document_uuid,
        buyer_did,
        document_folder
    )
    if (err3) {
        let msg = `ERROR:${METHOD}: Record is not exist`

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    res.status(200).json({
        err: 0,
        msg: 'accepted',
    })

    console.log('/buyerToWithdraw accepted')
})

/*
 * buyerRollbackReturnToSent
 */
router.post('/buyerRollbackReturnToSent', async (req, res) => {
    const METHOD = '/buyerRollbackReturnToSent'

    const { document_uuid, buyer_did, document_folder } = req.body

    // 1.
    // STATUS
    // First we go ahead and get the status.
    //
    const [old_status, _1] = await sub.getStatus(BUYER__STATUS, document_uuid)

    if (old_status == undefined) {
        let msg = `ERROR:${METHOD}: Record is not exist`

        res.json({
            err: 0,
            msg: msg,
        })
        return
    }

    // 2.
    // Second we go ahead and get the document
    //
    const [old_document, _2] = await sub.getDocument(
        BUYER__DOCUMENT,
        document_uuid
    )

    if (old_document == undefined) {
        let msg = `ERROR:${METHOD}: Record is not exist`

        res.json({
            err: 0,
            msg: msg,
        })
        return
    }

    // 3.
    const [_3, err3] = await sub.rollbackReturnToSent(
        BUYER__STATUS,
        document_uuid,
        buyer_did,
        document_folder
    )
    if (err3) {
        let msg = `ERROR:${METHOD}: Record is not exist`

        res.json({
            err: 0,
            msg: msg,
        })
        return
    }

    res.status(200).json({
        err: 0,
        msg: 'accepted',
    })

    console.log('/rollbackReturnToSent accepted')
})
