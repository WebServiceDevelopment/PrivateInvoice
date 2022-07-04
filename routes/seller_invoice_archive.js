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
const to_buyer					= require("./seller_to_buyer.js");
const tran				  	= require("./invoice_sub_transaction.js");

// Import Router
const express					= require('express');
const router					= express.Router();
module.exports					= router;

// Libraries

// Database 

// Table Name
const SELLER_DOCUMENT			= "seller_document";
const SELLER_STATUS				= "seller_status";

const SELLER_ARCHIVE_DOCUMENT	= "seller_document_archive";
const SELLER_ARCHIVE_STATUS		= "seller_status_archive";

const CONTACTS					= "contacts"

// Import Sign

const db = require("../database.js");
const sign_your_credentials = require("./sign_your_credentials.js");
const { makePresentation } = require("../modules/presentations_out.js");
const {
    createArchiveMessage,
} = require("../modules/update_status.js");

const getPrivateKeys = async (member_did) => {
    const sql = `
        SELECT
            public_key
        FROM
            privatekeys
        WHERE
            member_did = ?
    `;

    const args = [member_did];

    let row;
    try {
        row = await db.selectOne(sql, args);
    } catch (err) {
        return [null, err];
    }

    const keyPair = JSON.parse(row.public_key);
    return [keyPair, null];
};


// ------------------------------- End Points -------------------------------


/*
 * [ Move to Archive ]
 */
router.post('/sellerArchive', async function(req, res) {
	const _NO = "190";

	let start = Date.now();

	const FOLDER  = 'paid';
 
	const { document_uuid } = req.body;
	const { member_uuid } = req.session.data;

	const USE_PRESENTATION = true;
	let err, errno, code;

	// 1.
	//
	const [ buyer_uuid, err1 ] = await sub.getBuyerUuid(SELLER_STATUS, document_uuid, member_uuid);

	if(err1) {
		console.log("Error 1 status = 400 err="+err1);

		return res.status(400).end(err1);
	}

	// 2.
	//
	const [ buyer_host, err2 ] = await sub.getBuyerHost(CONTACTS, member_uuid, buyer_uuid);

	if(err2) {
		console.log("Error 2.status = 400 err="+err2);

		return res.status(400).end(err2);
	}

	// 3.
	// buyer connect check
	
	if(!USE_PRESENTATION) {

	   	const [ code3, err3 ] = await to_buyer.connect(buyer_host, member_uuid, buyer_uuid);

		if(code3 !== 200) {
			//console.log("Error 3 status = 400 code="+code3);
			let msg;
			if(code == 500) {
				msg = {"err":"buyer connect check:ECONNRESET"};
			} else {
				switch(err3) {
				case "Not found.":
					msg = {"err":"The destination node cannot be found."};
				break;
				default:
					msg = {"err":err3};
				break;
				}
			}
			return res.status(400).json(msg);
		}
	}

	// 4.
	// STATUS
	// First we go ahead and get the status.
	//
	const [ old_status , _4 ] = await sub.getStatus( SELLER_STATUS, document_uuid) ;

	if(old_status == undefined) {
		res.json({
			err : 0,
			msg : 'Record is not exist.'
		});
		return;
	}

	// 5. Second we go ahead and get the document
	//
	const [ old_document , _5 ] = await sub.getDocument( SELLER_DOCUMENT, document_uuid) ;

	if(old_document == undefined) {
		res.json({
			err : 0,
			msg : 'Record is not exist.'
		});
		return;
	}
	//console.log("here 1")
	//console.log(old_document)

	// 6.
	// Does document_uuid already exist in the archive status table?
	//
	const [ _6, err6 ] = await sub.notexist_check( SELLER_ARCHIVE_STATUS, document_uuid)

	if (err6 ) {
		errno = 6;
		console.log("Error: "+errno);
		return res.status(400).json({ err : errno, msg : err6 });
	}

	// 7.
	// Does document_uuid already exist in the archive document table?
	//
	const [ _7, err7 ] = await sub.notexist_check( SELLER_ARCHIVE_DOCUMENT, document_uuid)

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

	old_status.document_folder  = FOLDER;
	
	old_status.seller_archived  = 1;
	old_status.buyer_archived  = 1;

	const [ _9, err9] = await tran.insertArchiveStatus(conn, SELLER_ARCHIVE_STATUS, old_status);
	if (err ) {
		errno = 9;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err9, errno));
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
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err10, errno));
	}

	// 11.
	// Remove recoiored from SELLER_STATUS with docunent_uuid key
	//
	const [ _11, err11 ] = await tran.deleteStatus(conn, SELLER_STATUS, old_status) ;
	if (err11 ) {
		errno = 11;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err11, errno));
	}

	// 12.
	// Remove recoiored from SELLER_DOCUMENT with docunent_uuid key
	//
	const [ _12, err12 ] = await tran.deleteDocument(conn, SELLER_DOCUMENT, old_status) ;
	if (err12 ) {
		errno = 12;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err12, errno));
	}


	// 13.
	
	if(!USE_PRESENTATION) {

		const [ code13, err13 ] = await to_buyer.archive(buyer_host, document_uuid, buyer_uuid);
		if(code13 !== 200) {
			errno = 12;
			return res.status(400).json(tran.rollbackAndReturn(conn, code13, err13, errno));
		}

	} else {

        const [keyPair, err] = await getPrivateKeys(member_uuid);
        if(err) {
            throw err;
        }

        const url = `${buyer_host}/api/presentations/available`
        const credential = await createArchiveMessage(document_uuid,member_uuid, keyPair);
        const [ sent, err13 ] = await makePresentation(url, keyPair, credential);
        if(err13) {
            return res.status(400).json(tran.rollbackAndReturn(conn, 'code13', err13, 13));
        }

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

	//console.log("/sellerArchive accepted");

	res.json({
		err : 0,
		msg : old_status.document_uuid
	});

	let end = Date.now();
	console.log("/sellerArchive Time: %d ms", end - start);
	
});
