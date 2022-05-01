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
const sub						= require("./invoice_sub.js");
const to_client					= require("./supplier_to_client.js");
const tran                      = require("./invoice_sub_transaction.js");

// Import Router
const express					= require('express');
const router					= express.Router();
module.exports					= router;

// Libraries

// Database 

// Table Name
const SUPPLIER_DRAFT_DOCUMENT	= "supplier_document_draft";
const SUPPLIER_DRAFT_STATUS		= "supplier_status_draft";

const SUPPLIER_DOCUMENT			= "supplier_document";
const SUPPLIER_STATUS			= "supplier_status";

const SUPPLIER_ARCHIVE_DOCUMENT = "supplier_document_archive";
const SUPPLIER_ARCHIVE_STATUS	= "supplier_status_archive";

const CONTACTS					= "contacts"


// End Points
/*
 * Execution of'Move to Trash'when folder is draft.
*/

router.post('/trashDraft', async function(req, res) {

    //console.log("/trashDraft");

	let err, errno, code;

	let start = Date.now();

	// 1.
	// STATUS
    // First we go ahead and get the status.
    //
   const [ old_status , _1 ] = await sub.getStatus( SUPPLIER_DRAFT_STATUS, req.body.document_uuid) ;

    if(old_status == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

    // 2.
    // Second we go ahead and get the document
    //
	const [ old_document , _2 ] = await sub.getDraftDocument( SUPPLIER_DRAFT_DOCUMENT, req.body.document_uuid) ;

    if(old_document == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

	// 3.
    // Creating Send data.
    //

    old_document.currency_options = JSON.parse(old_document.currency_options);
    old_document.supplier_details = JSON.parse(old_document.supplier_details);
    old_document.client_details = JSON.parse(old_document.client_details);
    old_document.document_meta = JSON.parse(old_document.document_meta);
    old_document.document_body = JSON.parse(old_document.document_body);
    old_document.document_totals = JSON.parse(old_document.document_totals);

    const document_json = JSON.stringify( old_document );

	// 4.
	// Does document_uuid already notexist in the archive status table?
	//
	const [ _4, err4 ] = await sub.notexist_check( SUPPLIER_ARCHIVE_STATUS, req.body.document_uuid)
    if (err4 ) {
        errno = 4;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err4 });
    }

	// 5.
	// Does document_uuid already notexist in the archive document table?
	//
	const [ _5, err5 ] = await sub.notexist_check( SUPPLIER_ARCHIVE_DOCUMENT, req.body.document_uuid)
    if (err ) {
        errno = 5;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err5 });
    }

    // 6.
    // begin Transaction
    //
    const [ conn , err6 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 7.
	// Then we go ahead and insert into the archive status
	//

    old_status.document_folder  = 'trash';
    
    //old_status.supplier_archived  = 1;
    //old_status.client_archived  = 1;

	// Because SUPPLIER_ARCHIVE_DOCUMEN client_uuid do not accept null.
    old_status.client_uuid  = "";

	// 8.
	//
	const [ _8, err8 ] = await tran.insertArchiveStatus(conn, SUPPLIER_ARCHIVE_STATUS, old_status);

    if(err8) {
        errno = 8;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err8, errno));
	}

	// 9.
	// And then we need to insert into the archive document 
	//
	const [ _9, err9] = await tran.insertDocument(conn, SUPPLIER_ARCHIVE_DOCUMENT, old_status, document_json);

	if(err9) {
        errno = 9;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err9, errno));
	}

	// 10.
	// Remove recoiored from SUPPLIER_DRAFT_STATUS with docunent_uuid key
	//
	const [ _10, err10] = await tran.deleteStatus(conn, SUPPLIER_DRAFT_STATUS, old_status) ;
	if(err10) {
        errno = 10;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err10, errno));
	}

	// 11.
	// Remove recoiored from SUPPLIER_DRAFT_DOCUMENT with docunent_uuid key
	//
	const [ _11, err11] = await tran.deleteDocument(conn, SUPPLIER_DRAFT_DOCUMENT, old_status) ;
	if(err11) {
        errno = 11;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err11, errno));
	}

    // 12.
    // commit
    //
/*
	try {
		await tran.commit(conn);
	    conn.end();

	} catch (err12) {
		errno = 12;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err12, errno));
	}
*/
	const [ _12, err12] = await tran.commit(conn);

	if (err12) {
		errno = 12;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err12, errno));
	}

	// 13.
	//
	conn.end();

	res.json({
		err : 0,
		msg : old_status.document_uuid
	});

	let end = Date.now();
    console.log("/TrashDraft Time: %d ms", end - start);

});

/*
 * Execution of 'Move to Trash' when folder is returned.
*/

router.post('/trash', async function(req, res) {

    //console.log("trash");
	let start = Date.now();

	const { document_uuid } = req.body;
	const { user_uuid } = req.session.data;

	let err , errno, code;

    // 1.
    const [ client_uuid, err1 ] = await sub.getClientUuid(SUPPLIER_STATUS, document_uuid, user_uuid);
    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).end(err1);
    }

    // 2
    const [ client_host, err2 ] = await sub.getClientHost(CONTACTS, user_uuid, client_uuid);
    if(err2) {
        console.log("Error 2 status = 400 err="+err2);
        return res.status(400).end(err2);
    }

	//3. client connect check
    const [ code3, err3 ] = await to_client.connect(client_host, user_uuid, client_uuid);
    if(code3 !== 200) {
        let msg;
        if(code == 500) {
            msg = {"err":"client connect check:ECONNRESET"};
        } else {
            msg = {"err":err3};
        }
        return res.status(400).json(msg);
    }

	// 4.
	// STATUS
    // First we go ahead and get the status.
    //
    const [ old_status , _4 ] = await sub.getStatus( SUPPLIER_STATUS, req.body.document_uuid) ;

    if(old_status == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

    // 5.
    // Second we go ahead and get the document
    //
	const [ old_document , _5 ]  = await sub.getDocument( SUPPLIER_DOCUMENT, req.body.document_uuid) ;

    if(old_document == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

	// 6. 
	// Does document_uuid not exist in the archive status table yet?
	//
	const [ _6, err6] = await sub.notexist_check( SUPPLIER_ARCHIVE_STATUS, req.body.document_uuid)
    if (err6 ) {
        errno = 6;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err6 });
    }

	// 7.
	// Does document_uuid not exist in the archive document table yet?
	//
	const [ _7, err7] = await sub.notexist_check( SUPPLIER_ARCHIVE_DOCUMENT, req.body.document_uuid)
    if (err7 ) {
        errno = 7;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err7 });
    }

    // 8.
    // begin Transaction
    //
    const [ conn , err8 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 9.
	// Then we go ahead and insert into the archive status
	//

    old_status.document_folder  = 'trash';
    
    //old_status.supplier_archived  = 1;
    //old_status.client_archived  = 1;

	// 10.
	const [ _10, err10 ] = await tran.insertArchiveStatus(conn, SUPPLIER_ARCHIVE_STATUS, old_status);

	if (err10 ) {
        errno = 10;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err10, errno));
    }

	// 11.
	// And then we need to insert into the archive document 
	//
	const [ _11, err11 ] = await tran.insertDocument(conn, SUPPLIER_ARCHIVE_DOCUMENT, old_status, old_document.document_json);

	if(err11) {
        errno = 11;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err11, errno));
    }

	// 12.
	// Remove recoiored from SUPPLIER_STATUS with docunent_uuid key
	//
	const [ _12, err12 ] = await tran.deleteStatus(conn, SUPPLIER_STATUS, old_status) ;
    if(err) {
        errno = 12;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err12, errno));
    }

	// 13.
	// Remove recoiored from SUPPLIER_DOCUMENT with docunent_uuid key
	//
	const [ _13, err13] = await tran.deleteDocument(conn, SUPPLIER_DOCUMENT, old_status) ;
    if(err13) {
        errno = 13;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err13, errno));
    }

	// 14.
    //
    const [ code14, err14 ] = await to_client.trash(client_host, old_status.document_uuid, old_status.supplier_uuid);

    if(code14 !== 200) {
        errno = 14;
        return res.status(400).json(tran.rollbackAndReturn(conn, code14, err14, errno));
    }

    // 15.
    // commit
    //
	const [ _15, err15 ] = await tran.commit(conn);

	if (err15) {
		errno = 15;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err15, errno));
	}

	// 16.
	//
	conn.end();

    //console.log("/trash accepted");

	res.json({
		err : 0,
		msg : old_status.document_uuid
	});

	let end = Date.now();
    console.log("/Trash Time: %d ms", end - start);

});
