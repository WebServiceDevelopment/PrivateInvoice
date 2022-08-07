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

const express                   = require('express');
const router                    = express.Router();
module.exports                  = router;

// Import Modules
const {
    setProfileImage,
    setCompanyLogo,
    getProfileImage,
    getCompanyLogo,
    updateOrganization,
	updateProfile,
}                               = require('../modules/settings_sub.js');

// Libraries

const uuidv1                    = require('uuid').v1;

// Database

// End Points

/*
 * 1.
 * setProfileImage
 */
router.post('/setProfileImage', async function(req, res) {

	const METHOD = '/setProfileImage';

/*
*	const avatar_uuid = uuidv1();
*
*	// Insert Image Into Database
*
*	let sql = `
*		INSERT INTO dat_profile_img (
*			avatar_uuid,
*			img_data
*		) VALUES (
*			?,
*			COMPRESS(?)
*		)
*	`;
*
*	let args = [
*		avatar_uuid,
*		req.body.dataUrl
*	];
*
*	try {
*		await db.insert(sql, args);
*	} catch(err) {
*		throw err;
*	}
*
*	// Set this in the member's table
*
*	sql = `
*		UPDATE
*			members
*		SET
*			avatar_uuid = ?
*		WHERE
*			member_did = ?
*	`;
*
*	args = [
*		avatar_uuid,
*		req.session.data.member_did,
*	];
*
*	// Update the current changes in session object
*
*
*	req.session.data.avatar_uuid = avatar_uuid;
*/

	const [bool , err] = await setProfileImage(
								req.body.dataUrl, 
								req.session.member_did);

	if(err) {
		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg : msg
			});
		return;
	}

	res.json({
		err : 0,
		msg : 'okay'
	});

});

/*
 * 2.
 * setCompanyLogo
 */
router.post('/setCompanyLogo', async function(req, res) {

	const METHOD = '/setCompanyLogo';

/*
*	const logo_uuid = uuidv1();
*
*	// Insert Image Into Database
*	let sql, args, row;
*
*	sql = `
*		INSERT INTO organization_img (
*			logo_uuid,
*			img_data
*		) VALUES (
*			?,
*			COMPRESS(?)
*		)
*	`;
*
*	args = [
*		logo_uuid,
*		req.body.dataUrl
*	];
*
*	try {
*		await db.insert(sql, args);
*	} catch(err) {
*		throw err;
*	}
*
*	// Set this in the member's table
*
*	sql = `
*        SELECT
*            organization_uuid,
*        FROM
*            members
*        WHERE
*            member_did = ?
*	`;
*
*	args = [
*		req.session.data.member_did,
*	];
*
*    try {
*        row = await db.selectOne(sql, args);
*    } catch (err) {
*        throw err;
*    }
*
*	sql = `
*		UPDATE
*			organizations
*		SET
*			logo_uuid = ?
*		WHERE
*			organization_uuid = ?
*	`;
*
*	args = [
*		logo_uuid,
*		row.organization_uuid
*	];
*
*	// Update the current changes in session object
*
*	req.session.data.logo_uuid = logo_uuid;
*/

	const [bool , err] = await setCompanyLogo(
								req.body.dataUrl, 
								req.session.data.member_did)

	if(err) {
		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg : msg
			});
		return;
	}

	res.json({
		err : 0,
		msg : 'okay'
	});

});

/*
 * 3.
 * getProfileImage
 */
router.post('/getProfileImage', async function(req, res) {

	const METHOD = '/getProfileImage';
/*
*	let sql = `
*		SELECT
*			UNCOMPRESS(img_data) AS dataUrl
*		FROM
*			dat_profile_img
*		WHERE
*			avatar_uuid = ?
*		LIMIT 1
*	`;
*
*	let args = [
*		req.session.data.avatar_uuid
*	];
*
*	let row;
*
*	try {
*		row = await db.selectOne(sql, args);
*	} catch(err) {
*		throw err;
*	}
*/

	const [row , err] = await getProfileImage( req.session.data.avatar_uuid)

	if(err) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg : msg
			});
		return;
	}

	if(row && row.dataUrl) {
		row.dataUrl = row.dataUrl.toString()
	}

	res.json({
		err : 0,
		msg : row
	});

});

/*
 * 4.
 * getCompanyLogo
 */
router.post('/getCompanyLogo', async function(req, res) {

	const METHOD = '/getCompanyLogo';

/*
*	let sql = `
*		SELECT
*			UNCOMPRESS(img_data) AS dataUrl
*		FROM
*			organization_img
*		WHERE
*			logo_uuid = ?
*		LIMIT 1
*	`;
*
*	let args = [
*		req.session.data.logo_uuid
*	];
*
*	let row;
*
*	try {
*		row = await db.selectOne(sql, args);
*	} catch(err) {
*		throw err;
*	}
*/

	const [row , err] = await getCompanyLogo( req.session.data.avatar_uuid)

	if(err) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg : msg
			});
		return;
	}

	if(row && row.dataUrl) {
		row.dataUrl = row.dataUrl.toString()
	}

	res.json({
		err : 0,
		msg : row
	});

});

/*
 * 5.
 * Should be in settings (profile)
 */
router.post('/updateOrganization', async function(req, res) {

	const METHOD = '/updateOrganization';

	const [bool, err] = await updateOrganization(req) ;
	if(err) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg : msg
			});
		return;
	}

	// Step 4 : Update Current Redis Session

	req.session.data.organization_name = req.body.organization_name;
	req.session.data.organization_postcode = req.body.organization_postcode;
	req.session.data.organization_address = req.body.organization_address;
	req.session.data.organization_building = req.body.organization_building;
	req.session.data.organization_department = req.body.organization_department;
	req.session.data.organization_tax_id = req.body.organization_tax_id;
	req.session.data.addressCountry = req.body.addressCountry;
	req.session.data.addressRegion = req.body.addressRegion;
	req.session.data.addressCity = req.body.addressCity;

	res.json({
		err : 0,
		msg : 'okay'
	});

});

/*
 * 6.
 * Should be in settings
 */
router.post('/updateProfile', async function(req, res) {

	const METHOD = '/updateProfile';

	const [result, err] = await updateProfile(req );

	if(err) {
		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg : msg
			});
		return;
	}

	if(result.affectedRows != 1) {
		const msg = `Error:${METHOD}: result.affectedRows != 1`

		res.status(406)
			.json({
				err: 2,
				msg : msg
			});
		return;
	}

	// Step 3 : Update Current Reddis Session

	req.session.data.member_did = req.body.member_did;
	req.session.data.membername = req.body.membername;
	req.session.data.job_title = req.body.job_title;
	req.session.data.work_email = req.body.work_email;

	res.json({
		err : 0,
		msg : 'okay'
	});

});

