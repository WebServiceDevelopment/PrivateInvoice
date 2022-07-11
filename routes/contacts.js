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
const { makePresentation } = require('../modules/presentations_out.js')
const { verifyCredential } = require('../modules/verify_utils.js')

// Database

const db					= require('../database.js');

// Constants

const INVITE_TABLE			= 'invite';

/*
 * Helper functions
 */

const createBusinessCard = async (req, member_did, invite_code, keyPair) => {

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

	let row;
	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		return [ null, err ];
	}

	const timestamp = moment().toJSON()
	const issuanceDate = timestamp.split('.').shift() + 'Z';
	const { controller } = keyPair;

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
				target: `${req.headers.origin}/api/presentations/available`,
				linkRelationship: 'Partner'
			}
		],
		issuanceDate: issuanceDate,
		issuer : {
			// id: req.session.data.member_uuid,
			id: controller,
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

const insertNewContact = async (invite_code, local_member_uuid, credential) => {

	// Get local username

	const mySql = `
		SELECT
			membername AS local_member_name
		FROM
			members
		WHERE
			member_uuid = ?
	`;

	const myArgs = [
		local_member_uuid
	];

	let row;
	try {
		row = await db.selectOne(mySql, myArgs);
	} catch(err) {
		return [ null, err ];
	}

	const { local_member_name } = row;

	// Get Information from Business Card

	const [ link ] = credential.relatedLink.filter( (link) => {
		return link.linkRelationship !== 'Invite';
	});

	const relation = {
		local_to_remote: 0,
		remote_to_local: 0
	};

	switch(link.linkRelationship) {
	case 'Partner':
		relation.local_to_remote = 1;
		relation.remote_to_local = 1;
		break;
	case 'Buyer':
		relation.local_to_remote = 1;
		break;
	case 'Seller':
		relation.remote_to_local = 1;
		break;
	}

	const remote_origin = link.target.replace('/api/presentations/available', '');
	const remote_member_uuid = credential.issuer.id;
	const remote_member_name = credential.issuer.name;

	const remote_organization = {
		name: credential.credentialSubject.name,
		postcode: credential.credentialSubject.address.postalCode,
		address: credential.credentialSubject.address.streetAddress,
		building: credential.credentialSubject.address.crossStreet,
		department: credential.credentialSubject.department,
		city: credential.credentialSubject.address.addressLocality,
		state: credential.credentialSubject.address.addressRegion,
		country: credential.credentialSubject.address.addressCountry,
		taxId: credential.credentialSubject.taxId
	}

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

	const _id = uuidv1();

	const args = [
		_id,
		invite_code,
		local_member_uuid,
		local_member_name,
		remote_origin,
		remote_member_uuid,
		remote_member_name,
		JSON.stringify(remote_organization),
		relation.local_to_remote,
		relation.remote_to_local
	];

	try {
		await db.insert(sql, args);
	} catch(err) {
		return [ null, err ];
	}

	// TODO: update use_count on invite table

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
 * 1.
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

	console.log(req.session.data.member_uuid);

	console.log('--- aaa ---');
	const [ keyPair, err2 ] = await getPrivateKeys(req.session.data.member_uuid);
	if(err2) {
		return res.json({
			err: 2,
			msg: 'could not get private keys'
		});
	}

	console.log('--- bbb ---');
	const [ credential, err1 ] = await createBusinessCard(req, req.session.data.member_uuid, invite_code, keyPair);
	if(err1) {
		return res.json({
			err: 1,
			msg: 'could not create business card'
		});
	}
	
	console.log('--- ccc ---');
	const vbc = await signBusinessCard(credential, keyPair);
	
	console.log('--- eee ---');
	res.json(vbc);


});

/*
 * 2.
 * add
 */

router.post('/add', async function(req, res) {

	const { body } = req;

	const verified = await verifyCredential(body);
	if(!verified) {
		return res.status(400).end('Contact did not verify')
	}

	// 1.1 
	// First we need to check if the contact already exists

	console.log('1.1');

	const local_member_uuid = req.session.data.member_uuid;
	// const remote_member_uuid = body.issuer.id;
	const remote_member_uuid = body.credentialSubject.id;

	const exists = await checkForExistingContact(local_member_uuid, remote_member_uuid)
	if(exists) {
		return res.status(400).end('Contact already exists')
	}

	// Keypair

	const [ keyPair, err2 ] = await getPrivateKeys(req.session.data.member_uuid);
	if(err2) {
		return res.json({
			err: 2,
			msg: 'could not get private keys'
		});
	}

	// 1.2 
	// Then we need to try and contact the remote host
	// We start by creating our own verifiable business card

	console.log('1.2');
	const invite_code = body.id.split(':').pop();
	console.log(invite_code);

	const [ credential, err1 ] = await createBusinessCard(req, req.session.data.member_uuid, invite_code, keyPair);
	if(err1) {
		return res.json({
			err: 1,
			msg: 'could not create business card'
		});
	}

	credential.relatedLink.push({
		type: 'LinkRole',
		// target: local_member_uuid,
		target: remote_member_uuid,
		linkRelationship: 'Invite'
	});

	const vbc = await signBusinessCard(credential, keyPair);
	
	// 1.3
	// Then we need to send our verifiable business card to the other
	// party
	
	console.log('1.3');
	const [ link ] = body.relatedLink;
	const url = link.target;

	const [ response, err3 ] = await makePresentation(url, keyPair, vbc);
	if(err3) {
		return res.json({
			err: 3,
			msg: 'Presentation failed: ' + err3
		});
	}
	
	// 1.4
	// For debug purposes, if we add ourselves as a contact, then the
	// entry has already been made as a result of the presentation
	// on our server
	
	if( local_member_uuid === remote_member_uuid) {
		return res.json({
		    err: 0,
			msg : 'okay'
		});
	}

	// 1.5
	// If we get a successful response from the presentation,
	// then we need to add a contact on our own server

	const [ created, creatErr ] = await insertNewContact(invite_code, local_member_uuid, body);
	if(creatErr) {
		return res.status(400).end(creatErr.toString());
	}
	
	// End Route

	res.json({
		err: 0,
		msg : 'okay'
	});

});

/*
 * 3.
 * getContactList
 */
router.get('/getContactList', async function(req, res) {

	const { member_uuid } = req.session.data;
	const contacts = await getContacts(member_uuid);
	console.log('--- Getting contacts ---');
	console.log(contacts);
	res.json(contacts);

})
