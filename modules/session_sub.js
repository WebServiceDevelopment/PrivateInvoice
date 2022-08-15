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

// Import Libraries
const Web3                      = require('web3')
const web3                      = new Web3(process.env.GANACHE_ADDRESS)
const { eth }                   = web3;

//  Database
const db                        = require('../database.js');

const MEMBERS_TABLE             = "members";

// Exports

module.exports = {
	handleLogin				    : _handleLogin,
	insertMnemonic			    : _insertMnemonic,
	insertPrivateKeys		    : _insertPrivateKeys,
	insertMember			    : _insertMember,
	getSessionData			    : _getSessionData,
	insertFunds				    : _insertFunds,
}

// ---------------------------------------------------------------------------

/*
 * handleLogin
 */
async function _handleLogin(membername, password) {

	// 1.

	let sql;
	sql = `
		SELECT
			member_did,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_did,
			created_on,
			wallet_address,
			avatar_uuid
		FROM
			${MEMBERS_TABLE}
		WHERE
			membername = ?
	`;

	let member_data;

	try {
		member_data = await db.selectOne(sql, [membername]);
	} catch(err) {
		throw err;
	}

	if(!member_data) {
		return [ null, { err : 100, msg : "USERNAME NOT FOUND" } ]
	}

	// 2.
	let match = false;

	try {
		match = await db.compare(password, member_data.password_hash);
	} catch(err) {
		throw err;
	}

	if(!match) {
		return [ null, { err : 100, msg : "INCORRECT PASSWORD" } ]
	}

	// 3.
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
			organization_did = ?
	`;

	let org;
	try {
		org = await db.selectOne(sql, [member_data.organization_did]);
	} catch(err) {
		return [ null, { err : 100, msg : "COULD NOT FIND ORG" } ]
	}

	// 4.
	member_data.organization_name	   = org.organization_name;
	member_data.organization_postcode   = org.organization_postcode;
	member_data.organization_address	= org.organization_address;
	member_data.organization_building   = org.organization_building;
	member_data.organization_department = org.organization_department;
	member_data.organization_tax_id	 = org.organization_tax_id;
	member_data.addressCountry		  = org.addressCountry;
	member_data.addressRegion		   = org.addressRegion;
	member_data.addressCity			 = org.addressCity;

	// 5.
	delete member_data.password_hash;
	delete member_data.avatar_uuid;

	return [ member_data, null ];
}

/*
 * insertMnemonic
 */
async function _insertMnemonic(organization_id, mnemonic) {

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

async function _insertPrivateKeys(keys) {

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

/*
 * insertMember
 */
async function _insertMember(member_did, body, eth_address, privatekey) {

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
			organization_did,
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
			organization_did,
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

/*
 * getSessionData
 */
async function _getSessionData(member_did) {

	let sql;

	// 1.
	sql = `
		SELECT
			member_did,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_did,
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
			organization_did = ?
	`;
	let org;
	try {
		org = await db.selectOne(sql, [member_data.organization_did]);
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

/*
 * insertFunds
 */
async function _insertFunds ( newMemberAddress ) {

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
