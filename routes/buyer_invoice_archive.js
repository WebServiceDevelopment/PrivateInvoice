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
const sub						= require("../modules/invoice_sub.js");
const tran                      = require("../modules/invoice_sub_transaction.js");

// Import Router
const express					= require('express');
const router					= express.Router();
module.exports					= router;
const to_seller                 = require("../modules/buyer_to_seller.js");

// Libraries

// Database 

// Table Name

const BUYER_DOCUMENT			= "buyer_document";
const BUYER_STATUS				= "buyer_status";

const BUYER_ARCHIVE_DOCUMENT	= "buyer_document_archive";
const BUYER_ARCHIVE_STATUS		= "buyer_status_archive";

const CONTACTS                  = "contacts";


// ------------------------------- End Points -------------------------------

/*
 * from seller node <<< [ Move to Trash ]
 *
 * buyerToArchive
 */
router.post('/buyerToArchive', async function(req, res) {
	const _NO = "090";

    const FOLDER  = 'paid';

	const { document_uuid } = req.body;

	let   errno, code;

	// 1.
	// getStatus
    // First we go ahead and get the status.
    // Does record exist?
    //
    const [ old_status , _1] = await sub.getStatus( BUYER_STATUS, req.body.document_uuid) ;

	if(old_status == undefined) {
		res.json({
			err : 1,
			msg : 'Record is not exist.'
		});
        return;
	}

    // 2.
    // Second we go ahead and get the document
    // Does record exist?
    //
	const [ old_document, _2 ] = await sub.getDocument( BUYER_DOCUMENT, req.body.document_uuid) ;

	if(old_document == undefined) {
		res.json({
			err : 2,
			msg : 'Record is not exist.'
		});
        return;
	}


    // 3.
    // seller_did in old_status.
    // member_did in old_status.
    //
    const seller_did = old_status.seller_did;
    const member_did = old_status.buyer_did;

    //console.log(" seller_did="+ seller_did+":member_did="+ member_did);

    // 4.
    // getSellerHost
    //
    const [ seller_host, err4 ] = await sub.getSellerHost(CONTACTS, seller_did, member_did);
    if(err4) {
        console.log("Error 4 status = 400 err="+err4 +":NO="+_NO);
        return res
			.status(400)
			.json(err4);
    }

    // 5.
    // Compare Host address and req.ip.
    // Are the two ips the same?
    //
    if(!check_ipadder(req.ip , seller_host)) {
        console.log("invalid request : req.ip="+req.ip+":seller_host="+seller_host);
		let err5 = {err:"invalid host"};
        return res
			.status(400)
			.json(err5);
    }

	// 6.
	// Does document_uuid already notexist in the archive status table?
	//
	const [ bool6, err6 ] = await sub.notexist_check( BUYER_ARCHIVE_STATUS, req.body.document_uuid)

	if ( bool6 == false) {
        return res
			.status(400)
			.json(err6);
	}

	// 7.
	// Does document_uuid already notexist in the archive document table?
	//
	const [ bool7, err7 ] = await sub.notexist_check( BUYER_ARCHIVE_DOCUMENT, req.body.document_uuid)

	if ( bool7 == false) {
        return res
			.status(400)
			.json(err7);
	}


    // 8.
    // begin Transaction
    //
    const [ conn, _8 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 9.
	//

    old_status.document_folder  = FOLDER;
    
    old_status.seller_archived  = 1;
    old_status.buyer_archived  = 1;

	// 10.
	// Then we go ahead and insert into the archive status
	//
	const [ _10, err10 ] = await tran.insertArchiveStatus(conn, BUYER_ARCHIVE_STATUS, old_status);

	if(err10) {
		errno = 10;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err10, errno));
    }

	// 11.
	// And then we need to insert into the archive document 
	//
	const [ _11, err11 ] = await tran.insertArchiveDocument(conn, BUYER_ARCHIVE_DOCUMENT, old_document);

	if(err11) {
		errno = 11;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err11, errno));
    }

	// 12.
	// Remove recoiored from BUYER_STATUS with docunent_uuid key
	//
	const [ _12, err12 ] = await tran.deleteStatus(conn, BUYER_STATUS, old_status) ;

	if(err11) {
		errno = 12;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err12, errno));
    }

	// 13.
	// Remove recoiored from BUYER_DOCUMENT with docunent_uuid key
	//
	const [ _13, err13] = await tran.deleteDocument(conn, BUYER_DOCUMENT, old_status) ;

	if(err13) {
		errno = 13;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err13, errno));
    }


    // 14.
    // commit
    //
	const [ _14, err14] = await tran.commit(conn);

	if (err14) {
		errno = 14;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err14, errno));
	}

	// 15.
	//
	conn.end();

	console.log("buyerToArchive accepted");


	res.json({
		err : 0,
		msg : old_status.document_uuid
	});

});


/*
 * from seller node <<< [ Move to Draft ]
 *
 * buyerToRecreate
 */
router.post('/buyerToRecreate', async function(req, res) {
	const _NO = "091";

	const { document_uuid, seller_did } = req.body;

	const FOLDER = 'trash';

	let errno, code ;

	
	// 1. 
	// OLD STATUS
    // First we go ahead and get the status.
    // Does record exist?
    //
    const [ old_status , _1 ] = await sub.getStatus( BUYER_STATUS, req.body.document_uuid) ;

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
	const [ old_document , _2 ]  = await sub.getDocument( BUYER_DOCUMENT, req.body.document_uuid) ;

	if(old_document == undefined) {

		// status?????????record???????????????

		res.json({
			err : 0,
			msg : "Record is not exist."
		});
        return;
	}


    // 3.
    // member_did
    //
    const member_did = old_status.buyer_did;
    

    // 4.
    // getSellerHost
    //
    const [ seller_host, err4 ] = await sub.getSellerHost(CONTACTS, seller_did, member_did);
    if(err4) {
        console.log("Error 4 status = 400 err="+err4+":NO"+_NO);
        return res
			.status(400)
			.json(err4);
    }

    // 5.
    // Before host apaddress, check  
    //
    if(!check_ipadder(req.ip , seller_host)) {
        console.log("invalid request : req.ip="+req.ip+":seller_host="+seller_host);
		let err5 = {err:"invalid host"};
        return res
			.status(400)
			.json(err5);
    }

	// 6.
	// Does document_uuid already notexist in the archive status table?
	//
	const [bool6, _6] = await sub.notexist_check( BUYER_ARCHIVE_STATUS, req.body.document_uuid)

	if ( bool6 == false) {
		res.json({
			err : 0,
			msg : "document_uuid already exist."
		});
		return;
	}

	// 7.
	// Does document_uuid already notexist in the archive document table?
	//
	const [bool7, _7 ] = await sub.notexist_check( BUYER_ARCHIVE_DOCUMENT, document_uuid)

	if ( bool7 == false) {
		res.json({
			err : 0,
			msg : "document_uuid already exist."
		});
		return;
	}


    // 8.
    // begin Transaction
    //
    const [conn , _8] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 9.
	// Then we go ahead and insert into the archive status
	//
    old_status.document_folder  = FOLDER;
    
    old_status.buyer_archived  = 0;
    old_status.buyer_archived  = 0;

	// 10. 
	//
	const [ _10, err10 ] = await tran.insertArchiveStatus(conn, BUYER_ARCHIVE_STATUS, old_status);

	if(err10) {
		errno = 10;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err10, errno));
    }

	// 11. 
	// And then we need to insert into the archive document 
	//
	const [ _11, err11 ] = await tran.insertArchiveDocument(conn, BUYER_ARCHIVE_DOCUMENT, old_document);
	if(err11) {
		errno = 11;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err11, errno));
    }

	// 12.
	// Remove recoiored from BUYER_STATUS with docunent_uuid key
	//
	const [ _12, err12 ] = await tran.deleteStatus(conn, BUYER_STATUS, old_status) ;
	if(err12) {
		errno = 12;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err12, errno));
    }

	// 13.
	// Remove recoiored from BUYER_DOCUMENT with docunent_uuid key
	//
	const [ _13, err13] = await tran.deleteDocument(conn, BUYER_DOCUMENT, old_status) ;
	if(err13) {
		errno = 13;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err13, errno));
    }

    // 14.
    // commit
    //
    const [ _14, err14] = await tran.commit(conn);

	if (err14) {
        errno = 14;
        code = 400;
        return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err14, errno));
	}

	// 15.
	//
   	conn.end();

	console.log("/buyerToRecreate accepted");


	res.json({
		err : 0,
		msg : old_status.document_uuid
	});

	return;
});

/*
 *
 */
function check_ipadder (req_ip , seller_host) {

	let ip = req_ip.split(":")[3];

	if(seller_host.indexOf(ip) != -1) {
                return true;
	}
	return false;

 }
