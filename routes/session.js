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

// Import Libraries

const uuidv1				= require('uuid').v1
const bip39					= require('bip39')

// Database

const db					= require('../database.js');
const MEMBERS_TABLE			= "members";

// Module Functions

const axios					= require('axios')
const wallet				= require('@sidetree/wallet')

const createDid = async ( mnemonic ) => {

	const keyType = 'Ed25519';
	const publicKey = await wallet.toKeyPair(mnemonic, keyType, "m/44'/60'/0'/0/0");
	const recoveryKey = await wallet.toKeyPair(mnemonic, keyType, "m/44'/60'/0'/1/0");
	const updateKey = await wallet.toKeyPair(mnemonic, keyType, "m/44'/60'/0'/2/0");

	const createOperation = await wallet.operations.create({
		document : {
			publicKeys: [
				{
					id: publicKey.id.split('#').pop(),
					type: publicKey.type,
					publicKeyJwk: publicKey.publicKeyJwk,
					purposes: ['authentication', 'assertionMethod']
				}
			]
		},
		recoveryKey : recoveryKey.publicKeyJwk,
		updateKey : updateKey.publicKeyJwk
	});

	const didUniqueSuffix = wallet.computeDidUniqueSuffix(createOperation.suffixData);
	const id = `did:elem:ganache:${didUniqueSuffix}`
	const host = 'http://localhost:4000';
	//const host = 'http://192.168.1.126:4000';
	const url = `${host}/api/1.0/operations`;
	
	try {
		await axios.post(url, createOperation);
	} catch(err) {
		return [ null, err ];
	}

	const keys = {
		id,
		publicKey,
		recoveryKey,
		updateKey
	};
		

	console.log(id);
	console.log(publicKey);

	return [ keys, null ];

}

const insertMnemonic = async (organization_id, mnemonic) => {

	const sql = `
		INSERT INTO mnemonics (
			organization_did,
			recovery_phrase
		) VALUES (
			?,
			?
		)
	`;

	const args = [
		organization_id,
		mnemonic
	];

	try {
		await db.insert(sql, args);
	} catch(err) {
		return [err];
	}

	return [ null ];

}

const insertPrivateKeys = async (keys) => {

 	const {
		id,
		publicKey,
		recoveryKey,
		updateKey
	} = keys;

	const sql = `
		INSERT INTO privatekeys (
			member_did,
			public_key,
			update_key,
			recovery_key
		) VALUES (
			?,
			?,
			?,
			?
		)
	`;

	const args = [
		id, 
		JSON.stringify(publicKey),
		JSON.stringify(updateKey),
		JSON.stringify(recoveryKey)
	];

	try {
		await db.insert(sql, args);
	} catch(err) {
		return [err];
	}

	return [ null ];

}


const insertMember = async (member_did, body) => {

	console.log('Member did: ', member_did);

	// Then insert into database

	const sql = `
		INSERT INTO members (
			member_uuid,
			membername,
			job_title,
			work_email,
			password_hash,

			organization_name,
			organization_department,
			organization_tax_id,

			addressCountry,
			addressRegion,
			organization_postcode,
			addressCity,
			organization_address,
			organization_building
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
			?,
			?,
			?,
			?
		)
	`;

	// Deconstruct postbody arguments

	const { member, company, address } = body;

	// First Create Password Hash

	let password_hash;
	try {
		password_hash = await db.hash(member.password);
	} catch(err) {
		throw err;
	}

	// Construct arguments
	
	const args = [
		member_did,
		member.membername,
		member.job_title,
		member.contact_email,
		password_hash,
		company.name,
		company.department,
		company.tax_id,
		address.country,
		address.region,
		address.postcode,
		address.city,
		address.line1,
		address.line2
	];

	try {
		await db.insert(sql, args);
	} catch(err) {
		return [err];
	}

	return [ null ];

}

const getSessionData = async(member_did) => {

	const sql = `
		SELECT
			member_uuid,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_name,
			organization_postcode,
			organization_address,
			organization_building,
			organization_department,
			organization_tax_id,
			addressCountry,
			addressRegion,
			addressCity,
			created_on
		FROM
			members
		WHERE
			member_uuid = ?
	`;

	let member_data;
	try {
		member_data = await db.selectOne(sql, [member_did]);
	} catch(err) {
		return [null, err];
	}

	delete member_data.password_hash;
	member_data.member_uuid = member_data.member_uuid.toString();
	return [ member_data, null ];

}


// ------------------------------- End Points -------------------------------

/*
 * 1.
 * logout
 */
router.get("/logout", function(req, res) {

	req.session.destroy();
	res.clearCookie("connect.sid");
	res.redirect('/');

});

/*
 * 2.
 * check
 */
router.all('/check', async function(req, res) {

	res.json(req.session.data);

});

/*
 * 3.
 * Should be in settings (profile)
 */
router.post('/updateCompany', async function(req, res) {

	// Step 1 : Update members table

	let sql = `
		UPDATE
			${MEMBERS_TABLE}
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
			member_uuid = ?
	`;

	let args = [
		req.body.organization_name,
		req.body.organization_postcode,
		req.body.organization_address,
		req.body.organization_building,
		req.body.organization_department,
		req.body.organization_tax_id,
		req.body.addressCountry,
		req.body.addressRegion,
		req.body.addressCity,
		req.session.data.member_uuid
	];

	// Step 2 : Write Changes to log database

	try {
		await db.update(sql, args);
	} catch(err) {
		throw err;
	}

	// Step 3 : Update Current Reddis Session

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
 * 4.
 * Should be in settings
 */
router.post('/updateProfile', async function(req, res) {

	// Step 1 : Update members table

	let sql = `
		UPDATE
			${MEMBERS_TABLE}
		SET
			member_uuid = ?,
			membername = ?,
			job_title = ?,
			work_email = ?
		WHERE
			member_uuid = ?
	`;

	let args = [
		req.body.member_uuid,
		req.body.membername,
		req.body.job_title,
		req.body.work_email,
		req.session.data.member_uuid
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

	req.session.data.member_uuid = req.body.member_uuid;
	req.session.data.membername = req.body.membername;
	req.session.data.job_title = req.body.job_title;
	req.session.data.work_email = req.body.work_email;

	res.json({
		err : 0,
		msg : 'okay'
	});

});

/*
 * 5.
 * login
 */
router.post('/login', async function(req, res) {

/*
	const sql = `
		SELECT
			member_uuid,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_name,
			organization_postcode,
			organization_address,
			organization_building,
			organization_department,
			organization_tax_id,
			addressCountry,
			addressRegion,
			addressCity,
			created_on,
			wallet_address,
			avatar_uuid
		FROM
			${MEMBERS_TABLE}
		WHERE
			membername = ?
	`;
*/
	const sql = `
		SELECT
			member_uuid,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_name,
			organization_postcode,
			organization_address,
			organization_building,
			organization_department,
			organization_tax_id,
			addressCountry,
			addressRegion,
			addressCity,
			created_on,
			wallet_address,
			avatar_uuid
		FROM
			${MEMBERS_TABLE}
		WHERE
			work_email = ?
	`;

	let member_data;

	try {
		member_data = await db.selectOne(sql, [req.body.membername]);
	} catch(err) {
		throw err;
	}

	if(!member_data) {
		console.log("req.body.membername="+req.body.membername);
		return res.json({
			err : 100,
			msg : "USERNAME NOT FOUND"
		});
	}

	let match = false;

	try {
		match = await db.compare(req.body.password, member_data.password_hash);
	} catch(err) {
		throw err;
	}

	if(!match) {
		return res.json({
			err : 100,
			msg : "INCORRECT PASSWORD"
		});
	}

	delete member_data.password_hash;
	member_data.member_uuid = member_data.member_uuid.toString();

	if( member_data.avatar_uuid != null) {
		member_data.avatar_uuid = member_data.avatar_uuid.toString();
	}
	req.session.data = member_data;

	res.json({
		err : 0,
		msg : "okay"
	});

});

/*
 * 6.
 * signup
 */

router.post('/signup', async function(req, res) {

	// 0.
	// First we generate a mnemonic for the organization

	const mnemonic = bip39.generateMnemonic();

	// 1.
	// Then we generare a did from the first index

	const [ keys, err1 ] = await createDid(mnemonic);
	if(err1) {
		console.log(err1);
		return res.status(500).json({
			err : 1,
			msg : 'Could not anchor did'
		});
	}
	
	const { id, publicKey } = keys;
	console.log('id: ', id);

	// 2.
	// Then we insert the newly created member

	const [err2] = await insertMember(id, req.body);
	if(err2) {
		console.log(err2);
		return res.status(500).json({
			err : 2,
			msg : 'Could not insert member'
		});
	}

	// 3.
	// Then we store the created mnemonic for the organization

	const [err3] = await insertMnemonic(id, mnemonic);
	if(err3) {
		console.log(err3);
		return res.status(500).json({
			err : 3,
			msg : 'Could not insert mnemonic'
		});
	}

	// 4.
	// Then we store the private keys to be able to sign later

	const [err4] = await insertPrivateKeys(keys);
	if(err4) {
		console.log(err4);
		return res.status(500).json({
			err : 4,
			msg : 'Could not store private keys'
		});
	}

	// 5.
	// Then we select session data to auto-login

	const [member_data, err5] = await getSessionData(id);
	if(err4) {
		console.log(err5);
		return res.status(500).json({
			err : 5,
			msg : 'Could not get session data'
		});
	}
	req.session.data = member_data;

	// Return response to client
	
	res.json({
		err : 0,
		msg : "okay"
	});


});


