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
const tran                  	= require("./invoice_sub_transaction.js");

// Import Router
const express					= require('express');
const router					= express.Router();
module.exports					= router;

// Libraries

// Database 

// Table Name
const SUPPLIER_DOCUMENT			= "supplier_document";
const SUPPLIER_STATUS			= "supplier_status";

const SUPPLIER_ARCHIVE_DOCUMENT	= "supplier_document_archive";
const SUPPLIER_ARCHIVE_STATUS	= "supplier_status_archive";

const CONTACTS					= "contacts"


// End Points

router.post('/supplierArchive', async function(req, res) {

	let start = Date.now();
 
    const { document_uuid } = req.body;
    const { user_uuid } = req.session.data;

	let err, errno, code;

    // 1.
	//
    const [ client_uuid, err1 ] = await sub.getClientUuid(SUPPLIER_STATUS, document_uuid, user_uuid);

    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).end(err1);
    }

    // 2.
	//
    const [ client_host, err2 ] = await sub.getClientHost(CONTACTS, user_uuid, client_uuid);

    if(err2) {
        console.log("Error 2.status = 400 err="+err2);

        return res.status(400).end(err2);
    }

    // 3.
	// client connect check
	//
    const [ code3, err3 ] = await to_client.connect(client_host, user_uuid, client_uuid);

    if(code3 !== 200) {
        //console.log("Error 3 status = 400 code="+code3);
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
    const [ old_status , _4 ] = await sub.getStatus( SUPPLIER_STATUS, document_uuid) ;

    if(old_status == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

    // 5. Second we go ahead and get the document
    //
	const [ old_document , _5 ] = await sub.getDocument( SUPPLIER_DOCUMENT, document_uuid) ;

    if(old_document == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

	// 6.
	// Does document_uuid already exist in the archive status table?
	//
	const [ _6, err6 ] = await sub.notexist_check( SUPPLIER_ARCHIVE_STATUS, document_uuid)

	if (err6 ) {
        errno = 6;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err6 });
    }

	// 7.
	// Does document_uuid already exist in the archive document table?
	//
	const [ _7, err7 ] = await sub.notexist_check( SUPPLIER_ARCHIVE_DOCUMENT, document_uuid)

	if (err6 ) {
        errno = 7;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err7 });
    }

	// 8.
    // begin Transaction
    //
    const [ conn , _8 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 9.
	// Then we go ahead and insert into the archive status
	//

    old_status.document_folder  = 'paid';
    
    old_status.supplier_archived  = 1;
    old_status.client_archived  = 1;

	const [ _9, err9] = await tran.insertArchiveStatus(conn, SUPPLIER_ARCHIVE_STATUS, old_status);
	if (err ) {
        errno = 9;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err9, errno));
    }

	// 10.
	// And then we need to insert into the archive document 
	//
	const [ _10, err10] = await tran.insertDocument(conn, SUPPLIER_ARCHIVE_DOCUMENT, old_status, old_document.document_json);
	if(err) {
        errno = 10;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err10, errno));
    }

	// 11.
	// Remove recoiored from SUPPLIER_STATUS with docunent_uuid key
	//
	const [ _11, err11 ] = await tran.deleteStatus(conn, SUPPLIER_STATUS, old_status) ;
    if (err11 ) {
        errno = 11;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err11, errno));
    }

	// 12.
	// Remove recoiored from SUPPLIER_DOCUMENT with docunent_uuid key
	//
	const [ _12, err12 ] = await tran.deleteDocument(conn, SUPPLIER_DOCUMENT, old_status) ;
    if (err12 ) {
        errno = 12;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err12, errno));
    }


	// 13.
	//
    const [ code13, err13 ] = await to_client.archive(client_host, document_uuid, client_uuid);
    if(code13 !== 200) {
        errno = 12;
        return res.status(400).json(tran.rollbackAndReturn(conn, code13, err13, errno));
    }

    // 14.
    // commit
    //
	const [ _14 , err14 ] = await tran.commit(conn);

	if(err14) {
        errno = 14;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err14, errno));
	}

	// 15.
	//
	conn.end();

	//console.log("/supplierArchive accepted");

	res.json({
		err : 0,
		msg : old_status.document_uuid
	});

	let end = Date.now();
    console.log("/supplierArchive Time: %d ms", end - start);
	
});
