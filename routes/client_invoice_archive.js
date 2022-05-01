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
const tran                      = require("./invoice_sub_transaction.js");

// Import Router
const express					= require('express');
const router					= express.Router();
module.exports					= router;

// Libraries

// Database 

// Table Name

const CLIENT_DOCUMENT			= "client_document";
const CLIENT_STATUS				= "client_status";

const CLIENT_ARCHIVE_DOCUMENT	= "client_document_archive";
const CLIENT_ARCHIVE_STATUS		= "client_status_archive";


// End Points

router.post('/clientToArchive', async function(req, res) {

    const FOLDER  = 'paid';

	let   errno, code;

	// 1.
	// STATUS
    // First we go ahead and get the status.
    // Does record exist?
    //
    const [ old_status , _1] = await sub.getStatus( CLIENT_STATUS, req.body.document_uuid) ;

	if(old_status == undefined) {
		res.json({
			err : 0,
			msg : 'Record is not exist.'
		});
        return;
	}

    // 2.
    // Second we go ahead and get the document
    // Does record exist?
    //
	const [ old_document, _2 ] = await sub.getDocument( CLIENT_DOCUMENT, req.body.document_uuid) ;

	if(old_document == undefined) {
		res.json({
			err : 0,
			msg : 'Record is not exist.'
		});
        return;
	}

	// 3.
	// Does document_uuid already notexist in the archive status table?
	//
	const [bool3, err3] = await sub.notexist_check( CLIENT_ARCHIVE_STATUS, req.body.document_uuid)

	if ( bool3 == false) {
        return res.status(400).json(err3);
	}

	// 4.
	// Does document_uuid already notexist in the archive document table?
	//
	const [bool4, err4] = await sub.notexist_check( CLIENT_ARCHIVE_DOCUMENT, req.body.document_uuid)

	if ( bool4 == false) {
        return res.status(400).json(err4);
	}

    // 5.
    // begin Transaction
    //
    const [conn , _5 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 6.
	// Then we go ahead and insert into the archive status
	//

    old_status.document_folder  = FOLDER;
    
    old_status.client_archived  = 1;
    old_status.client_archived  = 1;

	// 7.
	const [ _7, err7 ] = await tran.insertArchiveStatus(conn, CLIENT_ARCHIVE_STATUS, old_status);

	if(err7) {
		errno = 7;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err7, errno));
    }

	// 8.
	// And then we need to insert into the archive document 
	//
	const [ _8, err8 ] = await tran.insertDocument(conn, CLIENT_ARCHIVE_DOCUMENT, old_status, old_document.document_json);

	if(err8) {
		errno = 8;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err8, errno));
    }

	// 9.
	// Remove recoiored from CLIENT_STATUS with docunent_uuid key
	//
	const [ _9, err9 ] = await tran.deleteStatus(conn, CLIENT_STATUS, old_status) ;

	if(err9) {
		errno = 9;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err9, errno));
    }

	// 10.
	// Remove recoiored from CLIENT_DOCUMENT with docunent_uuid key
	//
	const [ _10, err10] = await tran.deleteDocument(conn, CLIENT_DOCUMENT, old_status) ;

	if(err10) {
		errno = 10;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err10, errno));
    }


    // 11.
    // commit
    //
	const [ _11, err11] = await tran.commit(conn);

	if (err11) {
		errno = 11;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err11, errno));
	}

	// 12.
	//
	conn.end();

	console.log("clientToArchive accepted");


	res.json({
		err : 0,
		msg : old_status.document_uuid
	});

});

router.post('/clientToRecreate', async function(req, res) {

	const FOLDER = 'trash';

	let errno, code ;

	
	// 1 
	// OLD STATUS
    // First we go ahead and get the status.
    // Does record exist?
    //
    const [ old_status , _1 ] = await sub.getStatus( CLIENT_STATUS, req.body.document_uuid) ;

	if(old_status == undefined) {
		res.json({
			err : 0,
			msg : 'Record is not exist.'
		});
        return;
	}

    // 2.
    // Second we go ahead and get the document
    // Does record exist?
    //
	const [ old_document , _2 ]  = await sub.getDocument( CLIENT_DOCUMENT, req.body.document_uuid) ;

	if(old_document == undefined) {

		// status　からrecordを削除する

		res.json({
			err : 0,
			msg : "Record is not exist."
		});
        return;
	}


	// 3.
	// Does document_uuid already notexist in the archive status table?
	//
	const [bool3, _3] = await sub.notexist_check( CLIENT_ARCHIVE_STATUS, req.body.document_uuid)

	if ( bool3 == false) {
		res.json({
			err : 0,
			msg : "document_uuid already exist."
		});
		return;
	}

	// 4.
	// Does document_uuid already notexist in the archive document table?
	//
	const [bool4, _4 ] = await sub.notexist_check( CLIENT_ARCHIVE_DOCUMENT, req.body.document_uuid)

	if ( bool4 == false) {
		res.json({
			err : 0,
			msg : "document_uuid already exist."
		});
		return;
	}

    // 5.
    // begin Transaction
    //
    const [conn , _5] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 6.
	// Then we go ahead and insert into the archive status
	//
    old_status.document_folder  = FOLDER;
    
    old_status.client_archived  = 0;
    old_status.client_archived  = 0;

	// 7. 
	const [ _7, err7 ] = await tran.insertArchiveStatus(conn, CLIENT_ARCHIVE_STATUS, old_status);

	if(err7) {
		errno = 7;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err7, errno));
    }

	// 8. 
	// And then we need to insert into the archive document 
	//
	const [ _8, err8 ] = await tran.insertDocument(conn, CLIENT_ARCHIVE_DOCUMENT, old_status, old_document.document_json);
	if(err8) {
		errno = 8;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err8, errno));
    }

	// 9.
	// Remove recoiored from CLIENT_STATUS with docunent_uuid key
	//
	const [ _9, err9 ] = await tran.deleteStatus(conn, CLIENT_STATUS, old_status) ;
	if(err9) {
		errno = 9;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err9, errno));
    }

	// 10.
	// Remove recoiored from CLIENT_DOCUMENT with docunent_uuid key
	//
	const [ _10, err10] = await tran.deleteDocument(conn, CLIENT_DOCUMENT, old_status) ;
	if(err10) {
		errno = 10;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err10, errno));
    }

    // 11.
    // commit
    //
    const [ _11, err11] = await tran.commit(conn);

	if (err11) {
        errno = 11;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err11, errno));
	}

	// 12.
	//
   	conn.end();

	console.log("/clientToRecreate accepted");


	res.json({
		err : 0,
		msg : old_status.document_uuid
	});

});
