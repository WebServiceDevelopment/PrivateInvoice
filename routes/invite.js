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

// Libraries

const uuidv1				= require('uuid').v1;

// Database

const db					= require('../database.js');

//------------------------------- export modules -------------------------------

/*
 * create
 */
router.post('/create', async function(req, res) {

	const INVITE_TABLE = "invite";

	const invite_code = uniqid.time();

	let args = [
		invite_code,
		req.session.data.member_uuid,
		req.body.buyer,
		req.body.seller
	];

	args.push(req.body.count || null);

	let sql = `
		INSERT INTO ${INVITE_TABLE} (
			invite_code,
			local_member_uuid,
			rel_buyer,
			rel_seller,
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
			local_member_uuid = ?
	`;

	args = [
		invite_code,
		req.session.data.member_uuid
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

/*
 * list
 */
router.post('/list', async function(req, res) {

	const INVITE_TABLE = "invite";

	let sql = `
		SELECT
			*
		FROM
			${INVITE_TABLE}
		WHERE
			local_member_uuid = ?
		AND
			removed_on IS NULL
		ORDER BY
			created_on DESC
	`;

	let args = [
		req.session.data.member_uuid
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

/*
 * submit
 */
router.post('/submit', async function(req, res) {

	// First we need to check to make sure the invite is valid
	
	const INVITE_TABLE = "invite";
	const CONTACTS_TABLE = "contacts";

	let sql = `
		SELECT
			invite_code,
			local_member_uuid as local_member_uuid,
			rel_buyer,
			rel_seller,
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

	invite.local_member_uuid = invite.local_member_uuid.toString();

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
			seller_uuid,
			buyer_uuid
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

	if(invite.rel_seller) {

		args = [
			contact_uuid,
			invite.invite_code,
			req.session.data.member_uuid,
			invite.local_member_uuid
		];

		try {
			bool = await db.insert(sql, args);
		} catch (err) {
			throw err;
		}

	} else if(invite.rel_buyer) {

		args = [
			contact_uuid,
			invite.invite_code,
			invite.local_member_uuid,
			req.session.data.member_uuid
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

/*
 * contacts
 */
router.post('/contacts', async function(req, res) {

	const CONTACTS_TABLE = "contacts";

	let contactType, myPosition;

	// First we get a list of all of the contact uuid's
	// in the direction that we request

	switch(req.body.contactType) {
	case "sellers":
		contactType = "seller_uuid";
		myPosition = "buyer_uuid";

		//console.log("/contacts sellers ");
		break;
	case "buyers":
		contactType = "remote_member_uuid";
		myPosition = "local_member_uuid";

		//console.log("/contacts buyers ");
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
			${contactType} AS contact_uuid,
			remote_origin
		FROM
			${CONTACTS_TABLE}
		WHERE
			${myPosition} = ?
		AND
			local_to_remote = 1
	`;

	let args = [
		req.session.data.member_uuid
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
			member_uuid as member_uuid,
			membername,
			organization_name,
			organization_address,
			organization_building,
			organization_department,
			organization_tax_id,
			addressCountry,
			addressRegion,
			addressCity,
			wallet_address
		FROM
			members
		WHERE
			member_uuid = ?
	`;

	let rt = [];
	let remote_origin;

	for(let i = 0, j = 0; i < rows.length; i++) {
		args = [rows[i].contact_uuid];
		remote_origin = rows[i].remote_origin;

		try {
			rows[i] = await db.selectOne(sql, args);
		} catch(err) {
			continue;
		}
		if(rows[i] ==  null) {
			continue;
		}

		//console.log(rows[i]);
		//rows[i].member_uuid = rows[i].member_uuid.toString();

		rt[j] = { ...rows[i] };
		rt[j].remote_origin = remote_origin;
		j++;
	}

	return res.json({
		err : 0,
		msg : rt
	});

});

/*
 * status
 */
router.post('/status', async function(req, res) {

	// First we need to get the details of the invite code
	const INVITE_TABLE = "invite";

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
			membername,
			organization_name,
			organization_postcode,
			organization_address,
			organization_building,
			organization_department
		FROM
			members
		WHERE
			member_uuid = ?
	`;

	args = [
		invite.local_member_uuid
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

	// Return the results to the buyer

	res.json({
		err : 0,
		msg :{
			invite : invite,
			host : host,
			session : req.session.data || null
		}
	});

});

/*
 * remove
 */
router.post('/remove', async function(req, res) {

	const INVITE_TABLE = "invite";

	let sql = `
		UPDATE
			${INVITE_TABLE}
		SET
			removed_on = NOW()
		WHERE
			local_member_uuid = ?
		AND
			invite_code = ?
	`;

	let args = [
		req.session.data.member_uuid,
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

