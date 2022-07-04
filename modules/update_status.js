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

const db = require('../database.js')
const moment = require('moment');
const { signStatusMessage } = require('../routes/sign_your_credentials.js');
const sub = require("../routes/invoice_sub.js");
const { moveToTrash } = require('./move_to_trash.js');
const { moveToPaid } = require('./move_to_paid.js');

const handleStatusUpdate = async(credential, res) => {

	const [ message ] = credential.credentialSubject.items;
	
	let status, document_uuid, buyer_uuid, seller_uuid, hash;

	switch(message.statusCode) {
	case 'toConfirm':
		
		status = 'seller_status';
        document_uuid = message.recordNo;
        buyer_uuid = message.entryNo;
		await sub.setConfirm(status, document_uuid, buyer_uuid);
		return res.status(200).end('okay');

		break;
	case 'toPaid':
		
		status = 'seller_status';
        document_uuid = message.recordNo;
        buyer_uuid = message.entryNo;
        hash = message.validCodeReason;
		const moveErr = await moveToPaid(document_uuid, buyer_uuid, hash);
		if(moveErr) {
			return res.status(400).end(moveErr);
		}
		return res.status(200).end('okay');

		break;
	case 'toReturn':
		
		status = 'seller_status';
        document_uuid = message.recordNo;
        buyer_uuid = message.entryNo;
		await sub.setReturn(status, document_uuid, buyer_uuid);
		return res.status(200).end('okay');

		break;
	case "toWithdraw":
		
		status = 'buyer_status';
        document_uuid = message.recordNo;
        seller_uuid = message.entryNo;
		await sub.setWithdrawBuyer(status, document_uuid, seller_uuid);
		return res.status(200).end('okay');

		break;
	case "toTrash":
	case "toRecreate":
		
		status = 'buyer_status';
        document_uuid = message.recordNo;
        seller_uuid = message.entryNo;
		await moveToTrash(status, document_uuid, seller_uuid);
		return res.status(200).end('okay');

		break;
	default:
		return res.status(400).end('Invalid message')
		break;
	}

}

const createMessage = async (document_uuid, member_uuid, message, keyPair) => {

	// 1.
	// Get issuer information

	const sql = `
		SELECT
			member_uuid AS member_did,
			membername AS member_name,
			job_title AS member_job_title,
			work_email AS member_contact_email,
			member_uuid AS organization_did,
			organization_name AS organization_name,
			organization_postcode AS organization_postcode,
			organization_address AS organization_address_line1,
			organization_building AS organization_address_line2,
			organization_department AS organization_department,
			organization_tax_id AS organization_tax_id,
			addressCountry AS organization_address_country,
			addressRegion AS organization_address_region,
			addressCity AS organization_address_city
		FROM
			members
		WHERE
			member_uuid = ?
	`;

	const args = [
		member_uuid
	];

	let row;
	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		return [ null, err ];
	}

	// 2.
	// Create credential to be signed

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
		issuanceDate: moment().toJSON(),
		name: "Private Invoice Status Update",
		description: "An update message issued by Private Invoice",
		relatedLink: [],
		issuer: {
			id: member_uuid,
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
	return signedCredential;
}

const createConfirmMessage = async(document_uuid, member_uuid, keyPair) => {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_uuid,
		entryLineSequence: "Message sent from buyer",
		statusCode: "toConfirm",
		statusCodeDescription: "Buyer has confirmed this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_uuid, message, keyPair);

}


const createReturnMessage = async(document_uuid, member_uuid, keyPair) => {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_uuid,
		entryLineSequence: "Message sent from buyer",
		statusCode: "toReturn",
		statusCodeDescription: "Buyer has disputed this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_uuid, message, keyPair);

}

const createWithdrawMessage = async(document_uuid, member_uuid, keyPair) => {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_uuid,
		entryLineSequence: "Message sent from seller",
		statusCode: "toWithdraw",
		statusCodeDescription: "Seller has retracted this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_uuid, message, keyPair);

}

const createTrashMessage = async(document_uuid, member_uuid, keyPair) => {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_uuid,
		entryLineSequence: "Message sent from seller",
		statusCode: "toTrash",
		statusCodeDescription: "Seller has trashed this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_uuid, message, keyPair);

}

const createRecreateMessage = async(document_uuid, member_uuid, keyPair) => {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_uuid,
		entryLineSequence: "Message sent from seller",
		statusCode: "toRecreate",
		statusCodeDescription: "Seller has recreated this invoice",
		validCodeReason: "",
		validCodeReasonDescription: "",
	}

	return await createMessage(document_uuid, member_uuid, message, keyPair);

}

const createPaymentMessage = async(document_uuid, member_uuid, keyPair, hash) => {

	const message = {
		type: "PGAStatusMessage",
		recordNo: document_uuid,
		entryNo: member_uuid,
		entryLineSequence: "Message sent from buyer",
		statusCode: "toPaid",
		statusCodeDescription: "Buyer has paid this invoice",
		validCodeReason: hash,
		validCodeReasonDescription: "The hash to validate the transaction",
	}

	return await createMessage(document_uuid, member_uuid, message, keyPair);

}

module.exports = {
	handleStatusUpdate,
	createConfirmMessage,
	createReturnMessage,
	createWithdrawMessage,
	createTrashMessage,
	createRecreateMessage,
	createPaymentMessage
}
