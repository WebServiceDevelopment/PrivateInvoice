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

// Libraries

const uuidv1 = require('uuid').v1;

// Database

const db = require('../database.js');

// End Points

router.post('/create', async function(req, res) {

	const INVITE_TABLE = "dat_invite";

	const invite_code = uniqid.time();

	let args = [
		invite_code,
		req.session.data.user_uuid,
		req.body.client,
		req.body.supplier
	];

	args.push(req.body.count || null);

	let sql = `
		INSERT INTO ${INVITE_TABLE} (
			invite_code,
			host_user_uuid,
			rel_client,
			rel_supplier,
			max_count
		) VALUES (
			?,
			?,
			?,
			?,
			?
		)
	`;

	try {
		await db.insert(sql, args);
	} catch(err) {
		throw err;
	}

	sql = `
		SELECT
			*
		FROM
			${INVITE_TABLE}
		WHERE
			invite_code = ?
		AND
			host_user_uuid = ?
	`;

	args = [
		invite_code,
		req.session.data.user_uuid
	];

	let row;

	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	//console.log(row);

	res.json({
		err : 0,
		msg : row
	});

});

router.post('/list', async function(req, res) {

	const INVITE_TABLE = "dat_invite";

	let sql = `
		SELECT
			*
		FROM
			${INVITE_TABLE}
		WHERE
			host_user_uuid = ?
		AND
			removed_on IS NULL
		ORDER BY
			created_on DESC
	`;

	let args = [
		req.session.data.user_uuid
	];

	let rows;

	try {
		rows = await db.selectAll(sql, args);
	} catch(err) {
		throw err;
	}

	res.json({
		err : 0,
		msg : rows
	});

});

router.post('/submit', async function(req, res) {

	// First we need to check to make sure the invite is valid
	
	const INVITE_TABLE = "dat_invite";
	const CONTACTS_TABLE = "contacts";

	let sql = `
		SELECT
			invite_code,
			host_user_uuid as host_user_uuid,
			rel_client,
			rel_supplier,
			use_count,
			max_count,
			created_on,
			expires_on,
			removed_on
		FROM
			${INVITE_TABLE}
		WHERE
			invite_code = ?
		AND
			removed_on IS NULL
	`;
	// AND
	// ( expires_on IS NULL OR expires_on < datetime('now') )

	let args = [
		req.body.code
	];

	let invite;

	try {
		invite = await db.selectOne(sql, args);
	} catch (err) {
		throw err;
	}

	if(!invite) {
		return res.json({
			err : 1,
			msg : "Expired code"
		});
	}

	// If the max count has been reached, then we return

	if(invite.max_count && invite.use_count >= invite.max_count) {
		return res.json({
			err : 1,
			msg : "Use quota filled"
		});
	}

	invite.host_user_uuid = invite.host_user_uuid.toString();

	// Then we increment the use count of the invite entry

	sql = `
		UPDATE
			${INVITE_TABLE}
		SET
			use_count = use_count + 1
		WHERE
			invite_code = ?
	`;

	let bool;

	try {
		bool = await db.update(sql, args);
	} catch (err) {
		throw err;
	}

	// Then we need to insert into the dat contact


	sql = `
		INSERT INTO ${CONTACTS_TABLE} (
			contact_uuid,
			invite_code,
			supplier_uuid,
			client_uuid
		) VALUES (
			?,
			?,
			?,
			?
		)
	`;

	const contact_uuid = uuidv1();
	//console.log(contact_uuid);
	//console.log(req.session);
	//console.log(invite);

	if(invite.rel_supplier) {

		args = [
			contact_uuid,
			invite.invite_code,
			req.session.data.user_uuid,
			invite.host_user_uuid
		];

		try {
			bool = await db.insert(sql, args);
		} catch (err) {
			throw err;
		}

	} else if(invite.rel_client) {

		args = [
			contact_uuid,
			invite.invite_code,
			invite.host_user_uuid,
			req.session.data.user_uuid
		];

		try {
			bool = await db.insert(sql, args);
		} catch (err) {
			throw err;
		}

	}

	return res.json({
		err : 0,
		msg : contact_uuid
	});

});

router.post('/contacts', async function(req, res) {

	const CONTACTS_TABLE = "contacts";

	let contactType, myPosition;

	// First we get a list of all of the contact uuid's
	// in the direction that we request

	switch(req.body.contactType) {
	case "suppliers":
		contactType = "supplier_uuid";
		myPosition = "client_uuid";

		//console.log("/contacts suppliers ");
		break;
	case "clients":
		contactType = "remote_user_uuid";
		myPosition = "local_user_uuid";

		//console.log("/contacts clients ");
		break;
	default:
		return res.json({
			err : 1,
			msg : "Invalid contact type provided"
		});
		break;
	}

	let sql = `
		SELECT
			${contactType} AS contact_uuid
		FROM
			${CONTACTS_TABLE}
		WHERE
			${myPosition} = ?
		AND
			local_to_remote = 1
	`;

	let args = [
		req.session.data.user_uuid
	];

	let rows;

	try {
		rows = await db.selectAll(sql, args);
	} catch(err) {
		throw err;
	}

	if(!rows.length) {
		return res.json({
			err : 0,
			msg : []
		});
	}

	sql = `
		SELECT
			user_uuid as user_uuid,
			username,
			company_name,
			company_address,
			company_building,
			company_department,
			company_tax_id,
			wallet_address
		FROM
			dat_users
		WHERE
			user_uuid = ?
	`;

	let rt = [];

	for(let i = 0, j = 0; i < rows.length; i++) {
		//args = [rows[i].contact_uuid.toString()];
		args = [rows[i].contact_uuid];

		try {
			rows[i] = await db.selectOne(sql, args);
		} catch(err) {
			continue;
		}
		if(rows[i] ==  null) {
			continue;
		}

		//console.log(rows[i]);
		//rows[i].user_uuid = rows[i].user_uuid.toString();

		rt[j] = { ...rows[i] };
		j++;
	}

	return res.json({
		err : 0,
		msg : rt
	});

});

router.post('/status', async function(req, res) {

	// First we need to get the details of the invite code
	const INVITE_TABLE = "dat_invite";

	let sql = `
		SELECT
			*
		FROM
			${INVITE_TABLE}
		WHERE
			invite_code = ?
	`;

	let args = [
		req.body.code
	];

	let invite;

	try {
		invite = await db.selectOne(sql, args);
	} catch (err) {
		throw err;
	}

	if(!invite) {
		return res.json({
			err : 1,
			msg : "Could not find invite"
		});
	}

	// Then we need to check for the details of the host

	sql = `
		SELECT
			username,
			company_name,
			company_postcode,
			company_address,
			company_building,
			company_department
		FROM
			dat_users
		WHERE
			user_uuid = ?
	`;

	args = [
		invite.host_user_uuid
	];

	let host;

	try {
		host = await db.selectOne(sql, args);
	} catch (err) {
		throw err;
	}

	if(!invite) {
		return res.json({
			err : 2,
			msg : "Could not find host"
		});
	}

	// Return the results to the client

	res.json({
		err : 0,
		msg :{
			invite : invite,
			host : host,
			session : req.session.data || null
		}
	});

});

router.post('/remove', async function(req, res) {

	const INVITE_TABLE = "dat_invite";

	let sql = `
		UPDATE
			${INVITE_TABLE}
		SET
			removed_on = NOW()
		WHERE
			host_user_uuid = ?
		AND
			invite_code = ?
	`;

	let args = [
		req.session.data.user_uuid,
		req.body.invite_code
	];

	let bool;

	try {
		bool = await db.update(sql, args);
	} catch(err) {
		throw err;
	}

	res.json({
		err : 0,
		msg : "okay"
	});

});

