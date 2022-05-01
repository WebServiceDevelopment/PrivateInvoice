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

const express = require('express');
const router = express.Router();
module.exports = router;

// Libraries


// Database 

const config = require('../config.json');
const db = require('../database.js');


const CLIENT_DOCUMENT = "client_document";

const CLIENT_ARCHIVE_DOCUMENT = "client_document_archive";

const SUPPLIER_DOCUMENT = "supplier_document";
const SUPPLIER_ARCHIVE_DOCUMENT = "supplier_document_archive";


// End Points

router.post('/getDocumentClient', async function(req, res) {

    let sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${CLIENT_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    let args = [
        req.body.document_uuid
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
			err : 5,
			msg : "DOCUMENT NOT FOUND FOR USER"
		});
	}

	doc =  JSON.parse(result.document_json);

	res.json({
		err : 0,
		msg : doc
	});

});

router.post('/getDocumentSupplier', async function(req, res) {

    let sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${SUPPLIER_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    let args = [
        req.body.document_uuid
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
			err : 5,
			msg : "DOCUMENT NOT FOUND FOR USER"
		});
	}

	doc =  JSON.parse(result.document_json);

	res.json({
		err : 0,
		msg : doc
	});

});

router.post('/getArchiveDocumentClient', async function(req, res) {

    let sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${CLIENT_ARCHIVE_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    let args = [
        req.body.document_uuid
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
			err : 5,
			msg : "DOCUMENT NOT FOUND FOR USER"
		});
	}

	doc =  JSON.parse(result.document_json);

	res.json({
		err : 0,
		msg : doc
	});

});

router.post('/getArchiveDocumentSupplier', async function(req, res) {

    let sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${SUPPLIER_ARCHIVE_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    let args = [
        req.body.document_uuid
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
			err : 5,
			msg : "DOCUMENT NOT FOUND FOR USER"
		});
	}

	doc =  JSON.parse(result.document_json);

	res.json({
		err : 0,
		msg : doc
	});

});
