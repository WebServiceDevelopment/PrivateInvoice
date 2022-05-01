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

router.post('/setProfileImage', async function(req, res) {

	const avatar_uuid = uuidv1();

	// Insert Image Into Database

	let sql = `
		INSERT INTO dat_profile_img (
			avatar_uuid,
			img_data
		) VALUES (
			?,
			COMPRESS(?)
		)
	`;

	let args = [
		avatar_uuid,
		req.body.dataUrl
	];

	try {
		await db.insert(sql, args);
	} catch(err) {
		throw err;
	}

	// Set this in the user's table

	sql = `
		UPDATE
			dat_users
		SET
			avatar_uuid = ?
		WHERE
			user_uuid = ?
	`;

	args = [
		avatar_uuid,
		req.session.data.user_uuid,
	];

	// Update the current changes in session object

	req.session.data.avatar_uuid = avatar_uuid;

	res.json({
		err : 0,
		msg : 'okay'
	});

});

router.post('/setCompanyLogo', async function(req, res) {

	const logo_uuid = uuidv1();

	// Insert Image Into Database

	let sql = `
		INSERT INTO dat_company_img (
			logo_uuid,
			img_data
		) VALUES (
			?,
			COMPRESS(?)
		)
	`;

	let args = [
		logo_uuid,
		req.body.dataUrl
	];

	try {
		await db.insert(sql, args);
	} catch(err) {
		throw err;
	}

	// Set this in the user's table

	sql = `
		UPDATE
			dat_users
		SET
			logo_uuid = ?
		WHERE
			user_uuid = ?
	`;

	args = [
		logo_uuid,
		req.session.data.user_uuid,
	];

	// Update the current changes in session object

	req.session.data.logo_uuid = logo_uuid;

	res.json({
		err : 0,
		msg : 'okay'
	});

});

router.post('/getProfileImage', async function(req, res) {

	let sql = `
		SELECT
			UNCOMPRESS(img_data) AS dataUrl
		FROM
			dat_profile_img
		WHERE
			avatar_uuid = ?
		LIMIT 1
	`;

	let args = [
		req.session.data.avatar_uuid
	];

	let row;

	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	if(row && row.dataUrl) {
		row.dataUrl = row.dataUrl.toString()
	}

	res.json({
		err : 0,
		msg : row
	});

});

router.post('/getCompanyLogo', async function(req, res) {

	let sql = `
		SELECT
			UNCOMPRESS(img_data) AS dataUrl
		FROM
			dat_company_img
		WHERE
			logo_uuid = ?
		LIMIT 1
	`;

	let args = [
		req.session.data.logo_uuid
	];

	let row;

	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	if(row && row.dataUrl) {
		row.dataUrl = row.dataUrl.toString()
	}

	res.json({
		err : 0,
		msg : row
	});

});

