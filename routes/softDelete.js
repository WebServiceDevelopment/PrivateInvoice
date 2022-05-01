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

// Import Router

const express = require('express');
const router = express.Router();
module.exports = router;

// Libraries

// Database

const db						= require('../database.js');

const CLIENT_ARCHIVE_STATUS		= "client_status_archive";
const SUPPLIER_ARCHIVE_STATUS	= "supplier_status_archive";



// End Points

router.post('/softDeleteSupplier', async function(req, res) {

	const user_uuid				 = "supplier_uuid";
	const archive				= "supplier_archived";
	const table					= SUPPLIER_ARCHIVE_STATUS;

	let sql = `
		UPDATE
			${table}
		SET
			${archive} = 1
		WHERE
			${user_uuid} = ?
		AND
			document_uuid = ?
		AND
			document_folder = 'trash'
		AND
			document_type = 'invoice'
	`;

	let args = [
		req.session.data.user_uuid,
		req.body.document_uuid
	];

	let result;

	try {
		result = await db.update(sql, args);
	} catch(err) {
		return res.json({
			err : 9,
			msg : "Error : SQL execution failed"
		});

	}

	if(result.affectedRows != 1) {
		return res.json({
			err : 1,
			msg : "Incorrect request"
		});

	}

	return res.json({
		err : 0,
		msg : "okay"
	});

});

router.post('/softDeleteClient', async function(req, res) {

	const METHOD = '/softDeleteClient';

	const user_uuid = "client_uuid";
	const archive = "client_archived";
	const table = CLIENT_ARCHIVE_STATUS;

	let sql = `
		UPDATE
			${table}
		SET
			${archive} = 1
		WHERE
			${user_uuid} = ?
		AND
			document_uuid = ?
		AND
			document_folder = 'trash'
		AND
			document_type = 'invoice'
	`;

	let args = [
		req.session.data.user_uuid,
		req.body.document_uuid
	];

	let result;

	try {
		result = await db.update(sql, args);
	} catch(err) {
		return res.json({
			err : 9,
			msg : "Error : SQL execution failed"
		});
	}

	if(result.affectedRows != 1) {
		return res.json({
			err : 1,
			msg : "Incorrect request"
		});

	}

	return res.json({
		err : 0,
		msg : "okay"
	});

});

