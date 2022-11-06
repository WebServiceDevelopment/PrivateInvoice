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

// Libraries
const moment                = require('moment');

// Import Modules
const sub					= require("./invoice_sub.js");
const { signStatusMessage } = require('./sign_your_credentials.js');

const {
    moveToTrash,
    moveToPaid,
    moveToArchive,
}							= require('./move_to.js');

// Database
const db                    = require('../database.js')

// Exports
module.exports = {
	handleStatusUpdate      : _handleStatusUpdate,
	createConfirmMessage    : _createConfirmMessage,
	createReturnMessage     : _createReturnMessage,
	createWithdrawMessage   : _createWithdrawMessage,
	createTrashMessage      : _createTrashMessage,
	createRecreateMessage   : _createRecreateMessage,
	createPaymentMessage    : _createPaymentMessage,
	createArchiveMessage    : _createArchiveMessage,
}

// -------------------------- Export Modules ---------------------------------

async function _handleStatusUpdate (credential, res) {


	const [ message ] = credential.credentialSubject.items;
	
	let status, document_uuid, buyer_did, seller_did, hash; 

	let  msg, err;

	switch(message.statusCode) {
	case 'toConfirm':
		
		status = 'seller_status';
        document_uuid = message.recordNo;
        buyer_did = message.entryNo;
		[ msg, err] = await sub.setConfirm(status, document_uuid, buyer_did);
		if(err) {
			_error (message.statusCode, msg, err);
			return res.status(400).end(msg);
		}
		return res.status(200).end('okay');

	case 'toPaid':
		
		status = 'seller_status';
        document_uuid = message.recordNo;
        buyer_did = message.entryNo;
        hash = message.validCodeReason;

		[ msg, err] = await moveToPaid(document_uuid, buyer_did, hash);
		if(err) {
			_error (message.statusCode, msg, err);
			return res.status(400).end(msg);
		}
		return res.status(200).end('okay');

	case 'toReturn':
		
		status = 'seller_status';
        document_uuid = message.recordNo;
        buyer_did = message.entryNo;

		[ msg, err] = await sub.setReturn(status, document_uuid, buyer_did);
		if(err) {
			_error (message.statusCode, msg, err);
			return res.status(400).end(msg);
		}

		console.log("toReturn accepted");

		return res.status(200).end('okay');

	case "toWithdraw":
		
		status = 'buyer_status';
        document_uuid = message.recordNo;
        seller_did = message.entryNo;

		[ msg, err] = await sub.setWithdrawSeller(status, document_uuid, seller_did);
		if(err) {
			_error (message.statusCode, msg, err);
			return res.status(400).end(msg);
		}

		return res.status(200).end('okay');

	case "toTrash":
	case "toRecreate":
		
		status = 'buyer_status';
        document_uuid = message.recordNo;
        seller_did = message.entryNo;

		[ msg, err] = await moveToTrash(status, document_uuid, seller_did);
		if(err) {
			_error (message.statusCode, msg, err);
			return res.status(400).end(msg);
		}

		console.log("moveToTrash accepted");

		return res.status(200).end('okay');

	case "toArchive":
		
		status = 'buyer_status';
        document_uuid = message.recordNo;
        seller_did = message.entryNo;

		[ msg, err] = await moveToArchive(document_uuid);
		if(err) {
			_error (message.statusCode, msg, err);
			return res.status(400).end(msg);
		}

		console.log("moveToArchive accepted");

		return res.status(200).end('okay');

	default:
		return res.status(400).end('Invalid message')
	}


	function _error (statusCode, msg, err) {

		console.log(`${statusCode}, mag=${msg}, err=+${err}`);
	}

}


async function _createConfirmMessage (document_uuid, member_did, keyPair) {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_did,
		entryLineSequence: "Message sent from buyer",
		statusCode: "toConfirm",
		statusCodeDescription: "Buyer has confirmed this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_did, message, keyPair);

}


async function _createReturnMessage (document_uuid, member_did, keyPair) {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_did,
		entryLineSequence: "Message sent from buyer",
		statusCode: "toReturn",
		statusCodeDescription: "Buyer has disputed this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_did, message, keyPair);

}

async function _createWithdrawMessage (document_uuid, member_did, keyPair) {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_did,
		entryLineSequence: "Message sent from seller",
		statusCode: "toWithdraw",
		statusCodeDescription: "Seller has retracted this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_did, message, keyPair);

}

async function _createTrashMessage (document_uuid, member_did, keyPair) {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_did,
		entryLineSequence: "Message sent from seller",
		statusCode: "toTrash",
		statusCodeDescription: "Seller has trashed this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_did, message, keyPair);

}

async function _createRecreateMessage (document_uuid, member_did, keyPair) {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_did,
		entryLineSequence: "Message sent from seller",
		statusCode: "toRecreate",
		statusCodeDescription: "Seller has recreated this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_did, message, keyPair);

}

async function _createPaymentMessage (document_uuid, member_did, keyPair, hash) {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_did,
		entryLineSequence: "Message sent from buyer",
		statusCode: "toPaid",
		statusCodeDescription: "Buyer has paid this invoice",
		validCodeReason: hash,
		validCodeReasonDescription: "The hash to validate the transaction",
	}

	return await createMessage(document_uuid, member_did, message, keyPair);

}

async function _createArchiveMessage (document_uuid, member_did, keyPair) {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_did,
		entryLineSequence: "Message sent from seller",
		statusCode: "toArchive",
		statusCodeDescription: "Seller has archived this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_did, message, keyPair);

}

// -------------------------- Private Modules ---------------------------------

const createMessage = async (document_uuid, member_did, message, keyPair) => {

	// 1.
	// Get issuer information

	const sql = `
		SELECT
			member_did AS member_did,
			membername AS member_name,
			job_title AS member_job_title,
			work_email AS member_contact_email
		FROM
			members
		WHERE
			member_did = ?
	`;

	const args = [
		member_did
	];

	let row;
	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		return [ null, err ];
	}

	// 2.
	// Create credential to be signed

	const timestamp = moment().toJSON()


	const credential = {
		"@context": [
			'https://www.w3.org/2018/credentials/v1',
			'https://w3id.org/traceability/v1'
		],
		id: `urn:uuid:${document_uuid}`,
		type: [
			"VerifiableCredential",
			"PGAStatusMessageCertificate"
		],
		issuanceDate: timestamp.split('.').shift() + 'Z',
		name: "Private Invoice Status Update",
		description: "An update message issued by Private Invoice",
		relatedLink: [],
		issuer: {
			id: keyPair.controller,
			type: 'Person',
			name: row.member_name,
			email: row.member_contact_email,
			jobTitle: row.member_job_title
		},
		credentialSubject : {
			items : [ message ]
		}
	}

	// 3.
	// Sign Credential

	const signedCredential = await signStatusMessage(credential, keyPair);
	return [ signedCredential , null];
}
