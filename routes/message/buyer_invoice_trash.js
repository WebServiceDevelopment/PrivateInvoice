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

// Import Modules
const sub = require('../../modules/invoice_sub.js')
const tran = require('../../modules/invoice_sub_transaction.js')

// Database

// Table Name

const BUYER_DOCUMENT = 'buyer_document'
const BUYER_STATUS = 'buyer_status'

const BUYER_ARCHIVE_DOCUMENT = 'buyer_document_archive'
const BUYER_ARCHIVE_STATUS = 'buyer_status_archive'

// ------------------------------- End Points -------------------------------

/*
 * Execution of'Move to Trash'when folder is draft.
 */

/*
 * Execution of 'Move to Trash' when folder is returned.
 */

router.post('/buyerToTrash', async function (req, res) {
    const METHOD = '/buyerToTrash'

    let start = Date.now()

    let err, errno, code

    // 1.
    // STATUS
    // First we go ahead and get the status.
    //
    const [old_status, _1] = await sub.getStatus(
        BUYER_STATUS,
        req.body.document_uuid
    )

    if (old_status == undefined) {
        let msg = `ERROR:${METHOD}: Record is not exist`

        return res.status(400).json({
            err: 1,
            msg: msg,
        })
    }

    // 2.
    // Second we go ahead and get the document
    //
    const [old_document, _2] = await sub.getDocument(
        BUYER_DOCUMENT,
        req.body.document_uuid
    )

    if (old_document == undefined) {
        let msg = `ERROR:${METHOD}: Record is not exist`

        return res.status(400).json({
            err: 2,
            msg: msg,
        })
    }

    // 3.
    // Does document_uuid already notexist in the archive status table?
    //
    const [_3, err3] = await sub.notexist_check(
        BUYER_ARCHIVE_STATUS,
        req.body.document_uuid
    )

    if (err3) {
        let msg = `ERROR:${METHOD}: document_uuid is not exist`

        return res.status(400).json({
            err: 3,
            msg: msg,
        })
    }

    // 4.
    // Does document_uuid already notexist in the archive document table?
    //
    const [_4, err4] = await sub.notexist_check(
        BUYER_ARCHIVE_DOCUMENT,
        req.body.document_uuid
    )
    if (err4) {
        let msg = `ERROR:${METHOD}: document_uuid is not exist`

        return res.status(400).json({
            err: 4,
            msg: msg,
        })
    }

    // 5.
    // begin Transaction
    //
    const [conn, _5] = await tran.connection()
    await tran.beginTransaction(conn)

    // 6.
    // Then we go ahead and insert into the archive status
    //

    old_status.document_folder = 'trash'

    //old_status.buyer_archived  = 1;
    //old_status.buyer_archived  = 1;

    // 7.
    const [_7, err7] = await tran.insertArchiveStatus(
        conn,
        BUYER_ARCHIVE_STATUS,
        old_status
    )
    if (err7) {
        errno = 7
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err7, errno, METHOD)
        )
        return
    }

    // 8.
    // And then we need to insert into the archive document
    //
    const [_8, err8] = await tran.insertDocument(
        conn,
        BUYER_ARCHIVE_DOCUMENT,
        old_status,
        old_document.document_json
    )
    if (err8) {
        errno = 8
        code = 400
        res.status(400).json(tran.rollbackAndReturn(conn, code, err7, errno))
        return
    }

    // 9.
    // Remove recoiored from BUYER_STATUS with docunent_uuid key
    //
    const [_9, err9] = await tran.deleteStatus(conn, BUYER_STATUS, old_status)
    if (err9) {
        errno = 9
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err9, errno, METHOD)
        )
        return
    }

    // 10
    // Remove recoiored from BUYER_DOCUMENT with docunent_uuid key
    //
    const [_10, err10] = await tran.deleteDocument(
        conn,
        BUYER_DOCUMENT,
        old_status
    )
    if (err10) {
        errno = 10
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err10, errno, METHOD)
        )
        return
    }

    // 11.
    // commit
    //
    const [_11, err11] = await tran.commit(conn)

    if (err11) {
        errno = 11
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err11, errno, METHOD)
        )
        return
    }

    // 12.
    //
    conn.end()

    //console.log("buyerToRash accepted");

    res.json({
        err: 0,
        msg: old_status.document_uuid,
    })

    let end = Date.now()
    console.log('/buyerToTrash Time: %d ms', end - start)
})
