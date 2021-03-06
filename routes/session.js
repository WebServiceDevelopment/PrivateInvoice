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
const { ethers }			= require('ethers')

const Web3					= require('web3')
const web3					= new Web3(process.env.GANACHE_ADDRESS)
const { eth }				= web3;


// Database

const db					= require('../database.js');
const MEMBERS_TABLE			= "members";
const { handleLogin }		= require('../modules/sessions.js');

// Module Functions

const axios					= require('axios')
const wallet				= require('@sidetree/wallet')

const createDidKey = async ( mnemonic ) => {

	const keyType = 'Ed25519';
	const publicKey = await wallet.toKeyPair(mnemonic, keyType, "m/44'/60'/0'/0/0");

	const keys = {
		id: publicKey.controller,
		publicKey,
		recoveryKey: null,
		updateKey: null
	};
		
	return [ keys, null ];

}

const createDidElem = async ( mnemonic ) => {

	const keyType = 'Ed25519';
	const publicKey = await wallet.toKeyPair(mnemonic, keyType, "m/44'/60'/0'/0/0");
	const recoveryKey = await wallet.toKeyPair(mnemonic, keyType, "m/44'/60'/0'/1/0");
	const updateKey = await wallet.toKeyPair(mnemonic, keyType, "m/44'/60'/0'/2/0");

	const createOperation = await wallet.operations.create({
		document : {
			publicKeys: [
				{
					id: 'default',
					type: publicKey.type,
					publicKeyJwk: publicKey.publicKeyJwk,
					purposes: ['authentication', 'assertionMethod']
				}
			]
		},
		recoveryKey : recoveryKey.publicKeyJwk,
		updateKey : updateKey.publicKeyJwk
	});

	console.log('CREATE OPERATION');
	console.log(createOperation);

	const fragment = publicKey.id.split('#').pop();
	const didUniqueSuffix = wallet.computeDidUniqueSuffix(createOperation.suffixData);
	const id = `did:elem:ganache:${didUniqueSuffix}`
	const url = `${process.env.ELEMENT_NODE}/operations`;
	
	try {
		await axios.post(url, createOperation);
	} catch(err) {
		return [ null, err ];
	}

	publicKey.id = `${id}#default`;
	publicKey.controller = id;

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


const insertMember = async (member_did, body, eth_address, privatekey) => {

	console.log('Member did: ', member_did);

	// 1.
	// Deconstruct postbody arguments
	
	const { member, company, address } = body;

	// 2.
	// First Create Password Hash
	let password_hash;
	try {
		password_hash = await db.hash(member.password);
	} catch(err) {
		throw err;
	}

	let sql, args;

	// 3.
	// Then insert into members table
	
	sql = `
		INSERT INTO members (
			member_did,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_uuid,
			wallet_address,
			wallet_private_key
		) VALUES (
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

	// Construct arguments
	
	args = [
		member_did,
		member.membername,
		member.job_title,
		member.contact_email,
		password_hash,
		member_did,
		eth_address,
		privatekey
	];


	try {
		await db.insert(sql, args);
	} catch(err) {
		return [err];
	}

	// 4.
	// Then insert into organizations table

	sql = `
		INSERT INTO organizations (
			organization_uuid,
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
			?
		)
	`;

	args = [
		member_did,
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

	let sql;

	// 1.
	sql = `
		SELECT
			member_did,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_uuid,
			wallet_address
		FROM
			members
		WHERE
			member_did = ?
	`;

	let member_data;
	try {
		member_data = await db.selectOne(sql, [member_did]);
	} catch(err) {
		return [null, err];
	}


	// 2.
	sql = `
		SELECT
			organization_name,
			organization_postcode,
			organization_address,
			organization_building,
			organization_department,
			organization_tax_id,
			addressCountry,
			addressRegion,
			addressCity
		FROM
			organizations
		WHERE
			organization_uuid = ?
	`;
	let org;
	try {
		org = await db.selectOne(sql, [member_data.organization_uuid]);
	} catch(err) {
		return [null, err];
	}

	// 3.
	
	member_data.organization_name		= org.organization_name,
	member_data.organization_postcode	= org.organization_postcode,
	member_data.organization_address	= org.organization_address,
	member_data.organization_building	= org.organization_building,
	member_data.organization_department	= org.organization_department,
	member_data.organization_tax_id		= org.organization_tax_id,
	member_data.addressCountry			= org.addressCountry,
	member_data.addressRegion			= org.addressRegion,
	member_data.addressCity				= org.addressCity


	// 4.
	delete member_data.password_hash;

	// 5.
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

	const isLoggedIn = (req.session && req.session.data) ? true : false;

	if(!isLoggedIn) {
		return res.status(400).json({
			message: 'No active session found for request'
		});
	}

	res.json(req.session.data);

});

/*
 * 3.
 * login
 */
router.post('/login', async function(req, res) {

	const { membername, password } = req.body;

	const [ data, err ] = await handleLogin(membername, password);
	if(err) {
		return res.status(400).json(err);
	}

	req.session.data = data;

	res.json({
		err : 0,
		msg : "okay"
	});

});

const insertFunds = async ( newMemberAddress ) => {

	// 0.1 ETH in Wei
	const UNIT_VALUE = 100000000000000000;
	const AMOUNT = Math.floor( Math.random() * 10 );
	const WEI_TO_SEND = UNIT_VALUE * AMOUNT;


	const accounts = await eth.getAccounts()
	const [ sourceAddress ] = accounts;
	const gasPrice = await eth.getGasPrice()

	const sourceBalanceStart = await eth.getBalance(sourceAddress);
	console.log('Source Balance(start): ', sourceBalanceStart);

	const transactionObj = {
		from: sourceAddress,
		to: newMemberAddress,
		value: WEI_TO_SEND
	};

	const transaction = await eth.sendTransaction(transactionObj);

	const sourceBalanceEnd = await eth.getBalance(sourceAddress);
	console.log('Source Balance(end): ', sourceBalanceEnd);

	const memberBalance = await eth.getBalance(newMemberAddress);
	console.log('Member Balance: ', memberBalance);

}

/*
 * 4.
 * signup
 */

router.post('/signup', async function(req, res) {

	// 0.
	// First we generate a mnemonic for the organization

	const mnemonic = bip39.generateMnemonic();
	const wallet = ethers.Wallet.fromMnemonic(mnemonic);
	const { address, privateKey } = wallet;

	// 1.
	// For testing we insert a small amount of ETH into the wallet
	// for testing
	
	await insertFunds(address);

	// 2.
	// Then we generare a did from the first index

	const USE_DID_KEY = true;
	const [ keys, err1 ] = USE_DID_KEY
		? await createDidKey(mnemonic)
		: await createDidElem(mnemonic);

	if(err1) {
		console.log(err1);
		return res.status(500).json({
			err : 1,
			msg : 'Could not anchor did'
		});
	}
	
	const { id, publicKey } = keys;
	console.log('id: ', id);

	// 3.
	// Then we insert the newly created member

	const [err2] = await insertMember(id, req.body, address, privateKey);
	if(err2) {
		console.log(err2);
		return res.status(500).json({
			err : 2,
			msg : 'Could not insert member'
		});
	}

	// 4.
	// Then we store the created mnemonic for the organization

	const [err3] = await insertMnemonic(id, mnemonic);
	if(err3) {
		console.log(err3);
		return res.status(500).json({
			err : 3,
			msg : 'Could not insert mnemonic'
		});
	}

	// 5.
	// Then we store the private keys to be able to sign later

	const [err4] = await insertPrivateKeys(keys);
	if(err4) {
		console.log(err4);
		return res.status(500).json({
			err : 4,
			msg : 'Could not store private keys'
		});
	}

	// 6.
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


/*
 * 5.
 * Should be in settings (profile)
 */
router.post('/updateCompany', async function(req, res) {

	let sql, args, row;
	// step 1 

	sql = `
        SELECT
            organization_uuid,
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
        throw err;
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
		throw err;
	}

	// Step 4 : Update Current Reddis Session

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
		//throw err;
		return res.status(400).end(err);
	}

	if(result.affectedRows != 1) {
		err = {err: 9, msg :"result.affectedRows != 1"}
		return res.status(406).end(err);
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

