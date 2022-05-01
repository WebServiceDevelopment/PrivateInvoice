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

const express = require('express');
const router = express.Router();
module.exports = router;

// Import Libraries

const uniqid = require('uniqid')
const uuidv1 = require('uuid').v1;
const axios = require('axios');

// Database

const db = require('../database.js');

// Constants

const INVITE_TABLE = 'dat_invite';

// Helper functions

const checkForExistingContact = async (local_uuid, remote_uuid) => {

	const sql = `
		SELECT 
			COUNT(*) AS num
		FROM 
			contacts 
		WHERE
			local_user_uuid = ?
		AND
			remote_user_uuid = ?
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

const insertNewContact = async (invite, localUser, remote_user, remote_company) => {

	const sql = `
		INSERT INTO contacts (
			_id,
			invite_code,
			local_user_uuid,
			local_username,
			remote_origin,
			remote_user_uuid,
			remote_username,
			remote_company,
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

	console.log(remote_user);
	console.log(remote_company);
	console.log(JSON.stringify(remote_company));

	const _id = uuidv1();

	const args = [
		_id,
		invite.invite_code,
		localUser.user_uuid,
		localUser.username,
		remote_user.origin,
		remote_user.user_uuid,
		remote_user.username,
		JSON.stringify(remote_company),
		invite.rel_client,
		invite.rel_supplier
	];


	try {
		await db.insert(sql, args);
	} catch(err) {
		return [ null, err ];
	}

	return [ true, null ];

}

const getContacts = async (user_uuid) => {

	const sql = `
		SELECT
			remote_origin,
			remote_user_uuid,
			remote_username,
			remote_company,
			local_to_remote,
			remote_to_local,
			created_on
		FROM
			contacts
		WHERE
			local_user_uuid = ?
	`;

	const args = [
		user_uuid
	];

	const rows = await db.selectAll(sql, args);

	const contacts = rows.map( row => {
		try {
			row.remote_company = JSON.parse(row.remote_company);
		} catch (e) {
			row.remote_company = "";
		}
		return row;
	});

	return contacts;

}



// End Points

router.post('/generate', async function(req, res) {

	const { body } = req;

	const sql = `
		INSERT INTO ${INVITE_TABLE} (
			invite_code,
			host_user_uuid,
			rel_client,
			rel_supplier,
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

	const invite_code = uniqid.time();

	const args = [
		invite_code,
		req.session.data.user_uuid,
		req.body.client,
		req.body.supplier,
		req.body.uses,
		req.body.expire
	];

	try {
		await db.insert(sql, args)
	} catch(err) {
		throw err;
	}

	res.json({
		host: {
			invite_code: invite_code,
			origin: req.headers.origin,
			isClient : req.body.client,
			isClientDescription : 'Inviter can send invoices to invitee',
			isSupplier : req.body.supplier,
			isSupplierDescription : 'Invitee can send invoices to inviter',
			orientation: 'The entity described in this JSON is the inviter'
		},
		company : {
			name: req.session.data.company_name,
			postcode: req.session.data.company_postcode,
			address: req.session.data.company_address,
			building: req.session.data.company_building,
			department: req.session.data.company_department,
		},
		user : {
			user_uuid: req.session.data.user_uuid,
			username: req.session.data.username,
			work_email: req.session.data.work_email
		}
	});

});

router.post('/add', async function(req, res) {

	const { body } = req;

	console.log(body);
	console.log(body.user);

	// 1.1 
	// First we need to check if the contact already exists

	const local_user_uuid = req.session.data.user_uuid;
	const remote_user_uuid = body.user.user_uuid;

	const exists = await checkForExistingContact(local_user_uuid, remote_user_uuid)
	if(exists) {
		return res.status(400).end('Contact already exists')
	}

	// 1.2 
	// Then we need to try and contact the remote host
	// When we do, we need to tell the remote host who we are
	
	const { origin, invite_code, isClient, isSupplier } = body.host;
	const { user_uuid, username, work_email } = body.user;
	const url = `${origin}/api/message/contactRequest`;
	
	// Create a request from the remote perspective
	const contactRequest = {
		invite_code: invite_code,
		local_user : {
			user_uuid : user_uuid,
			username : username,
			work_email : work_email
		},
		remote_company : {
			name: req.session.data.company_name,
			postcode: req.session.data.company_postcode,
			address: req.session.data.company_address,
			building: req.session.data.company_building,
			department: req.session.data.company_department,
		},
		remote_user : {
			origin: req.headers.origin,
			user_uuid: req.session.data.user_uuid,
			username: req.session.data.username,
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
		rel_client : req.body.host.isSupplier,
		rel_supplier : req.body.host.isClient,
	}

	const local_user = {
		user_uuid: req.session.data.user_uuid,
		username: req.session.data.username,
		work_email: req.session.data.work_email
	}

	const remote_user = {
		origin : req.body.host.origin,
		user_uuid : user_uuid,
		username : username,
		work_email : work_email
	}

	const remote_company = req.body.company;
	const [ created, creatErr ] = await insertNewContact(invite, local_user, remote_user, remote_company);
	if(creatErr) {
		return res.status(400).end(creatErr.toString());
	}

	res.json({
		msg : 'okay'
	});

});

router.get('/get', async function(req, res) {

	const { user_uuid } = req.session.data;
	const contacts = await getContacts(user_uuid);
	console.log('--- Getting contacts ---');
	console.log(contacts);
	res.json(contacts);

})
