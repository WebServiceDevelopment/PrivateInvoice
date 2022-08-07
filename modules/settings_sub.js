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

// Libraries

const uuidv1				= require('uuid').v1;

// Database

const db					= require('../database.js');
const MEMBERS_TABLE			= "members";

// Exports

module.exports = {
	setProfileImage			: _setProfileImage,
	setCompanyLogo			: _setCompanyLogo,
	getProfileImage			: _getProfileImage,
	getCompanyLogo			: _getCompanyLogo,
    updateOrganization		: _updateOrganization,
    updateProfile           : _updateProfile,
}

/*
 * 1.
 * setProfileImage
 */
async function _setProfileImage (dataUrl, member_did) {

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
		dataUrl
	];

	try {
		await db.insert(sql, args);
	} catch(err) {
		return [ null, err]
	}

	// Set this in the member's table

	sql = `
		UPDATE
			members
		SET
			avatar_uuid = ?
		WHERE
			member_did = ?
	`;

	args = [
		avatar_uuid,
		member_did,
	];

	// Update the current changes in session object

	req.session.data.avatar_uuid = avatar_uuid;

	return [true, null]

}

/*
 * 2.
 * setCompanyLogo
 */
async function _setCompanyLogo (dataUrl, member_did ) {

	const logo_uuid = uuidv1();

	// Insert Image Into Database
	let sql, args, row;

	sql = `
		INSERT INTO organization_img (
			logo_uuid,
			img_data
		) VALUES (
			?,
			COMPRESS(?)
		)
	`;

	args = [
		logo_uuid,
		dataUrl
	];

	try {
		await db.insert(sql, args);
	} catch(err) {
		return [ null, err]
	}

	// Set this in the member's table

	sql = `
        SELECT
            organization_uuid,
        FROM
            members
        WHERE
            member_did = ?
	`;

	args = [
		member_did,
	];

    try {
        row = await db.selectOne(sql, args);
    } catch (err) {
		return [ null, err]
    }

	sql = `
		UPDATE
			organizations
		SET
			logo_uuid = ?
		WHERE
			organization_uuid = ?
	`;

	args = [
		logo_uuid,
		row.organization_uuid
	];

	// Update the current changes in session object

	req.session.data.logo_uuid = logo_uuid;

	return [true, null]

}

/*
 * 3.
 * getProfileImage
 */
async function _getProfileImage ( avatar_uuid) {

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
		avatar_uuid
	];

	let row;

	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		return [ null, err]
	}

	if(row && row.dataUrl) {
		row.dataUrl = row.dataUrl.toString()
	}

	return [row , null];

};

/*
 * 4.
 * getCompanyLogo
 */
async function _getCompanyLogo( logo_uuid) {

	let sql = `
		SELECT
			UNCOMPRESS(img_data) AS dataUrl
		FROM
			organization_img
		WHERE
			logo_uuid = ?
		LIMIT 1
	`;

	let args = [
		logo_uuid
	];

	let row;

	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		return [ null, err]
	}

	if(row && row.dataUrl) {
		row.dataUrl = row.dataUrl.toString()
	}

	return [row , null];

};

/*
 * 5. updateOrganization
 *
 */
async function _updateOrganization(req ) {

    let sql, args, row;
    // step 1

    sql = `
        SELECT
            organization_uuid
        FROM
            members
        WHERE
            member_did = ?
    `;

    args = [
        req.session.data.member_did,
    ];

    try {
        row = await db.selectOne(sql, args);
    } catch (err) {
		return [null, err];
    }

	// Step 2 : Update members table

	sql = `
		UPDATE
			organizations
		SET
			organization_name = ?,
			organization_postcode = ?,
			organization_address = ?,
			organization_building = ?,
			organization_department = ?,
			organization_tax_id = ?,
			addressCountry = ?,
			addressRegion = ?,
			addressCity = ?
		WHERE
			organization_uuid = ?
	`;

	args = [
		req.body.organization_name,
		req.body.organization_postcode,
		req.body.organization_address,
		req.body.organization_building,
		req.body.organization_department,
		req.body.organization_tax_id,
		req.body.addressCountry,
		req.body.addressRegion,
		req.body.addressCity,
		row.organization_uuid
	];

	// Step 3 : Write Changes to log database

	try {
		await db.update(sql, args);
	} catch(err) {
		return [null, err];
	}

	return [ true, null];
}

/*
 * 6.
 * updateProfile
 */
async function _updateProfile(req ) {

	// Step 1 : Update members table

	let sql = `
		UPDATE
			${MEMBERS_TABLE}
		SET
			member_did = ?,
			membername = ?,
			job_title = ?,
			work_email = ?
		WHERE
			member_did = ?
	`;

	let args = [
		req.body.member_did,
		req.body.membername,
		req.body.job_title,
		req.body.work_email,
		req.session.data.member_did
	];

	// Step 2 : Write Changes to log database

	let result, err;
	try {
		result = await db.update(sql, args);
	} catch(err) {
		return [null, err];
	}

	return [result, null];
}
