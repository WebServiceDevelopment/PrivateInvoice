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

const express				= require('express');
const router				= express.Router();
module.exports				= router;

// Import Libraries

const uuidv1				= require('uuid').v1;
const uuidv4				= require('uuid').v4;
const axios					= require('axios');
const moment 				= require('moment');

const { signBusinessCard } = require('./sign_your_credentials.js')

// Database

const db					= require('../database.js');

// Constants

const INVITE_TABLE			= 'invite';

/*
 * Helper functions
 */

const createBusinessCard = async (req, member_did, invite_code) => {

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
		member_did
	];

	console.log(req.headers);

	let row;
	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		return [ null, err ];
	}

	const credential = {
		'@context': [
			"https://www.w3.org/2018/credentials/v1",
			"https://w3id.org/traceability/v1"
		],
		type: [
			"VerifiableCredential",
			"VerifiableBusinessCard"
		],
		id: `urn:uuid:${invite_code}`,
		name: "Verifiable Business Card",
		relatedLink: [
			{
				type: "LinkRole",
				target: `${req.headers.origin}/presentations/available`,
				linkRelationship: 'Partner'
			}
		],
		issuanceDate: moment().toJSON(),
		issuer : {
			id: req.session.data.member_uuid,
			type: 'Person',
			name: row.member_name,
			email: row.member_contact_email,
			jobTitle: row.member_job_title
		},
		credentialSubject : {
			id: row.organization_did,
			type: 'Organization',
			name: row.organization_name,
			contactPoint: `${row.member_name}@${req.headers.host}`,
			department: row.organization_department,
			address : {
				type: 'PostalAddress',
				postalCode: row.organization_postcode,
				addressLocality: row.organization_address_city,
				addressRegion: row.organization_address_region,
				streetAddress: row.organization_address_line1,
				crossStreet: row.organization_address_line2,
				addressCountry: row.organization_address_country
			},
			taxId: row.organization_tax_id
		}
	}

	return [ credential, null ];

}

const checkForExistingContact = async (local_uuid, remote_uuid) => {

	const sql = `
		SELECT 
			COUNT(*) AS num
		FROM 
			contacts 
		WHERE
			local_member_uuid = ?
		AND
			remote_member_uuid = ?
		AND
			removed_on IS NULL
	`;

	const args = [
		local_uuid,
		remote_uuid
	];


	const { num } = await db.selectOne(sql, args);
	return num;

}

/*
 * insertNewContact
 */
const insertNewContact = async (invite, localUser, remote_member, remote_organization) => {

	const sql = `
		INSERT INTO contacts (
			_id,
			invite_code,
			local_member_uuid,
			local_membername,
			remote_origin,
			remote_member_uuid,
			remote_membername,
			remote_organization,
			local_to_remote,
			remote_to_local
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

	console.log(remote_member);
	console.log(remote_organization);
	console.log(JSON.stringify(remote_organization));

	const _id = uuidv1();

	const args = [
		_id,
		invite.invite_code,
		localUser.member_uuid,
		localUser.membername,
		remote_member.origin,
		remote_member.member_uuid,
		remote_member.membername,
		JSON.stringify(remote_organization),
		invite.rel_buyer,
		invite.rel_seller
	];


	try {
		await db.insert(sql, args);
	} catch(err) {
		return [ null, err ];
	}

	return [ true, null ];

}

/*
 * getContacts
 */
const getContacts = async (member_uuid) => {

	const sql = `
		SELECT
			remote_origin,
			remote_member_uuid,
			remote_membername,
			remote_organization,
			local_to_remote,
			remote_to_local,
			created_on
		FROM
			contacts
		WHERE
			local_member_uuid = ?
	`;

	const args = [
		member_uuid
	];

	const rows = await db.selectAll(sql, args);

	const contacts = rows.map( row => {
		try {
			row.remote_organization = JSON.parse(row.remote_organization);
		} catch (e) {
			row.remote_organization = "";
		}
		return row;
	});

	return contacts;

}

const getPrivateKeys = async (member_did) => {

	const sql = `
		SELECT
			public_key
		FROM
			privatekeys
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

	const keyPair = JSON.parse(row.public_key);
	return [ keyPair, null ];

}



//----------------------------- define endpoints -----------------------------

/*
 * generate
 */

router.post('/generate', async function(req, res) {

	const { body } = req;

	const sql = `
		INSERT INTO ${INVITE_TABLE} (
			invite_code,
			local_member_uuid,
			rel_buyer,
			rel_seller,
			max_count,
			expires_on
		) VALUES (
			?,
			?,
			?,
			?,
			?,
			?
		)
	`;

	const invite_code = uuidv4();

	const args = [
		invite_code,
		req.session.data.member_uuid,
		req.body.buyer,
		req.body.seller,
		req.body.uses,
		req.body.expire
	];

	try {
		await db.insert(sql, args)
	} catch(err) {
		throw err;
	}

	const [ credential, err1 ] = await createBusinessCard(req, req.session.data.member_uuid, invite_code);
	if(err1) {
		return res.json({
			err: 1,
			msg: 'could not create business card'
		});
	}

	const [ keyPair, err2 ] = await getPrivateKeys(req.session.data.member_uuid);
	if(err2) {
		return res.json({
			err: 2,
			msg: 'could not get private keys'
		});
	}

	const vbc = await signBusinessCard(credential, keyPair);
	res.json(vbc);

	/*
	res.json({
		host: {
			invite_code: invite_code,
			origin: req.headers.origin,
			isBuyer : req.body.buyer,
			isBuyerDescription : 'Inviter can send invoices to invitee',
			isSeller : req.body.seller,
			isSellerDescription : 'Invitee can send invoices to inviter',
			orientation: 'The entity described in this JSON is the inviter'
		},
		organization : {
			name: req.session.data.organization_name,
			postcode: req.session.data.organization_postcode,
			address: req.session.data.organization_address,
			building: req.session.data.organization_building,
			department: req.session.data.organization_department,
		},
		member : {
			member_uuid: req.session.data.member_uuid,
			membername: req.session.data.membername,
			work_email: req.session.data.work_email
		}
	});
	*/

});

/*
 * add
 */
router.post('/add', async function(req, res) {

	const { body } = req;

	console.log(body);
	console.log(body.member);

	// 1.1 
	// First we need to check if the contact already exists

	const local_member_uuid = req.session.data.member_uuid;
	const remote_member_uuid = body.member.member_uuid;

	const exists = await checkForExistingContact(local_member_uuid, remote_member_uuid)
	if(exists) {
		return res.status(400).end('Contact already exists')
	}

	// 1.2 
	// Then we need to try and contact the remote host
	// When we do, we need to tell the remote host who we are
	
	const { origin, invite_code, isBuyer, isSeller } = body.host;
	const { member_uuid, membername, work_email } = body.member;
	const url = `${origin}/api/message/contactRequest`;
	
	// Create a request from the remote perspective
	const contactRequest = {
		invite_code: invite_code,
		local_member : {
			member_uuid : member_uuid,
			membername : membername,
			work_email : work_email
		},
		remote_organization : {
			name: req.session.data.organization_name,
			postcode: req.session.data.organization_postcode,
			address: req.session.data.organization_address,
			building: req.session.data.organization_building,
			department: req.session.data.organization_department,
		},
		remote_member : {
			origin: req.headers.origin,
			member_uuid: req.session.data.member_uuid,
			membername: req.session.data.membername,
			work_email: req.session.data.work_email
		}
	}

	const params = {
		method: 'post',
		url: url,
		data : contactRequest
	}

	let response;
	try {
		response = await axios(params);
	} catch(err) {
		if(err.response) {
			response = {
				status : err.response.status,
				data : err.response.data
			}
		} else if(err.code === 'ECONNRESET') {
			response = {
				status : 500,
				data : 'ECONNRESET'
			}
		} else {
			response = {
				status : 400,
				data : "Undefined Error"
			}
		}
	}

	if(response.status !== 200) {
		return res.status(400).end(response.data);
	}

	// 1.3 
	// If we get a 200 response, we need to insert our own contact

	const invite = {
		invite_code,
		rel_buyer : req.body.host.isSeller,
		rel_seller : req.body.host.isBuyer,
	}

	const local_member = {
		member_uuid: req.session.data.member_uuid,
		membername: req.session.data.membername,
		work_email: req.session.data.work_email
	}

	const remote_member = {
		origin : req.body.host.origin,
		member_uuid : member_uuid,
		membername : membername,
		work_email : work_email
	}

	const remote_organization = req.body.organization;
	const [ created, creatErr ] = await insertNewContact(invite, local_member, remote_member, remote_organization);
	if(creatErr) {
		return res.status(400).end(creatErr.toString());
	}

	res.json({
		msg : 'okay'
	});

});

/*
 * getContactList
 */
router.get('/getContactList', async function(req, res) {

	console.log('My session data');
	console.log(req.session.data);

	const { member_uuid } = req.session.data;
	const contacts = await getContacts(member_uuid);
	console.log('--- Getting contacts ---');
	console.log(contacts);
	res.json(contacts);

})
