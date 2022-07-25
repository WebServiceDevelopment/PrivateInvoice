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
		contactType = "seller_did";
		myPosition = "buyer_did";

		//console.log("/contacts sellers ");
		break;
	case "buyers":
		contactType = "remote_member_did";
		myPosition = "local_member_did";

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
			remote_member_did,
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
		req.session.data.member_did
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
			member_did : row.remote_member_did,
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

