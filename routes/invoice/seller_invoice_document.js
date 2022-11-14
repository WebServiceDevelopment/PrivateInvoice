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

// Libraries

const uuidv1 = require('uuid').v1
const uniqid = require('uniqid')
const moment = require('moment')
const currency = require('currency.js')

// Import Modules

const config = require('../../config.json')
const tran = require('../../modules/invoice_sub_transaction.js')

const {
    getMemberInfo,
    getOrganizationInfo,
    insertSellerDraftStatus,
    insertSellerDraftDocument,
} = require('../../modules/invoices_in.js')

// Database

const SELLER_DRAFT_DOCUMENT = 'seller_document_draft'
const SELLER_DRAFT_STATUS = 'seller_status_draft'

// Error Message
const MESSAGE_AFFECTED_ROWS = ':result.affectedRows != 1'

// CURRENCY
const CURRENCY = config.CURRENCY

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * update
 */
router.post('/update', async function (req, res) {
    const METHOD = '/update'

    let start = Date.now()

    let errno, code

    // 1.
    // begin Transaction
    //
    const [conn, _1] = await tran.connection()
    await tran.beginTransaction(conn)

    // 2.
    // Second we update the document

    const [result2, err2] = await tran.updateDraftDocument(
        conn,
        SELLER_DRAFT_DOCUMENT,
        req
    )

    if (err2) {
        console.log(err2)
        errno = 2
        code = 400
        let msg = await tran.rollbackAndReturn(conn, code, err2, errno, METHOD)

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    // 3.
    // And then we update the status

    const [result3, err3] = await tran.updateDraftStatus(
        conn,
        SELLER_DRAFT_STATUS,
        req
    )

    if (err3) {
        console.log(err3)
        errno = 3
        code = 400
        let msg = await tran.rollbackAndReturn(conn, code, err3, errno, METHOD)

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    // 4.
    // commit
    //
    const [_4, err4] = await tran.commit(conn)

    if (err4) {
        errno = 4
        code = 400
        let msg = await tran.rollbackAndReturn(conn, code, err4, errno, METHOD)

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    // 5.
    //
    conn.end()

    let end = Date.now()
    console.log('update Time: %d ms', end - start)

    res.json({ err: 0, msg: 'okay' })
})
