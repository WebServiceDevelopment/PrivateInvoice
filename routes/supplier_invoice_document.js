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

const express 					= require('express');
const router 					= express.Router();
module.exports 					= router;

// Libraries

const uuidv1 					= require('uuid').v1;
const uniqid 					= require('uniqid');
const moment 					= require('moment');
const currency 					= require('currency.js');

// Database 

const config 					= require('../config.json');
const db 						= require('../database.js');
const tran                      = require("./invoice_sub_transaction.js");

const SUPPLIER_DRAFT_DOCUMENT	= "supplier_document_draft";
const SUPPLIER_DRAFT_STATUS		= "supplier_status_draft";

const SUPPLIER_DOCUMENT 		= "supplier_document";

const SUPPLIER_ARCHIVE_DOCUMENT = "supplier_document_archive";

// Error Message
const MESSAGE_AFFECTED_ROWS 	= "result.affectedRows != 1";


// End Points

router.post('/update', async function(req, res) {

	let start = Date.now();
	
	let errno , code;

    // 1.
    // begin Transaction
    //
    const [ conn , _1 ] = await tran.connection ();
    await tran.beginTransaction(conn);


	// 2.
	// Second we update the document
	let sql = `
		UPDATE
			${SUPPLIER_DRAFT_DOCUMENT}
		SET
			document_body = ?,
			document_totals = ?,
			document_meta = ?,
			subject_line = ?,
			client_uuid = ?,
			client_username = ?,
			client_details = ?
		WHERE
			document_uuid = ?
	`;

	let args = [
		JSON.stringify(req.body.document_body),
		JSON.stringify(req.body.document_totals),
		JSON.stringify(req.body.document_meta),
		req.body.subject_line
	];

	if(req.body.client_details) {
		args.push(req.body.client_details.user_uuid);
		args.push(req.body.client_details.username);
		args.push(JSON.stringify(req.body.client_details));
	} else {
		args.push(null);
		args.push(null);
		args.push(null);
	}

	args.push(req.body.document_uuid);


	const [result2, err2 ] = await tran.update(conn, sql, args);
	if (err2) {
		errno = 2;
		code = 400;
	    let msg = tran.rollbackAndReturn(conn, code, err2, errno);
		return res.json({ err : errno, msg : msg });
	}

	// 3.
	//
	if(result2.affectedRows != 1) {
		errno = 3;
		code = 400;
		const err3 = MESSAGE_AFFECTED_ROWS;
	    let msg = tran.rollbackAndReturn(conn, code, err3, errno);
		return res.json({ err : errno, msg : msg });
	}

	// 4.
	// And then we update the status

	sql = `
		UPDATE
			${SUPPLIER_DRAFT_STATUS}
		SET
			subject_line = ?,
			amount_due = ?,
			due_by = ?,
			client_uuid = ?,
			client_username = ?,
			client_company = ?
		WHERE
			document_uuid = ?
	`;

	args = [
		req.body.subject_line,
		req.body.document_totals.total,
		req.body.document_meta.due_by
	];

	if(req.body.client_details) {
		args.push(req.body.client_details.user_uuid);
		args.push(req.body.client_details.username);
		args.push(req.body.client_details.company_name);
	} else {
		args.push(null);
		args.push(null);
		args.push(null);
	}

	args.push(req.body.document_uuid);

	const [	result4 , err4 ] = await tran.update(conn, sql, args);

	if (err4) {
		errno = 4;
		code = 400;
	    let msg = tran.rollbackAndReturn(conn, code, err4, errno);
		res.json({ err : errno, msg : msg });
	}

	// 5.
	//
	if(result4.affectedRows != 1) {
		errno = 5;
		code = 400;
		const err5 = MESSAGE_AFFECTED_ROWS;
	    let msg = tran.rollbackAndReturn(conn, code, err5, errno);
		return res.json({ err : errno, msg : msg });
	}

    // 6.
    // commit
    //
    const [ _6, err6 ] = await tran.commit(conn);

    if (err6 ) {
        errno = 6;
        code = 400;
	    let msg = tran.rollbackAndReturn(conn, code, err6, errno);
		return res.json({ err : errno, msg : msg });
    }

    // 5.
    //
    conn.end();

	let end = Date.now();
	console.log("update Time: %d ms", end - start);

	res.json({ err : 0, msg : "okay" });

});

router.post('/getDraftDocument', async function(req, res) {

/*
	let start = Date.now();
*/

	let sql = `
		SELECT
			document_uuid,
			document_type,
			subject_line,
			currency_options,
			supplier_uuid,
			supplier_username,
			supplier_details,
			client_uuid,
			client_username,
			client_details,
			created_on,
			document_meta,
			document_body,
			document_totals,
			document_logo
		FROM
			${SUPPLIER_DRAFT_DOCUMENT}
		WHERE
			(supplier_uuid = ? OR client_uuid = ?)
		AND
			document_uuid = ?
	`;

	let args = [
		req.session.data.user_uuid,
		req.session.data.user_uuid,
		req.body.document_uuid
	];

	let doc;
	try {
		doc = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	if(!doc) {
		return res.json({
			err : 5,
			msg : "DOCUMENT NOT FOUND FOR USER"
		});
	}

	doc.document_body = JSON.parse(doc.document_body);
	doc.document_meta = JSON.parse(doc.document_meta);
	doc.document_totals = JSON.parse(doc.document_totals);
	doc.supplier_details = JSON.parse(doc.supplier_details);
	doc.client_details = JSON.parse(doc.client_details);
	doc.currency_options = JSON.parse(doc.currency_options);

/*
	let end = Date.now();
	console.log("DraftDocument Time: %d ms", end - start);
*/

	res.json({
		err : 0,
		msg : doc
	});

});

router.post('/getDocument', async function(req, res) {

	let start = Date.now();

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

	let end = Date.now();
	console.log("Document Time: %d ms", end - start);

	res.json({
		err : 0,
		msg : doc
	});

});

router.post('/getArchiveDocument', async function(req, res) {

	let start = Date.now();

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

	let end = Date.now();
	console.log("ArchiveDocument Time: %d ms", end - start);

	res.json({
		err : 0,
		msg : doc
	});

});


router.post('/create', async function(req, res) {

	let start = Date.now();

	let errno , code;

    // 1.
    // begin Transaction
    //
    const [ conn , _1 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 2.
	// Second we go ahead and get the company information

	const user_data = {
		company_name : req.session.data.company_name,
		company_postcode : req.session.data.company_postcode,
		company_address : req.session.data.company_address,
		company_building :req.session.data.company_building,
		company_department : req.session.data.company_department,
		company_tax_id : req.session.data.company_tax_id
	}

	const document_uuid = uuidv1();
	const document_type = 'invoice';
	const document_folder = "draft";
	const prefix = 'inv-';
	const document_number = prefix + uniqid.time();
	const due_by = moment().add(30, 'days').format('YYYY-MM-DD');

	//console.log("Insert Status");
	//console.log(Date.now());

	let sql = `
		INSERT INTO ${SUPPLIER_DRAFT_STATUS} (
			document_uuid,
			document_type,
			document_number,
			document_folder,
			supplier_uuid,
			supplier_username,
			supplier_company,
			supplier_last_action,
			subject_line,
			due_by,
			amount_due
		) VALUES (
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			NOW(),
			'',
			?,
			?
		)
	`;

	let args = [
		document_uuid,
		document_type,
		document_number,
		document_folder,
		req.session.data.user_uuid,
		req.session.data.username,
		user_data.company_name,
		due_by,
		currency(0, config.CURENCY).format(true)
	];

	const [result2 , err2 ] = await tran.insert(conn, sql, args);

	if (err2) {
		errno = 2;
		code = 400;
	    let msg = tran.rollbackAndReturn(conn, code, err2, errno);
		return res.json({ err : 2, msg : msg });
	}

	// 3.
	//
	if(result2.affectedRows != 1) {
		errno = 3;
		code = 400;
		const err3 = MESSAGE_AFFECTED_ROWS;
	    let msg = tran.rollbackAndReturn(conn, code, err3, errno);
		return res.json({ err : errno, msg : msg });
	}

	// 4.
	//

	sql = `
		INSERT INTO ${SUPPLIER_DRAFT_DOCUMENT} (
			document_uuid,
			document_type,

			currency_options,

			supplier_uuid,
			supplier_username,
			supplier_details,
			document_meta,
			document_body,
			document_totals
		) VALUES (
			?,
			?,

			?,

			?,
			?,
			?,
			?,
			?,
			?
		)
	`;

	const document_meta = {
		document_number : document_number,
		created_on : moment().format("YYYY-MM-DD"),
		tax_id : user_data.company_tax_id,
		due_by : due_by
	};

	const document_body = [];
	for(let i = 0; i < 10; i++) {
		document_body.push({
			date : "",
			desc : "",
			quan : "",
			unit : "",
			price : "",
			subtotal : ""
		});
	}

	const document_totals = {
		subtotal : currency(0, config.CURRENCY).format(true),
		total : currency(0, config.CURRENCY).format(true)
	};

	//console.log("req.session.data.user_uuid="+req.session.data.user_uuid);

	args = [
		document_uuid,
		document_type,

		JSON.stringify(config.CURRENCY),

		req.session.data.user_uuid,
		req.session.data.username,
		JSON.stringify(user_data),
		JSON.stringify(document_meta),
		JSON.stringify(document_body),
		JSON.stringify(document_totals)
	];

	//console.log("Insert into Document (execute)");
	//console.log(Date.now());

	const [ result4, err4 ] = await tran.insert(conn, sql, args);

	if (err4) {
		errno = 4;
		code = 400;
	    let msg = tran.rollbackAndReturn(conn, code, err4, errno);
		return res.json({ err : errno, msg : msg });
	}

	// 5.
	//	
	if(result4.affectedRows != 1) {
		errno = 5;
		code = 400;
		const err5 = MESSAGE_AFFECTED_ROWS;
	    let msg = tran.rollbackAndReturn(conn, code, err5, errno);
		return res.json({ err : errno, msg : msg });
	}

    // 6.
    // commit
    //
    const [ _6, err6 ] = await tran.commit(conn);

    if (err6 ) {
        errno = 6;
        code = 400;
	    let msg = tran.rollbackAndReturn(conn, code, err6, errno);
		return res.json({ err : errno, msg : msg });
    }

    // 7.
    //
    conn.end();

	let end = Date.now();
	console.log("Create Time: %d ms", end - start);

	res.json({
		err : 0,
		msg : document_uuid
	});

});
