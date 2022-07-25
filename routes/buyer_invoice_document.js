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

const express					= require('express');
const router					= express.Router();
module.exports					= router;

// Libraries


// Database 

const config					= require('../config.json');
const db						= require('../database.js');


const BUYER_DOCUMENT			= "buyer_document";

const BUYER_ARCHIVE_DOCUMENT	= "buyer_document_archive";

const SELLER_DOCUMENT 			= "seller_document";
const SELLER_ARCHIVE_DOCUMENT	= "seller_document_archive";


// ------------------------------- End Points -------------------------------

/*
 * 1.
 * getDocumentBuyer
 */
router.get('/getDocumentBuyer', async function(req, res) {

    let sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${BUYER_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    let args = [
        req.query.document_uuid
    ];

	let result;
	let doc;
	try {
		result = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	if(!result) {
		console.log("Buyer DOCUMENT NOT FOUND FOR MEMBER:"+req.query.document_uuid)
		return res.json({
			err : 2,
			msg : "Buyer DOCUMENT NOT FOUND FOR MEMBER"
		});
	}

	doc = {};
	doc.document_json =  JSON.parse(result.document_json);

	res.json({
		err : 0,
		msg : doc
	});

});

/*
 * 2.
 * getDocumentSeller
 */
router.get('/getDocumentSeller', async function(req, res) {

    let sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${SELLER_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    let args = [
        req.query.document_uuid
    ];

	let result;
	let doc;
	try {
		result = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	if(!result) {
		console.log("seller DOCUMENT NOT FOUND FOR MEMBER:"+req.query.document_uuid)
		return res.json({
			err : 2,
			msg : "Seller DOCUMENT NOT FOUND FOR MEMBER"
		});
	}

	doc = {};
	doc.document_json = JSON.parse(result.document_json);

	res.json({
		err : 0,
		msg : doc
	});

});

/*
 * 3.
 * getArchiveDocumentBuyer
 */
router.get('/getArchiveDocumentBuyer', async function(req, res) {

    let sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${BUYER_ARCHIVE_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    let args = [
        req.query.document_uuid
    ];

	let result;
	let doc;
	try {
		result = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	if(!result) {
		return res.json({
			err : 2,
			msg : "Buyer DOCUMENT NOT FOUND FOR MEMBER"
		});
	}

	doc = {};
	doc.document_json =  JSON.parse(result.document_json);

	res.json({
		err : 0,
		msg : doc
	});

});

/*
 * 4.
 * getArchiveDocumentSeller
 */
router.get('/getArchiveDocumentSeller', async function(req, res) {

    let sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${SELLER_ARCHIVE_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    let args = [
        req.query.document_uuid
    ];

	let result;
	let doc;
	try {
		result = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	if(!result) {
		return res.json({
			err : 2,
			msg : "Seller DOCUMENT NOT FOUND FOR MEMBER"
		});
	}

	doc = {};
	doc.document_json =  JSON.parse(result.document_json);

	res.json({
		err : 0,
		msg : doc
	});

});
