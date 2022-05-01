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
const tran						= require("./invoice_sub_transaction.js");


// Import Router
const express					= require('express');
const router					= express.Router();
module.exports					= router;

// Libraries

const uuidv1					= require('uuid').v1;
const uniqid					= require('uniqid');
const moment					= require('moment');

// Database 

// Table Name
const SUPPLIER_DRAFT_DOCUMENT	= "supplier_document_draft";
const SUPPLIER_DRAFT_STATUS		= "supplier_status_draft";

const SUPPLIER_DOCUMENT			= "supplier_document";
const SUPPLIER_STATUS			= "supplier_status";

const SUPPLIER_ARCHIVE_DOCUMENT	= "supplier_document_archive";
const SUPPLIER_ARCHIVE_STATUS	= "supplier_status_archive";

const CONTACTS      			= "contacts"


// End Points

router.post('/send', async function(req, res) {
	const METHOD = "/send";

	let start = Date.now();

    const { document_uuid } = req.body;
    const { user_uuid } = req.session.data;

	let code , errno;

	// 1.
	const [ client_uuid, err1 ] = await sub.getClientUuidForDraft(SUPPLIER_DRAFT_STATUS, document_uuid, user_uuid);
    if(err1) {
		console.log("Error 1.1 status = 400 err="+err1);

        return res.status(400).json(err1);
    }

	// 2.
	const [ client_host, err2 ] = await sub.getClientHost(CONTACTS, user_uuid, client_uuid);
    if(err2) {
		console.log("Error 2 status = 400 err="+err2);
        return res.status(400).json(err2);
    }

	//3. client connect check
    const [ code3 , err3 ] = await to_client.connect(client_host, user_uuid, client_uuid);

    if(code3 !== 200) {
		console.log("Error 3 code="+code3+":err="+err3);
		let msg;
		if(code == 500) {
        	msg = {"err":"client connect check:ECONNRESET"};
		} else {
			msg = {"err":err3};
		}
        return res.status(400).json(msg);
    }

	// 4. 
	// DRAFT_STATUS
	// First we go ahead and get the draft status.
	//
	const [ status , _4 ] = await sub.getStatus( SUPPLIER_DRAFT_STATUS, document_uuid) ;

	if(status.document_uuid == null) {
		console.log("document_uuid is null")

		res.json({ err : 4, msg : 'document_uuid is null' });
		return;
	}

	// 5.
	// Creating Send data.
	//
	status.document_uuid	= document_uuid;
	status.document_type	= 'invoice';
	status.document_folder	= 'sent';


	// 6.
	// Second we go ahead and get the draft document
	//
	const [ document , _6 ] = await sub.getDraftDocument( SUPPLIER_DRAFT_DOCUMENT, document_uuid) ;

	if(document.document_uuid == null) {
		console.log("document_uuid is null")

		res.json({ err : 6, msg : 'document_uuid is null' });
		return;
	}

	// 7.
	// Creating Send data.
	//
	
    document.currency_options = JSON.parse(document.currency_options);
    document.supplier_details = JSON.parse(document.supplier_details);
    document.client_details = JSON.parse(document.client_details);
    document.document_meta = JSON.parse(document.document_meta);
    document.document_body = JSON.parse(document.document_body);
    document.document_totals = JSON.parse(document.document_totals);

	const document_json = JSON.stringify( document );
	//console.log(document_json)

	// 8.
	// Does document_uuid already notexist in the status table?
	//
	const [ _8 , err8 ] = await sub.notexist_check( SUPPLIER_STATUS, document_uuid)
    if ( err8 ) {
        errno = 8;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err8 });
    }

	// 9.
	// Does document_uuid already notexist in the document table?
	//
	const [ _9 , err9 ] = await sub.notexist_check( SUPPLIER_DOCUMENT, document_uuid)
    if ( err9 ) {
        errno = 9;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err9 });
    }

	// 10.
	// begin Transaction
	//
	const [ conn , _10 ] = await tran.connection ();
	await tran.beginTransaction(conn);

	// 11.
	// Then we go ahead and insert into the status
	//
	const [ _11 , err11 ] = await tran.insertStatus(conn, SUPPLIER_STATUS, status);

	if ( err11 ) {
		errno = 11;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err11, errno));
	}


	// 12.
	// And then we need to insert into database
	//
	const [ _12, err12 ] = await tran.insertDocument(conn, SUPPLIER_DOCUMENT, status, document_json);
	if (err12 ) {
		errno = 12;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err12, errno));
	}

	// 13.
	// Remove from SUPPLIER_DRAFT_STATUS with docunent_uuid key
	//
	const [ _13, err13 ] = await tran.deleteStatus(conn, SUPPLIER_DRAFT_STATUS, status) ;
    if ( err13 ) {
		errno = 13;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err13, errno));
    }

	// 14.
	// Remove from SUPPLIER_DRAFT_DOCUMENT with docunent_uuid key
	//
	const [ _14, err14 ] = await tran.deleteDocument(conn, SUPPLIER_DRAFT_DOCUMENT, status) ;
    if (err14 ) {
		errno = 14;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err14, errno));
    }


	// 15.
	// Send 'send' message to client.
	//
    const [ code15, err15 ] = await to_client.sendInvoice(client_host, document, status);
    //console.log(code);
    //console.log(err);

    if(parseInt(code15) !== 200) {
        errno = 15;
        return res.status(400).json(tran.rollbackAndReturn(conn, code15, err15, errno));
    }

	// 16.
	// commit
	//
	const [ _16, err16 ] = await tran.commit(conn);

	if (err16) {
        errno = 16;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err16, errno));
	}

	// 17.
	//
	conn.end();

	//console.log("/send accepted");


	res.json({
		err : 0,
		msg : status.document_uuid
	});

	let end = Date.now();
    console.log("/send Time: %d ms", end - start);

});


router.post('/recreate', async function(req, res) {

	const METHOD = "/recreate";

	let start = Date.now();

    const { document_uuid } = req.body;
    const { user_uuid } = req.session.data;

	let errno , code;

	let status,  document;

	// 1.
	const [ client_uuid, err1 ] = await sub.getClientUuid(SUPPLIER_STATUS, document_uuid, user_uuid);
    if(err1) {
		console.log("Error 1.1 status = 400 err="+err1);

        return res.status(400).end(err1);
    }

	// 2.
	const [ client_host, err2 ] = await sub.getClientHost(CONTACTS, user_uuid, client_uuid);
    if(err2) {
		console.log("Error 1.2 status = 400 err="+err2);
        return res.status(400).end(err2);
    }

	//3. client connect check
    const [ code3, err3 ] = await to_client.connect(client_host, user_uuid, client_uuid);

    if( code3 !== 200) {
		//console.log("Error 3.1 status = 400 code="+code3);
		let msg;
		if(code == 500) {
        	msg = {"err":"client connect check:ECONNRESET"};
		} else {
			msg = {"err":err3};
		}
        return res.status(400).json(msg);
    }

	// 4
	// STATUS
    // First we go ahead and get the status.
    //
    const [ old_status , _4 ] = await sub.getStatus( SUPPLIER_STATUS, document_uuid) ;

	if(old_status.document_uuid == null) {
		console.log("document_uuid is null")

		res.json({
			err : 32,
            msg : 'document_uuid is null'
		});
        return;
	}

    // 5.
    // Creating Draft data.
    //
	let prefix = "inv-";

    status = JSON.parse(JSON.stringify(old_status));
	status.document_uuid	= uuidv1();
    status.document_type    = 'invoice';
    status.document_folder  = 'draft';

	status.document_number = prefix + uniqid.time();
	status.due_by = moment().add(30, 'days').format('YYYY-MM-DD');

    // 6.
    // Second we go ahead and get the document
    //
	const [ old_document , _6 ] = await sub.getDocument( SUPPLIER_DOCUMENT, document_uuid) ;

    if(old_document.document_uuid == null) {
        console.log("document_uuid is null")

        res.json({
            err : 42,
            msg : 'document_uuid is null'
        });
        return;
    }

    // 7.
    // Creating Send data.
    //
    document = JSON.parse(old_document.document_json);

	document.document_uuid = status.document_uuid;
    document.document_type = status.document_type;

	document.document_meta.document_number = status.document_number;
	document.document_meta.due_by = status.due_by;
	document.document_meta.created_on = moment().format("YYYY-MM-DD");

    document.currency_options = JSON.stringify(document.currency_options);
    document.supplier_details = JSON.stringify(document.supplier_details);
    document.client_details = JSON.stringify(document.client_details);
    document.document_meta = JSON.stringify(document.document_meta);
    document.document_body = JSON.stringify(document.document_body);
    document.document_totals = JSON.stringify(document.document_totals);

	// 8.
	// Does document_uuid already notexist in the default status table?
	//
	const [ _8, err8 ] = await sub.notexist_check( SUPPLIER_DRAFT_STATUS, document_uuid)
    if (err8 ) {
        errno = 8;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err8 });
    }

	// 9.
	// Does document_uuid already notexist in the default document table?
	//
	const [ _9, err9 ] = await sub.notexist_check( SUPPLIER_DRAFT_DOCUMENT, document_uuid)
    if (err9 ) {
        errno = 9;
        console.log("Error: "+errno);
        return res.status(400).json({ err : errno, msg : err9 });
    }

    // 10. 
    // begin Transaction
    //
    const [ conn , _10 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 11.
	// Then we go ahead and insert into the draft status
	//

	const [ _11, err11 ] = await tran.insertStatus(conn, SUPPLIER_DRAFT_STATUS, status);

	if (err11 ) {
		errno = 11;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err11, errno));
	}

	// 12.
	// And then we need to insert into the draft document 
	//
	const [ _12, err12 ] = await tran.insertDraftDocument(conn, SUPPLIER_DRAFT_DOCUMENT, document);

	if (err12 ) {
		errno = 12;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err12, errno));
	}

	// 13.
	// Remove from SUPPLIER_STATUS with docunent_uuid key
	//
	const [ _13, err13 ] = await tran.deleteStatus(conn, SUPPLIER_STATUS, old_status) ;

	if (err13 ) {
		errno = 13;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err13, errno));
	}

	// 14.
	// Remove from SUPPLIER_DOCUMENT with docunent_uuid key
	//
	const [ _14 , err14 ] = await tran.deleteDocument(conn, SUPPLIER_DOCUMENT, old_status) ;
    if(err14) {
		errno = 14;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err14, errno));
    }

	// 15.
	// Then we go ahead and insert into the archive status
	//

    old_status.document_folder  = 'trash';
	const [ _15, err15] = await tran.insertStatus(conn, SUPPLIER_ARCHIVE_STATUS, old_status);

    if(err15) {
		errno = 15;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err15, errno));
    }

	// 16.
	// And then we need to insert into the archive document 
	//
	const [ _16 , err16 ] = await tran.insertDocument(conn, SUPPLIER_ARCHIVE_DOCUMENT, old_status, old_document.document_json);

	if(err16) {
		errno = 16;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err16, errno));
    }

	// 17.
	// Send 'recreate' message to client.
	//

    const [ code17, err17 ] = await to_client.recreate(client_host, old_status.document_uuid, old_status.supplier_uuid);

    if(parseInt(code17) !== 200) {
		errno = 17;
        return res.status(400).json(tran.rollbackAndReturn(conn, code17, err17, errno));
    }

    // 18.
    // commit
    //
/*
	try {
    await tran.commit(conn);
    conn.end();

	} catch(err18) {
        errno = 18;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err18, errno));

	}
*/
    const [ _18, err18 ] = await tran.commit(conn);

	if (err18) {
        errno = 18;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err18, errno));

	}

	// 19.
	//
    conn.end();

	//console.log("recreate accepted");

	res.json({
		err : 0,
		msg : status.document_uuid
	});

	let end = Date.now();
    console.log("/recreate Time: %d ms", end - start);

});


router.post('/withdraw', async function(req, res) {

	let start = Date.now();

    const { document_uuid , document_folder } = req.body;
    const { user_uuid } = req.session.data;


	let errno , code;

	// 1.
	//
	const [ client_uuid, err1 ] = await sub.getClientUuid(SUPPLIER_STATUS, document_uuid, user_uuid);

    if(err1) {
		console.log("Error 1 status = 400 err="+err1);

        return res.status(400).end(err1);
    }

	// 2.
	const [ client_host, err2 ] = await sub.getClientHost(CONTACTS, user_uuid, client_uuid);

    if(err2) {
		console.log("Error 2 status = 400 err="+err2);
        return res.status(400).end(err2);
    }

	//3. client connect check
    const [ code3, err3 ] = await to_client.connect(client_host, user_uuid, client_uuid);

    if(code3 !== 200) {
		console.log("Error 3 status = 400 code="+code3);
		let msg;
		if(code3 == 500) {
        	msg = {"err":"client connect check:ECONNRESET"};
		} else {
			msg = {"err":err3};
		}
        return res.status(400).json(msg);
    }

	// 4 
	// STATUS
    // First we go ahead and get the status.
    //
    const [ old_status , _4 ] = await sub.getStatus( SUPPLIER_STATUS, document_uuid) ;

    // Does record exist?
	if(old_status.document_uuid == null) {
		console.log("document_uuid is null")
		errno = 4;

		let msg = { err : errno, msg : document_uuid };

        return res.status(400).json(msg);
	}

	// 5.
	// Does document_uuid already exist in the status table?
	//
	const [ _5, err5] = await sub.exist_check( SUPPLIER_STATUS, document_uuid)

    if (err5 ) {
		console.log("Error 5 status = 400 code="+err5);
        errno = 5;
        return res.status(400).json({ err : err5, code :errno  });
    }

	// 6.
	// Does document_uuid already exist in the document table?
	//
	const [ _6, err6] = await sub.exist_check( SUPPLIER_DOCUMENT, document_uuid)

    if (err6 ) {
		console.log("Error 6 status = 400 code="+err6);
        errno = 6;
        return res.status(400).json({ err : err6, code :errno  });
    }

    // 7.
    // begin Transaction
    //
    const [ conn , _7 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 8.  
	// update status 
	//

	const [ _8, err8] = await tran.setWithdrawSupplier(conn, SUPPLIER_STATUS, document_uuid ,  user_uuid, document_folder);

    if (err8 ) {
		console.log("Error 8 status = 400 code="+err8.msg);
        errno = 8;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err8, errno));
    }

	// 9. 
	// Send 'withdraw" message to client.
	//

    const [ code9, err9 ] = await to_client.withdraw(client_host, old_status.document_uuid, old_status.client_uuid, document_folder);

    if(code9 !== 200) {
		console.log("Error 9 status = 400 code="+err9);
        errno = 9;
        return res.status(400).json(tran.rollbackAndReturn(conn, code9, err9, errno));
    }


    // 10
    // commit
    //
    const [ _10, err10 ] =	await tran.commit(conn);

	if (err10) {
		console.log("Error 10 status = 400 code="+err10);
		errno = 10;
        code = 400;
        let msg = tran.rollbackAndReturn(conn, code, err10, errno);

    // 11.
    //
        const [ code11, err11 ] = await to_client.rollbackReturnToSent(supplier_host, user_uuid, supplier_uuid);

        if(code11 !== 200) {
            console.log("Error 11 code="+code11+":err="+err11);
            if(code11 == 500) {
                msg = {"err":"supplier connect check:ECONNRESET"};
            } else {
                msg = {"err":err11};
            }
        }

        return res.status(400).json(msg);
	}

	// 12.
	//
   	conn.end();

    //console.log("/withdraw accepted");

	res.json({
		err : 0,
		msg : document_uuid
	});

    let end = Date.now();
    console.log("/withdraw Time: %d ms", end - start);

});
