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

// Import sub
const sub = require('../../modules/invoice_sub.js')
const tran = require('../../modules/invoice_sub_transaction.js')
const to_buyer = require('../../modules/seller_to_buyer.js')

// Import Router
const express = require('express')
const router = express.Router()
module.exports = router

// Libraries

const sign_your_credentials = require('../../modules/sign_your_credentials.js')
const { makePresentation } = require('../../modules/presentations_out.js')
const { createTrashMessage } = require('../../modules/update_status.js')

const { getPrivateKeys } = require('../../modules//verify_utils.js')

// Database

// Table Name
const SELLER_DRAFT_DOCUMENT = 'seller_document_draft'
const SELLER_DRAFT_STATUS = 'seller_status_draft'

const SELLER_DOCUMENT = 'seller_document'
const SELLER_STATUS = 'seller_status'

const SELLER_ARCHIVE_DOCUMENT = 'seller_document_archive'
const SELLER_ARCHIVE_STATUS = 'seller_status_archive'

const CONTACTS = 'contacts'

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * Execution of'Move to Trash'when folder is draft.
 */

router.post('/trashDraft', async function (req, res) {
    const METHOD = '/trashDraft'

    let errno, code
    let start = Date.now()

    // 1.
    //const [buyer_did, err1] = await sub.getBuyerDidForDraft(
    const [buyer_did, err1] = await sub.getBuyerDidForDraft(
        SELLER_DRAFT_STATUS,
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
    // STATUS
    // First we go ahead and get the status.
    //
    const [old_status, _1] = await sub.getStatus(
        SELLER_DRAFT_STATUS,
        document_uuid
    )

    if (old_status == undefined) {
        let msg = `Error:${METHOD}: Status record is not exist.`

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    // 3.
    // Second we go ahead and get the document
    //

    const [document] = await sub.getDraftDocumentForSend(
        SELLER_DRAFT_DOCUMENT,
        document_uuid
    )
    if (document.document_uuid == null) {
        let msg = `Error:${METHOD}: document_uuid is null`

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    document.seller_did = member_did
    document.buyer_did = buyer_did

    // 4.
    // Creating Send data.
    //

    const [keyPair] = await getPrivateKeys(member_did)
    const signedCredential = await sign_your_credentials.signInvoice(
        document.document_uuid,
        document.document_json,
        keyPair
    )

    const document_json = JSON.stringify(signedCredential)

    // 5.
    // Does document_uuid already notexist in the archive status table?
    //
    const [_5, err5] = await sub.notexist_check(
        SELLER_ARCHIVE_STATUS,
        document_uuid
    )
    if (err5) {
        let msg = `Err:r:${METHOD}: document_uuid record is not exist.`

        res.status(400).json({
            err: 5,
            msg: msg,
        })
        return
    }

    // 6.
    // Does document_uuid already notexist in the archive document table?
    //
    const [_6, err6] = await sub.notexist_check(
        SELLER_ARCHIVE_DOCUMENT,
        document_uuid
    )
    if (err6) {
        let msg = `Err:r:${METHOD}: document_uuid record is not exist.`

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
    // Then we go ahead and insert into the archive status
    //

    old_status.document_folder = 'trash'

    //old_status.seller_archived  = 1;
    //old_status.buyer_archived  = 1;

    // Because SELLER_ARCHIVE_DOCUMEN buyer_did do not accept null.
    old_status.buyer_did = ''

    // 9.
    //
    const [_9, err9] = await tran.insertArchiveStatus(
        conn,
        SELLER_ARCHIVE_STATUS,
        old_status
    )

    if (err9) {
        errno = 9
        code = 400
        let msg = `Err:r:${METHOD}: document_uuid record is not exist.`
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err9, errno, METHOD)
        )
        return
    }

    // 10.
    // And then we need to insert into the archive document
    //
    const [_10, err10] = await tran.insertDocument(
        conn,
        SELLER_ARCHIVE_DOCUMENT,
        old_status,
        document_json
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
    // Remove recoiored from SELLER_DRAFT_STATUS with docunent_uuid key
    //
    const [_11, err11] = await tran.deleteStatus(
        conn,
        SELLER_DRAFT_STATUS,
        old_status
    )
    if (err11) {
        errno = 11
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err11, errno, METHOD)
        )
        return
    }

    // 12.
    // Remove recoiored from SELLER_DRAFT_DOCUMENT with docunent_uuid key
    //
    const [_12, err12] = await tran.deleteDocument(
        conn,
        SELLER_DRAFT_DOCUMENT,
        old_status
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
    // commit
    //
    const [_13, err13] = await tran.commit(conn)

    if (err13) {
        errno = 13
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err13, errno, METHOD)
        )
        return
    }

    // 14.
    //
    conn.end()

    res.json({
        err: 0,
        msg: old_status.document_uuid,
    })

    let end = Date.now()

    console.log('/TrashDraft Time: %d ms', end - start)
})
