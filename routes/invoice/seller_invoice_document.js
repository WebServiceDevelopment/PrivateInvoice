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

// Libraries

const uuidv1                    = require('uuid').v1;
const uniqid                    = require('uniqid');
const moment                    = require('moment');
const currency                  = require('currency.js');


// Import Modules

const config                    = require('../../config.json');
const tran                      = require('../../modules/invoice_sub_transaction.js');
const netUtil                   = require('../../modules/netUtil.js');

const {
    getMemberInfo,
    getOrganizationInfo,
    insertSellerDraftStatus,
    insertSellerDraftDocument,
}                               = require('../../modules/invoices_in.js');

// Database 

const SELLER_DRAFT_DOCUMENT     = "seller_document_draft";
const SELLER_DRAFT_STATUS       = "seller_status_draft";


// Error Message
const MESSAGE_AFFECTED_ROWS     = ":result.affectedRows != 1";

// CURRENCY
const CURRENCY                  = config.CURRENCY

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * update
 */
router.post('/update', async function(req, res) {

	const METHOD = '/update'

	let start = Date.now();
	
	let errno , code;

    // 1.
    // begin Transaction
    //
    const [ conn , _1 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 2.
	// Second we update the document

	const [result2, err2 ] = await tran.updateDraftDocument (conn , SELLER_DRAFT_DOCUMENT, req );

	if (err2) {
		console.log(err2);
		errno = 2;
		code = 400;
		let msg = await tran.rollbackAndReturn(conn, code, err2, errno, METHOD);

		res.status(400)
			.json({
				err: 2,
				msg: msg
			});
		return;
	}

	// 3.
	// And then we update the status

	const [result3, err3 ] = await tran.updateDraftStatus (conn , SELLER_DRAFT_STATUS, req );

	if (err3) {
		console.log(err3);
		errno = 3;
		code = 400;
		let msg = await tran.rollbackAndReturn(conn, code, err3, errno, METHOD);

		res.status(400)
			.json({
				err: 3,
				msg: msg
			});
		return;
	}

    // 4.
    // commit
    //
    const [ _4, err4 ] = await tran.commit(conn);

    if (err4 ) {
        errno = 4;
        code = 400;
		let msg = await tran.rollbackAndReturn(conn, code, err4, errno, METHOD);

		res.status(400)
			.json({
				err: 3,
				msg: msg
			});
		return;
    }

    // 5.
    //
    conn.end();

	let end = Date.now();
	console.log("update Time: %d ms", end - start);

	res.json({ err : 0, msg : "okay" });

});


/*
 * 2.
 * create
 */
router.post('/create', async function(req, res) {

	const METHOD = '/create'

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
                "priceCurrency"			: CURRENCY.symbol
            },

            "totalPaymentDue" : {
                "type"					: "PriceSpecification",
                "price"					: 0,
                "priceCurrency"			: CURRENCY.symbol
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
                    "priceCurrency"		: CURRENCY.symbol
                }
            },

            "lineItemTotalPrice" : {
                "type"					: "PriceSpecification",
                "price"					: "",
                "priceCurrency"			: CURRENCY.symbol
            }
        }
    }


	// 4.
	//
	const credentialSubject = new credentialSubject_object (); 

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
	const [row, err5_1] = await getMemberInfo(
								req.session.data.member_did
							);

    if (err5_1) {

		let msg = `Error:${METHOD}: Create Error `;

		res.status(400)
			.json({
				err : 5,
				msg : msg
			});
		return;

    }

	// 5.2
	//
	const [org, err5_2] = await getOrganizationInfo(
								row.organization_did
							);

    if (err5_2) {

		let msg = `Error:${METHOD}: Create Error `;

		res.status(400)
			.json({
				err : 5,
				msg : msg
			});
		return;

    }
	// 6.
	//
	let seller = credentialSubject.seller;

	console.log(req.session.data.member_did);
	console.log('---- seller ---- ');
	console.log(seller);
	console.log(row);

	seller.id						= row.member_did;
	seller.name						= org.organization_name;
	seller.taxId					= org.organization_tax_id;
	seller.description				= org.organization_department;

	seller.address.streetAddress	= org.organization_building;
	seller.address.addressLocality	= org.organization_address;

	seller.address.addressCountry	= org.addressCountry;
	seller.address.addressRegion	= org.addressRegion;
	seller.address.addressCity		= org.addressCity;

	let ip_address = process.env.SERVER_LOCATION.split("://")[1];
	ip_address = ip_address.split(":")[0];

	let port = process.env.SERVER_PORT;
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
	let args;

	args = [
		document_uuid,
		document_type,
		document_number,
		document_folder,
		req.session.data.member_did,
		req.session.data.membername,
		member_data.organization_name,
		due_by,
		currency(0, config.CURRENCY).format(true)
	];

	const [result10 , err10 ] = await insertSellerDraftStatus (conn , args );


	if (err10) {
		console.log(err8);
		errno = 10;
		code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err10, errno, METHOD);
		res.status(400)
			.json({ err : 10, msg : msg });
		return;
	}


	// 12.
	//

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

	//console.log("req.session.data.member_did="+req.session.data.member_did);

	args = [
		document_uuid,
		JSON.stringify(document_json),
		document_type,

		JSON.stringify(config.CURRENCY),

		req.session.data.member_did,
		req.session.data.membername,
		JSON.stringify(member_data),
		JSON.stringify(document_meta),
		JSON.stringify(document_body),
		JSON.stringify(document_totals)
	];


	const [result12 , err12] = await insertSellerDraftDocument (conn , args );

	if (err12) {
		errno = 12;
		code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err12, errno, METHOD);
		res.status(400)
			.json({ err : errno, msg : msg });
		return;
	}

	// 13.
	//	
	if(result12.affectedRows != 1) {
		errno = 13;
		code = 400;
		const err13 = "create 13"+MESSAGE_AFFECTED_ROWS;
		let msg = tran.rollbackAndReturn(conn, code, err13, errno, METHOD);
		res.status(400)
			.json({ err : errno, msg : msg });
		return;
	}

    // 14.
    // commit
    //
	const [ _14, err14 ] = await tran.commit(conn);

    if (err14 ) {
        errno = 14;
        code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err14, errno, METHOD);
		res.status(400)
			.json({ err : errno, msg : msg });
		return;
    }

    // 15.
    //
    conn.end();

	res.json({
		err : 0,
		msg : document_uuid
	});

	let end = Date.now();
	console.log("Create Time: %d ms", end - start);


});
