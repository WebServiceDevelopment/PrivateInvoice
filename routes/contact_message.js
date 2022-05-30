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

const express				= require('express');
const router				= express.Router();
module.exports				= router;

// Import Libraries

const uuidv1				= require('uuid').v1

// Database
const db					= require('../database.js');


// Helper functions

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
			local_member_uuid = ?
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
	
	/*
	// Remove Check for now
	const { expires_on } = row;
	const timeLimit = moment(expires_on)
	if(moment().isAfter(timeLimit)) {
		return [ null, new Error('Invite Code has expired')];
	}
	*/

	return [ row, null ];

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

const insertNewContact = async (invite, localUser, remote_member, remote_organization) => {

	// TODO update use_count on invite table

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

//------------------------------ define endpoints ------------------------------


router.all('/contactRequest', async(req, res) => {

	console.log('--- Got Contact Request ---');

	const { body } = req;
	console.log(body);

	// First we see if the invite code is still valid

	const { invite_code, local_member, remote_member, remote_organization } = body;
	const [ invite, inviteEr ] = await checkInviteCodeValid(local_member.member_uuid, invite_code);
	if(inviteEr) {
		return res.status(400).end(inviteEr.toString());
	}

	// Then we see if the contact already exists
	
	const exists = await checkForExistingContact(local_member.member_uuid, remote_member.member_uuid);
	if(exists) {
		return res.status(400).end('Contact already exists');
	}

	// Then we try to insert the contact
	
	const [ created, creatErr ] = await insertNewContact(invite, local_member, remote_member, remote_organization);
	if(creatErr) {
		return res.status(400).end(creatErr.toString());
	}

	// Then we return a confirmation status
	
	return res.status(200).end('okay');

});
