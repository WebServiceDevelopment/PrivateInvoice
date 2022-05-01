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

const uuidv1 = require('uuid').v1
const bip39 = require('bip39')

// Database

const db = require('../database.js');
const USERS_TABLE = "dat_users";

// End Points

router.get("/logout", function(req, res) {

	req.session.destroy();
	res.clearCookie("connect.sid");
	res.redirect('/');

});

router.all('/check', async function(req, res) {

	res.json(req.session.data);

});

// Should be in settings (profile)
router.post('/updateCompany', async function(req, res) {

	// Step 1 : Update dat_users table

	let sql = `
		UPDATE
			${USERS_TABLE}
		SET
			company_name = ?,
			company_postcode = ?,
			company_address = ?,
			company_building = ?,
			company_department = ?,
			company_tax_id = ?
		WHERE
			user_uuid = ?
	`;

	let args = [
		req.body.company_name,
		req.body.company_postcode,
		req.body.company_address,
		req.body.company_building,
		req.body.company_department,
		req.body.company_tax_id,
		req.session.data.user_uuid
	];

	// Step 2 : Write Changes to log database

	try {
		await db.update(sql, args);
	} catch(err) {
		throw err;
	}

	// Step 3 : Update Current Reddis Session

	req.session.data.company_name = req.body.company_name;
	req.session.data.company_postcode = req.body.company_postcode;
	req.session.data.company_address = req.body.company_address;
	req.session.data.company_building = req.body.company_building;
	req.session.data.company_department = req.body.company_department;
	req.session.data.company_tax_id = req.body.company_tax_id;

	res.json({
		err : 0,
		msg : 'okay'
	});

});

// Should be in settings
router.post('/updateProfile', async function(req, res) {

	// Step 1 : Update dat_users table

	let sql = `
		UPDATE
			${USERS_TABLE}
		SET
			user_uuid = ?,
			username = ?,
			work_email = ?
		WHERE
			user_uuid = ?
	`;

	let args = [
		req.body.user_uuid,
		req.body.username,
		req.body.work_email,
		req.session.data.user_uuid
	];

	// Step 2 : Write Changes to log database

	let result, err;
	try {
		result = await db.update(sql, args);
	} catch(err) {
		//throw err;
        return res.status(400).end(err);
	}

    if(result.affectedRows != 1) {
		err = {err: 9, msg :"result.affectedRows != 1"}
        return res.status(406).end(err);
    }

	// Step 3 : Update Current Reddis Session

	req.session.data.user_uuid = req.body.user_uuid;
	req.session.data.username = req.body.username;
	req.session.data.work_email = req.body.work_email;

	res.json({
		err : 0,
		msg : 'okay'
	});

});


router.post('/login', async function(req, res) {

	const sql = `
		SELECT
			user_uuid,
			username,
			work_email,
			password_hash,
			company_name,
			company_postcode,
			company_address,
			company_building,
			company_department,
			company_tax_id,
			created_on,
			wallet_address,
			avatar_uuid
		FROM
			${USERS_TABLE}
		WHERE
			username = ?
	`;

	let user_data;

	try {
		user_data = await db.selectOne(sql, [req.body.username]);
	} catch(err) {
		throw err;
	}

	if(!user_data) {
		return res.json({
			err : 100,
			msg : "USERNAME NOT FOUND"
		});
	}

	let match = false;

	try {
		match = await db.compare(req.body.password, user_data.password_hash);
	} catch(err) {
		throw err;
	}

	if(!match) {
		return res.json({
			err : 100,
			msg : "INCORRECT PASSWORD"
		});
	}

	delete user_data.password_hash;
	user_data.user_uuid = user_data.user_uuid.toString();
	user_data.avatar_uuid = user_data.avatar_uuid.toString();
	req.session.data = user_data;

	res.json({
		err : 0,
		msg : "okay"
	});

});

router.post('/signup', async function(req, res) {

	// First we insert into the database

	const user_uuid = uuidv1();

	let sql = `
		INSERT INTO ${USERS_TABLE} (
			user_uuid,
			username,
			work_email,
			password_hash,
			company_name,
			company_postcode,
			company_address,
			company_building,
			company_department,
			wallet_address,
			avatar_uuid,
			logo_uuid
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
			?,
			'',
			''
		)
	`;

	console.log(req.body);
	console.log('Before hash');
	console.log(req.body.account.password);

	try {
		req.body.hash = await db.hash(req.body.account.password);
	} catch(err) {
		throw err;
	}

	console.log('after hash');

	const mnemonic = bip39.generateMnemonic()
	console.log(mnemonic);


	let args = [
		user_uuid,
		req.body.account.username,
		req.body.account.work_email,
		req.body.hash,
		req.body.company.name,
		req.body.company.postcode,
		req.body.company.address,
		req.body.company.building,
		req.body.company.department,
		mnemonic
	];

	try {
		await db.insert(sql, args);
	} catch(err) {
		console.log("yeah, problem");
		throw err;
	}

	// And then we request from the database and start the session

	sql = `
		SELECT
			user_uuid,
			username,
			work_email,
			password_hash,
			company_name,
			company_postcode,
			company_address,
			company_building,
			company_department,
			created_on,
			avatar_uuid
		FROM
			${USERS_TABLE}
		WHERE
			user_uuid = ?
	`;

	let user_data;
	try {
		user_data = await db.selectOne(sql, [user_uuid]);
	} catch(err) {
		throw err;
	}

	delete user_data.password_hash;
	user_data.user_uuid = user_data.user_uuid.toString();
	user_data.avatar_uuid = user_data.avatar_uuid.toString();
	req.session.data = user_data;

	res.json({
		err : 0,
		msg : "okay"
	});

});


