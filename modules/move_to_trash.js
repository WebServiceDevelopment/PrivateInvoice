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

"use strict";

// Import sub
const sub                       = require("./invoice_sub.js");
const tran                      = require("./invoice_sub_transaction.js");

// Import Router
const express                   = require('express');
const router                    = express.Router();
module.exports                  = router;

// Libraries

// Database

// Table Name

const BUYER_DOCUMENT            = "buyer_document";
const BUYER_STATUS              = "buyer_status";

const BUYER_ARCHIVE_DOCUMENT    = "buyer_document_archive";
const BUYER_ARCHIVE_STATUS      = "buyer_status_archive";

module.exports = {
	moveToTrash : _moveToTrash
};

// ------------------------------- End Points -------------------------------


/*
 * Execution of'Move to Trash'when folder is draft.
*/

async _moveToTrash(status, document_uuid, seller_did) {

    let msg;

    // 1.
    // STATUS
    // First we go ahead and get the status.
    //
    const [ old_status , _1 ] = await sub.getStatus( status, document_uuid) ;

    if(old_status == undefined) {
        msg : 'Record is not exist.'

        return [msg, 1];
    }

    // 2.
    // Second we go ahead and get the document
    //
    const [ old_document , _2 ] = await sub.getDocument( BUYER_DOCUMENT, document_uuid) ;

    if(old_document == undefined) {

        // status　からrecordを削除する
        msg : "Record is not exist."

        return [msg , 2];
    }

    // 3.
    // Does document_uuid already notexist in the archive status table?
    //
    const [ _3, err3 ] = await sub.notexist_check( BUYER_ARCHIVE_STATUS, document_uuid)

    if (err3 ) {
        msg = "document_uuid exist";

        return [msg , 3];
    }

    // 4.
    // Does document_uuid already notexist in the archive document table?
    //
    const [ _4, err4] = await sub.notexist_check( BUYER_ARCHIVE_DOCUMENT, document_uuid)
    if (err4 ) {
        msg = "document_uuid exist";

        return [msg , 4];
    }

    // 5.
    // begin Transaction
    //
    const [ conn , _5 ] = await tran.connection ();
    await tran.beginTransaction(conn);

    // 6.
    // Then we go ahead and insert into the archive status
    //

    old_status.document_folder  = 'trash';

    //old_status.buyer_archived  = 1;
    //old_status.buyer_archived  = 1;

    // 7.
    const [ _7, err7 ] = await tran.insertArchiveStatus(conn, BUYER_ARCHIVE_STATUS, old_status);
    if (err7 ) {

        return [tran.rollback(conn,err7), 7];
    }

    // 8.
    // And then we need to insert into the archive document
    //
    const [ _8, err8 ] = await tran.insertDocument(conn, BUYER_ARCHIVE_DOCUMENT, old_status, old_document.document_json);
    if(err8) {

        return [tran.rollback(conn,err8), 8];
    }

    // 9.
    // Remove recoiored from BUYER_STATUS with docunent_uuid key
    //
    const [ _9, err9 ] = await tran.deleteStatus(conn, BUYER_STATUS, old_status) ;
    if(err9) {

        return [tran.rollback(conn,err9), 9];
    }

    // 10
    // Remove recoiored from BUYER_DOCUMENT with docunent_uuid key
    //
    const [ _10, err10 ] = await tran.deleteDocument(conn, BUYER_DOCUMENT, old_status) ;
    if(err10) {

        return [tran.rollback(conn,err10), 10];
    }

    // 11.
    // commit
    //
    const [ _11, err11 ] = await tran.commit(conn);

    if (err11) {

        return [tran.rollback(conn,err11), 11];
    }

    // 12.
    //
    conn.end();

    return [null, 0]
}

