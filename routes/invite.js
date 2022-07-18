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
const uniqid				= require("uniqid");

// Libraries

const uuidv1				= require('uuid').v1;

// Database

const db					= require('../database.js');

//------------------------------- export modules -------------------------------

/*
 * 1.
 * create
 */
router.post('/create', async function(req, res) {

	const INVITE_TABLE = "invite";

// 1.
	const invite_code = uniqid.time();

// 2.
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
		//throw err;
		console.log("invite create error 2")

		return res.json({
			err : 2,
			msg : "Can not inset INVITE_TABLE"
		});
	}

// 3.
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
		//throw err;
		console.log("invite create error 3")

		return res.json({
			err : 3,
			msg : "Can not select INVITE_TABLE"
		});
	}

	//console.log(row);

	res.json({
		err : 0,
		msg : row
	});

});

/*
 * 2.
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
		//throw err;
		console.log("invite list error 1")

		return res.json({
			err : 1,
			msg : "Expired code"
		});
	}

	res.json({
		err : 0,
		msg : rows
	});

});

/*
 * 3.
 * submit
 */
router.post('/submit', async function(req, res) {

	// First we need to check to make sure the invite is valid
	
	const INVITE_TABLE = "invite";
	const CONTACTS_TABLE = "contacts";

// 1.
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
		//throw err;
		console.log("invite submit error 1")

		return res.status(400).json({
			err : 1,
			msg : "Could not select INVITE_TABLE"
		});
	}

// 2.
	if(!invite) {
		console.log("invite submit error 2")

		return res.json({
			err : 2,
			msg : "Expired code"
		});
	}

// 3.
	// If the max count has been reached, then we return

	if(invite.max_count && invite.use_count >= invite.max_count) {
		console.log("invite submit error 3")

		return res.json({
			err : 3,
			msg : "Use quota filled"
		});
	}

	invite.local_member_uuid = invite.local_member_uuid.toString();

// 4.
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
		//throw err;
		console.log("invite submit error 4")

		return res.status(400).json({
			err : 1,
			msg : "Could not update INVITE_TABLE"
		});
	}

// 5.
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
// 6.

		args = [
			contact_uuid,
			invite.invite_code,
			req.session.data.member_uuid,
			invite.local_member_uuid
		];

		try {
			bool = await db.insert(sql, args);
		} catch (err) {
			//throw err;
			console.log("invite submit error 6")

			return res.status(400).json({
				err : 6,
				msg : "Could not insert CONTACT_TABLE"
			});
		}

	} else if(invite.rel_buyer) {
// 7.

		args = [
			contact_uuid,
			invite.invite_code,
			invite.local_member_uuid,
			req.session.data.member_uuid
		];

		try {
			bool = await db.insert(sql, args);
		} catch (err) {
			//throw err;
			console.log("invite submit error 7")

			return res.status(400).json({
				err : 7,
				msg : "Could not insert CONTACT_TABLE"
			});
		}

	}

	return res.json({
		err : 0,
		msg : contact_uuid
	});

});

/*
 * 4.
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
	}

	let sql = `
		SELECT
			${contactType} AS contact_uuid,
			remote_member_uuid,
			remote_membername,
			remote_origin,
			remote_organization
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
		//throw err;
		console.log("invite contacts error 1")

		return res.status(400).json({
			err : 1,
			msg : "Could not select CONTACTS_TABLE"
		});
	}

	if(!rows.length) {
		return res.json({
			err : 0,
			msg : []
		});
	}

	const contactList = rows.map( (row) => {

		const org = JSON.parse(row.remote_organization);
		
		return {
			remote_origin : row.remote_origin,
			member_uuid : row.remote_member_uuid,
			membername : row.remote_membername,
            organization_name : org.name,
            organization_address : org.address,
            organization_building : org.building,
            organization_department : org.department,
            organization_tax_id : '',
            addressCountry : '',
            addressRegion : '',
            addressCity : '',
            wallet_address : ''
		}
	});


	return res.json({
		err : 0,
		msg : contactList
	});

});

/*
 * 5.
 * status
 */
router.post('/status', async function(req, res) {

	// First we need to get the details of the invite code
	const INVITE_TABLE = "invite";

	let sql, args;

// 1.
	sql = `
		SELECT
			*
		FROM
			${INVITE_TABLE}
		WHERE
			invite_code = ?
	`;

	args = [
		req.body.code
	];

	let invite;

	try {
		invite = await db.selectOne(sql, args);
	} catch (err) {
		//throw err;
		console.log("invite status error 2")

		return res.status(400).json({
			err : 2,
			msg : "Could not find members"
		});
	}

// 2.
	if(!invite) {
		console.log("invite status error 1")

		return res.status(400).json({
			err : 1,
			msg : "Could not find invite"
		});
	}

// 3.
	// Then we need to check for the details of the host

/*
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
*/
	sql = `
		SELECT
			membername,
			organization_uuid,
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
		//throw err;
		console.log("invite status error 3")

		return res.status(400).json({
			err : 3,
			msg : "Could not find members"
		});
	}

// 4.
	if(!invite) {
		console.log("invite status error 3")

		return res.status(400).json({
			err : 4,
			msg : "Could not find host"
		});
	}


// 5.
	sql = `
		SELECT
			organization_name,
			organization_postcode,
			organization_address,
			organization_building,
			organization_department
		FROM
			organizations
		WHERE
			organization_uuid = ?
	`;

	args = [
		host.organization_uuid
	];

	let org;

	try {
		org = await db.selectOne(sql, args);
	} catch (err) {
		//throw err;
		console.log("invite status error 5")

		return res.status(400).json({
			err : 5,
			msg : "Could not find organization"
		});
	}

// 6.
	host.organization_name		= org.organization_name;
	host.organization_postcode	= org.organization_postcode;
	host.organization_address	= org.organization_address;
	host.organization_building	= org.organization_building;
	host.organization_department = org.organization_department;

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
 * 6.
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
		//throw err;
		console.log("invite remove error 1")

		return res.status(400).json({
			err : 1,
			msg : "Could not remove"
		});
	}

	res.json({
		err : 0,
		msg : "okay"
	});

});

