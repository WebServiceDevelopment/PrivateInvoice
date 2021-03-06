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

// TODO: REMOVE THIS FILE FROM ROUTES

"use strict";

// Import sub

// Import Router

const express				= require('express');
const router				= express.Router();
module.exports				= router;

// Import Libraries

const uuidv1				= require('uuid').v1

// Database

const db					= require('../database.js');

/*
 * Helper functions
 */

const checkInviteCodeValid = async(local_uuid, invite_code) => {

	const sql = `
		SELECT
			invite_code,
			rel_buyer,
			rel_seller,
			use_count,
			max_count,
			expires_on
		FROM
			invite
		WHERE
			local_member_did = ?
		AND
			invite_code = ?
	`;

	const args = [
		local_uuid,
		invite_code
	];

	const row = await db.selectOne(sql, args);
	console.log(row);
	if(!row) {
		return [ null, new Error('Invite Code not valid')];
	}

	const { use_count, max_count } = row;
	if(use_count >= max_count) {
		return [ null, new Error('Invite Code has been redeemed')];
	}
	
	return [ row, null ];

}

/*
 * checkForExistingContact
 */
const checkForExistingContact = async (local_uuid, remote_uuid) => {

	const sql = `
		SELECT
			COUNT(*) AS num
		FROM
			contacts
		WHERE
			local_member_did = ?
		AND
			remote_member_did = ?
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
const insertNewContact = async (invite_code, local_member_did, credential) => {

	// Get local username

	const mySql = `
		SELECT
			membername AS local_member_name
		FROM
			members
		WHERE
			member_did = ?
	`;

	const myArgs = [
		local_member_did
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

	const remote_origin = link.target.replace('/presentations/available', '')
	const remote_member_did = credential.issuer.id;
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
			local_member_did,
			local_membername,
			remote_origin,
			remote_member_did,
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
		local_member_did,
		local_member_name,
		remote_origin,
		remote_member_did,
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

//------------------------------ define endpoints ------------------------------


/*
 * contactRequest
 */
router.all('/contactRequest', async(req, res) => {

	console.log('--- Got Contact Request ---');
	const { body } = req;

	// First we see if the invite code is still valid
	
	const invite_code = body.id.split(':').pop();
	const [ linkRelationship ] = body.relatedLink.filter( (link) => {
		return link.linkRelationship === 'Invite';
	});
	const local_member_did = linkRelationship.target;

	const [ invite, inviteEr ] = await checkInviteCodeValid(local_member_did, invite_code);
	if(inviteEr) {
		return res.status(400).end(inviteEr.toString());
	}

	// Then we see if the contact already exists
	
	const remote_member_did = body.issuer.id;
	const exists = await checkForExistingContact(local_member_did, remote_member_did);
	if(exists) {
		return res.status(400).end('Contact already exists');
	}

	// Then we try to insert the contact
	
	const [ created, createErr ] = await insertNewContact(invite_code, local_member_did, body);
	if(createErr) {
		return res.status(400).end(creatErr.toString());
	}

	// Then we return a confirmation status
	
	return res.status(200).end('okay');

});
