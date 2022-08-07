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

// Import Router
const express                   = require('express');
const router                    = express.Router();
module.exports                  = router;

const { getPrivateKeys }        = require('../modules/verify_utils.js');

// Libraries

// Import Modules
const sub                       = require("../modules/invoice_sub.js");
const tran                      = require("../modules/invoice_sub_transaction.js");
const to_buyer                  = require("../modules/seller_to_buyer.js");

const sign_your_credentials    = require("../modules/sign_your_credentials.js");
const { makePresentation }     = require("../modules/presentations_out.js");
const { createArchiveMessage } = require("../modules/update_status.js");


// Database 

// Table Name
const SELLER_DOCUMENT           = "seller_document";
const SELLER_STATUS             = "seller_status";

const SELLER_ARCHIVE_DOCUMENT   = "seller_document_archive";
const SELLER_ARCHIVE_STATUS     = "seller_status_archive";

const CONTACTS                  = "contacts"



// ------------------------------- End Points -------------------------------


/*
 * 1.
 * [ Move to Archive ]
 */
router.post('/sellerArchive', async function(req, res) {

	const METHOD = '/sellerArchive';

	let start = Date.now();

	const FOLDER  = 'paid';
 
	const { document_uuid } = req.body;
	const { member_did } = req.session.data;

	let err, errno, code;

	// 1.
	//
	const [ buyer_did, err1 ] = await sub.getBuyerDid(SELLER_STATUS, document_uuid, member_did);

	if(err1) {

		let msg = `ERROR:${METHOD}: buyer_did is not found`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}

	// 2.
	//
	const [ buyer_host, err2 ] = await sub.getBuyerHost(CONTACTS, member_did, buyer_did);

	if(err2) {

		let msg = `ERROR:${METHOD}: buyer_did is not found`;

		res.status(400)
			.json({
				err: 2,
				msg: msg
			});
		return;
	}

	// 3.
	// buyer connect check
	
	const [ code3, err3 ] = await to_buyer.connect(buyer_host, member_did, buyer_did);

	if(code3 !== 200) {
		let msg;
		if(code == 500) {
			msg = `ERROR:${METHOD}:buyer connect check:ECONNRESET`;
		} else {
			switch(err3) {
			case "Not found.":
				msg = `ERROR:${METHOD}:The destination node cannot be found`;
			break;
			default:
				msg = `ERROR:${METHOD}: Invalid request`;
			break;
			}
		}

		res.status(400)
				.json({
			err: 3,
				msg: msg
			});
		return;
	}

	// 4.
	// STATUS
	// First we go ahead and get the status.
	//
	const [ old_status , _4 ] = await sub.getStatus( SELLER_STATUS, document_uuid) ;

	if(old_status == undefined) {

		let msg = `ERROR:${METHOD}:Record is not exist`;

		res.status(400)
			.json({
				err: 4,
				msg: msg
			});
		return;
	}

	// 5. Second we go ahead and get the document
	//
	const [ old_document , _5 ] = await sub.getDocument( SELLER_DOCUMENT, document_uuid) ;

	if(old_document == undefined) {

		let msg = `ERROR:${METHOD}:Record is not exist`;

		res.status(400)
			.json({
				err: 4,
				msg: msg
			});
		return;
	}

	// 6.
	// Does document_uuid already exist in the archive status table?
	//
	const [ _6, err6 ] = await sub.notexist_check( SELLER_ARCHIVE_STATUS, document_uuid)

	if (err6 ) {

		let msg = `ERROR:${METHOD}:document_uuid is not exist`;

		res.status(400)
			.json({
				err: 6,
				msg: msg
			});
		return;
	}

	// 7.
	// Does document_uuid already exist in the archive document table?
	//
	const [ _7, err7 ] = await sub.notexist_check( SELLER_ARCHIVE_DOCUMENT, document_uuid)

	if (err7 ) {
		let msg = `ERROR:${METHOD}:document_uuid is not exist`;

		res.status(400)
			.json({
				err: 6,
				msg: msg
			});
		return;
	}

	// 8.
	// begin Transaction
	//
	const [ conn , _8 ] = await tran.connection ();
	await tran.beginTransaction(conn);

	// 9.
	// Then we go ahead and insert into the archive status
	//

	old_status.document_folder  = FOLDER;
	
	old_status.seller_archived  = 1;
	old_status.buyer_archived  = 1;

	const [ _9, err9] = await tran.insertArchiveStatus(conn, SELLER_ARCHIVE_STATUS, old_status);
	if (err ) {
		errno = 9;
		code = 400;
		res.status(400)
			.json(tran.rollbackAndReturn(conn, code, err9, errno, METHOD));
		return;
	}

	// 10.
	// And then we need to insert into the archive document 
	//
	const [ _10, err10] = await tran.insertArchiveDocument(conn, SELLER_ARCHIVE_DOCUMENT, old_document);
	if(err10) {
		//console.log("ERR insertArchiveDocument seller_invoice_archive.js err="+err10)
		//console.log(old_document)
		errno = 10;
		code = 400;
		res.status(400)
			.json(tran.rollbackAndReturn(conn, code, err10, errno, METHOD));
		return;
	}

	// 11.
	// Remove recoiored from SELLER_STATUS with docunent_uuid key
	//
	const [ _11, err11 ] = await tran.deleteStatus(conn, SELLER_STATUS, old_status) ;
	if (err11 ) {
		errno = 11;
		code = 400;
		res.status(400)
			.json(tran.rollbackAndReturn(conn, code, err11, errno, METHOD));
		return;
	}

	// 12.
	// Remove recoiored from SELLER_DOCUMENT with docunent_uuid key
	//
	const [ _12, err12 ] = await tran.deleteDocument(conn, SELLER_DOCUMENT, old_status) ;
	if (err12 ) {
		errno = 12;
		code = 400;
		res.status(400)
			.json(tran.rollbackAndReturn(conn, code, err12, errno, METHOD));
		return;
	}


	// 13.
	//
    const [keyPair, err13] = await getPrivateKeys(member_did);
    if(err13) {
        throw err;
    }

	// 14.
	//
    const url = `${buyer_host}/api/presentations/available`
    const credential = await createArchiveMessage(document_uuid,member_did, keyPair);
    const [ sent, err14 ] = await makePresentation(url, keyPair, credential);
    if(err14) {
		errno = 14;
		code = 400;
		res.status(400)
			.json(tran.rollbackAndReturn(conn, code, err14, errno, METHOD));
        return;
    }

	// 15.
	// commit
	//
	const [ _15 , err15 ] = await tran.commit(conn);

	if(err14) {
		errno = 15;
		code = 400;
		res.status(400)
			.json(tran.rollbackAndReturn(conn, code, err15, errno, METHOD));
		return;
	}

	// 16.
	//
	conn.end();


	// 17.
	//
	res.json({
		err : 0,
		msg : old_status.document_uuid
	});

	//console.log("/sellerArchive accepted");

	let end = Date.now();
	console.log("/sellerArchive Time: %d ms", end - start);
	
});
