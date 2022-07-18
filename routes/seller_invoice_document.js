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

const netUtil 					= require('../modules/netUtil.js');

// Database 

const config 					= require('../config.json');
const db 						= require('../database.js');
const tran                      = require("../modules/invoice_sub_transaction.js");

const SELLER_DRAFT_DOCUMENT	    = "seller_document_draft";
const SELLER_DRAFT_STATUS		= "seller_status_draft";

const SELLER_DOCUMENT 		    = "seller_document";

const SELLER_ARCHIVE_DOCUMENT   = "seller_document_archive";

// Error Message
const MESSAGE_AFFECTED_ROWS 	= "result.affectedRows != 1";

const DEFAULT_SERVER_PORT 		= config.PORT || 3000;

// ------------------------------- End Points -------------------------------

/*
 * update
 */
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
			${SELLER_DRAFT_DOCUMENT}
		SET
			document_body = ?,
			document_totals = ?,
			document_meta = ?,
			subject_line = ?,
			buyer_uuid = ?,
			buyer_membername = ?,
			buyer_details = ?,
			document_json = ?
		WHERE
			document_uuid = ?
	`;

	let args = [
		JSON.stringify(req.body.document_body),
		JSON.stringify(req.body.document_totals),
		JSON.stringify(req.body.document_meta),
		req.body.subject_line
	];


	if(req.body.buyer_details) {
		args.push(req.body.buyer_details.member_uuid);
		args.push(req.body.buyer_details.membername);
		args.push(JSON.stringify(req.body.buyer_details));
	} else {
		args.push(null);
		args.push(null);
		args.push(null);
	}

	args.push(JSON.stringify(req.body.document_json));

	args.push(req.body.document_uuid);


	const [result2, err2 ] = await tran.update(conn, sql, args);
	if (err2) {
		console.log(err2);
		errno = 2;
		code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err2, errno);
		return res.status(400).json({ err : errno, msg : msg });
	}

	// 3.
	//
	if(result2.affectedRows != 1) {
		errno = 3;
		code = 400;
		const err3 = MESSAGE_AFFECTED_ROWS;
		let msg = tran.rollbackAndReturn(conn, code, err3, errno);
		return res.status(400).json({ err : errno, msg : msg });
	}

	// 4.
	// And then we update the status

	sql = `
		UPDATE
			${SELLER_DRAFT_STATUS}
		SET
			subject_line = ?,
			amount_due = ?,
			due_by = ?,
			buyer_uuid = ?,
			buyer_membername = ?,
			buyer_organization = ?
		WHERE
			document_uuid = ?
	`;

	args = [
		req.body.subject_line,
		req.body.document_totals.total,
		req.body.document_meta.due_by
	];

	if(req.body.buyer_details) {
		args.push(req.body.buyer_details.member_uuid);
		args.push(req.body.buyer_details.membername);
		args.push(req.body.buyer_details.organization_name);
	} else {
		args.push(null);
		args.push(null);
		args.push(null);
	}

	args.push(req.body.document_uuid);

	const [	result4 , err4 ] = await tran.update(conn, sql, args);

	if (err4) {
		console.log(err4);
		errno = 4;
		code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err4, errno);
		return res.status(400).json({ err : errno, msg : msg });
	}

	// 5.
	//
	if(result4.affectedRows != 1) {
		errno = 5;
		code = 400;
		const err5 = MESSAGE_AFFECTED_ROWS;
		let msg = tran.rollbackAndReturn(conn, code, err5, errno);
		return res.status(400).json({ err : errno, msg : msg });
	}

    // 6.
    // commit
    //
    const [ _6, err6 ] = await tran.commit(conn);

    if (err6 ) {
        errno = 6;
        code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err6, errno);
		return res.status(400).json({ err : errno, msg : msg });
    }

    // 5.
    //
    conn.end();

	let end = Date.now();
	console.log("update Time: %d ms", end - start);

	res.json({ err : 0, msg : "okay" });

});

/*
 * getDraftDocument
 */
router.post('/getDraftDocument', async function(req, res) {

/*
	let start = Date.now();
*/

	let sql = `
		SELECT
			document_uuid,
			document_json,
			document_type,
			subject_line,
			currency_options,
			seller_uuid,
			seller_membername,
			seller_details,
			buyer_uuid,
			buyer_membername,
			buyer_details,
			created_on,
			document_meta,
			document_body,
			document_totals,
			document_logo
		FROM
			${SELLER_DRAFT_DOCUMENT}
		WHERE
			(seller_uuid = ? OR buyer_uuid = ?)
		AND
			document_uuid = ?
	`;

	let args = [
		req.session.data.member_uuid,
		req.session.data.member_uuid,
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
			msg : "DOCUMENT NOT FOUND FOR MEMBER"
		});
	}

	doc.document_body = JSON.parse(doc.document_body);
	doc.document_meta = JSON.parse(doc.document_meta);
	doc.document_totals = JSON.parse(doc.document_totals);
	doc.seller_details = JSON.parse(doc.seller_details);
	doc.buyer_details = JSON.parse(doc.buyer_details);
	doc.currency_options = JSON.parse(doc.currency_options);
	doc.document_json = JSON.parse(doc.document_json);

/*
	let end = Date.now();
	console.log("DraftDocument Time: %d ms", end - start);
*/

	res.json({
		err : 0,
		msg : doc
	});

});

/*
 * getDocument
 */
router.post('/getDocument', async function(req, res) {

	let start = Date.now();

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
			msg : "DOCUMENT NOT FOUND FOR MEMBER"
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

/*
 * getArchiveDocument
 */
router.post('/getArchiveDocument', async function(req, res) {

	let start = Date.now();

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
			msg : "DOCUMENT NOT FOUND FOR MEMBER"
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


/*
 * create
 */
router.post('/create', async function(req, res) {

	const MAX_ROWS = 10;

	let start = Date.now();

	let errno , code;


	// 1.
	// We go ahead and get the organization information.

	const member_data = {
		organization_name : req.session.data.organization_name,
		organization_postcode : req.session.data.organization_postcode,
		organization_address : req.session.data.organization_address,
		organization_building :req.session.data.organization_building,
		organization_department : req.session.data.organization_department,
		organization_tax_id : req.session.data.organization_tax_id,
		addressCountry : req.session.data.addressCountry,
		addressRegion : req.session.data.addressRegion,
		addressCity : req.session.data.addressCity
	}

	// 2.
	//
	const document_uuid = uuidv1();
	const document_type = 'invoice';
	const document_folder = "draft";
	const prefix = 'inv-';
	const document_number = prefix + uniqid.time();
	const invoiceDate = new Date();
	const due_by = moment(invoiceDate).add(30, 'days').format('YYYY-MM-DD');

	//console.log("Insert Status");
	console.log(due_by);


	// 3.
    // credential_object ()
    // credentialSubject_object ()
    // itemsShipped_object ()
	//

    function credential_object () {
        return {
			"@context": [
				"https://www.w3.org/2018/credentials/v1",
				"https://w3id.org/traceability/v1"
			],
			"id": "did:key:",
			"type": [
				"VerifiableCredential",
				"CommercialInvoiceCertificate"
			],
			"name": "Commercial Invoice Certificate",
			"issuanceDate": "",
			"issuer": {
				"type"					: "Entity",
				"id"					: "did:key:",
				"entityType"			: "Organization",
				"name"					: "",
				"address": {
					"type": [
						"PostalAddress"
					],
					"organizationName"	: "",
					"streetAddress"		: "",
					"addressLocality"	: "",
					"postalCode"		: "",
					"addressCountry"	: "",
                    "addressRegion"		: "",
					"addressCity"		: ""
				}
			},

			"credentialSubject": {}
        }
    }

    function credentialSubject_object () {
        return {
            "type"                  	: "Invoice",
            "customerReferenceNumber"	: "",
            "identifier"            	: "",
            "invoiceNumber"         	: "",
            "invoiceDate"           	: "",
            "purchaseDate"          	: "",

            "seller" : {
                "type"              	: "Organization",
				"id"					: "",
                "name"              	: "",
                "taxId"             	: "",
                "description"       	: "",
                "contactPoint"      	: "",
                "address" : {
                    "type"          	: "PostalAddress",
                    "streetAddress" 	: "",
                    "addressLocality"	: "",
                    "addressCountry"	: "",
                    "addressRegion"		: "",
                    "addressCity"		: ""
                }
            },

            "buyer":{
                "type"              	: "Organization",
				"id"					: "",
                "name"             		: "",
                "taxId"             	: "",
                "description"       	: "",
                "contactPoint"      	: "",
                "address" : {
					"type"				: "PostalAddress",
                    "streetAddress" 	: "",
                    "addressLocality"	: "",
                    "addressCountry"	: "",
                    "addressRegion"		: "",
                    "addressCity"		: ""
                }
            },

            "itemsShipped"  : [],

            "invoiceSubtotal" : {
                "type"					: "PriceSpecification",
                "price"					: 0,
                "priceCurrency"			: "Gwei"
            },

            "totalPaymentDue" : {
                "type"					: "PriceSpecification",
                "price"					: 0,
                "priceCurrency"			: "Gwei"
            },

            "comments" : [
                ""
            ]
        }
    }

    function itemsShipped_object () {
        return {
            "type"						: "TradeLineItem",
            "description"				: "",

            "product":{
                "type"					: "Product",
                "description"			: "",

                "sizeOrAmount":{
                    "type"				: "QuantitativeValue",
                    "unitCode"			: "",
                    "value"				: ""
                },

                "productPrice" : {
                    "type" 				: "PriceSpecification",
                    "price"				: "",
                    "priceCurrency"		: "Gwei"
                }
            },

            "lineItemTotalPrice" : {
                "type"					: "PriceSpecification",
                "price"					: "",
                "priceCurrency"			: "Gwei"
            }
        }
    }


	// 4.
	//
	let credentialSubject = new credentialSubject_object (); 

	credentialSubject.customerReferenceNumber = "";
	credentialSubject.identifier = document_uuid;
	credentialSubject.invoiceNumber = document_number;
	credentialSubject.invoiceDate = invoiceDate;
	credentialSubject.purchaseDate = due_by;
	credentialSubject.itemsShipped = [];
	for( let i=0; i< MAX_ROWS; i++) {
		credentialSubject.itemsShipped[i] = new itemsShipped_object ();
	}


	// 5.1
	//
    let  sql, args, row, org;

/*
	sql = `
        SELECT
            member_uuid as member_uuid,
            membername,
            organization_name,
            organization_address,
            organization_building,
            organization_department,
            organization_tax_id,
			organization_postcode,
            addressCountry,
            addressRegion,
            addressCity,
            wallet_address
        FROM
            members
        WHERE
            member_uuid = ?
    `;
*/
	sql = `
        SELECT
            member_uuid as member_uuid,
            membername,
			organization_uuid,
            wallet_address
        FROM
            members
        WHERE
            member_uuid = ?
    `;

     args = [req.session.data.member_uuid];

     try {
         row = await db.selectOne(sql, args);
     } catch(err) {
		console.log("Create Error 5.1");
		res.json({
			err : 5,
			msg : "This member_uuid is not found."
		});
		return;

     }

	// 5.2
	//
	sql = `
        SELECT
            organization_name,
            organization_address,
            organization_building,
            organization_department,
            organization_tax_id,
			organization_postcode,
            addressCountry,
            addressRegion,
            addressCity
        FROM
            organizations
        WHERE
			organization_uuid = ?
    `;

     args = [row.organization_uuid];

     try {
         org = await db.selectOne(sql, args);
     } catch(err) {
		console.log("Create Error 5.2");
		res.json({
			err : 5,
			msg : "This organization_uuid is not found."
		});
		return;

     }

	// 6.
	//
	let seller = credentialSubject.seller;

	console.log(req.session.data.member_uuid);
	console.log('---- seller ---- ');
	console.log(seller);
	console.log(row);

	seller.id						= row.member_uuid;
/*
	seller.name						= row.organization_name;
	seller.taxId					= row.organization_tax_id;
	seller.description				= row.organization_department;

	seller.address.streetAddress	= row.organization_building;
	seller.address.addressLocality	= row.organization_address;

	seller.address.addressCountry	= row.addressCountry;
	seller.address.addressRegion	= row.addressRegion;
	seller.address.addressCity		= row.addressCity;
*/
	seller.name						= org.organization_name;
	seller.taxId					= org.organization_tax_id;
	seller.description				= org.organization_department;

	seller.address.streetAddress	= org.organization_building;
	seller.address.addressLocality	= org.organization_address;

	seller.address.addressCountry	= org.addressCountry;
	seller.address.addressRegion	= org.addressRegion;
	seller.address.addressCity		= org.addressCity;

	let ip_address = process.env.SERVER_IP_ADDRESS;
	let port = process.env.SERVER_PORT || DEFAULT_SERVER_PORT;
	if( ip_address == null || ip_address == 'undefined') {
		ip_address = netUtil.getLocalIp();

		console.log("ip_address ="+ip_address);
	}
	const contactPoint = row.membername+"@"+ip_address +":"+port

	seller.contactPoint				= contactPoint;

	//console.log("contactPoint="+contactPoint);

	// 7.
	let document_json = new credential_object ();
	document_json.credentialSubject = credentialSubject;


	// 8.
	let issuer = document_json.issuer;
/*
	issuer.name						=  row.organization_name;

	issuer.address.organizationName	= row.organization_name;

	issuer.address.streetAddress	= row.organization_building;
	issuer.address.addressLocality	= row.organization_address;

	issuer.address.postalCode		= row.organization_postcode;

	issuer.address.addressCountry	= row.addressCountry;
	issuer.address.addressRegion	= row.addressRegion;
	issuer.address.addressCity		= row.addressCity;
*/
	issuer.name						= org.organization_name;

	issuer.address.organizationName	= org.organization_name;

	issuer.address.streetAddress	= org.organization_building;
	issuer.address.addressLocality	= org.organization_address;

	issuer.address.postalCode		= org.organization_postcode;

	issuer.address.addressCountry	= org.addressCountry;
	issuer.address.addressRegion	= org.addressRegion;

    // 9.
    // begin Transaction
    //
    const [ conn , _8 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 10.
	//
	sql = `
		INSERT INTO ${SELLER_DRAFT_STATUS} (
			document_uuid,
			document_type,
			document_number,
			document_folder,
			seller_uuid,
			seller_membername,
			seller_organization,
			seller_last_action,
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

	args = [
		document_uuid,
		document_type,
		document_number,
		document_folder,
		req.session.data.member_uuid,
		req.session.data.membername,
		member_data.organization_name,
		due_by,
		currency(0, config.CURRENCY).format(true)
	];

	const [result10 , err10 ] = await tran.insert(conn, sql, args);

	if (err10) {
		console.log(err8);
		errno = 10;
		code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err10.sqlMessage, errno);
		return res.status(400).json({ err : 9, msg : msg });
	}

	// 11.
	//
	if(result10.affectedRows != 1) {
		errno = 11;
		code = 400;
		const err11 = MESSAGE_AFFECTED_ROWS;
		let msg = tran.rollbackAndReturn(conn, code, err11, errno);
		return res.status(400).json({ err : errno, msg : msg });
	}

	// 12.
	//

	sql = `
		INSERT INTO ${SELLER_DRAFT_DOCUMENT} (
			document_uuid,
			document_json,
			document_type,

			currency_options,

			seller_uuid,
			seller_membername,
			seller_details,
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
			?,
			?
		)
	`;

	const document_meta = {
		document_number : document_number,
		created_on : moment().format("YYYY-MM-DD"),
		taxId : member_data.organization_tax_id,
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

	//console.log("req.session.data.member_uuid="+req.session.data.member_uuid);

	args = [
		document_uuid,
		JSON.stringify(document_json),
		document_type,

		JSON.stringify(config.CURRENCY),

		req.session.data.member_uuid,
		req.session.data.membername,
		JSON.stringify(member_data),
		JSON.stringify(document_meta),
		JSON.stringify(document_body),
		JSON.stringify(document_totals)
	];

	//console.log("Insert into Document (execute)");
	//console.log(Date.now());

	const [ result12, err12 ] = await tran.insert(conn, sql, args);

	if (err12) {
		errno = 12;
		code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err12, errno);
		return res.status(400).json({ err : errno, msg : msg });
	}

	// 13.
	//	
	if(result12.affectedRows != 1) {
		errno = 13;
		code = 400;
		const err13 = MESSAGE_AFFECTED_ROWS;
		let msg = tran.rollbackAndReturn(conn, code, err13, errno);
		return res.status(400).json({ err : errno, msg : msg });
	}

    // 14.
    // commit
    //
	const [ _14, err14 ] = await tran.commit(conn);

    if (err14 ) {
        errno = 14;
        code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err14, errno);
		return res.status(400).json({ err : errno, msg : msg });
    }

    // 15.
    //
    conn.end();

	let end = Date.now();
	console.log("Create Time: %d ms", end - start);

	res.json({
		err : 0,
		msg : document_uuid
	});

});
