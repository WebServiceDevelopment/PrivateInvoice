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

'use strict'

// NPM Libraries

const axios					= require('axios')
const transmute				= require('@transmute/vc.js')

const {
	Ed25519Signature2018,
	Ed25519VerificationKey2018,
} = require('@transmute/ed25519-signature-2018')

const { resolve }			= require('@transmute/did-key.js')

// Local Libraries

const {
		documentLoader,
		getPrivateKeys,
}							= require('./verify_utils.js');

// Database

const db					= require('../database.js')

// Exports

module.exports = {
	makePresentation		: _makePresentation,

	getWalletPrivateKey		: _getWalletPrivateKey,
	getSellerWalletAddress	: _getSellerWalletAddress,
}

/**
 * Helper Functions
 **/

const checkStatus = () => {
	return true
}

/**
 * Module Functions
 **/

/*
async function _getPrivateKeys (member_did) {
	const sql = `
		SELECT
			public_key
		FROM
			privatekeys
		WHERE
			member_did = ?
	`

	const args = [member_did]

	let row
	try {
		row = await db.selectOne(sql, args)
	} catch (err) {
		return [null, err]
	}

	const keyPair = JSON.parse(row.public_key)
	return [keyPair, null]
}
*/

async function _makePresentation (url, keyPair, vc) {
	console.log('making the presentation!!!')

	// 1 Init Presentation

	console.log(url)

	const [available, _err1] = await initPresentation(url)
	if (_err1) {
		return [null, 'could not init']
	}

	const { domain, challenge } = available
	console.log(domain, challenge)

	// 2 Send Presentation

	const [send, _err2] = await sendPresentation(
		url,
		keyPair,
		domain,
		challenge,
		vc
	)
	if (_err2) {
		console.log(_err2)
		return [null, 'could not submit']
	}

	// Return Success

	return [send, null]
}


async function _getWalletPrivateKey (member_did) {

	const sql = `
		SELECT
			wallet_private_key
		FROM
			members
		WHERE
			member_did = ?
	`;

	const args = [
		member_did
	];

	let row;
	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	console.log(row.wallet_private_key);
	const buffer = Buffer.from(row.wallet_private_key.substring(2), 'hex');
	console.log(buffer);
	console.log(buffer.length);
	const privatekey = new Uint8Array(buffer);
	console.log(privatekey);

	return privatekey;

}

async function _getSellerWalletAddress (seller_did, member_did) {

	const sql = `
		SELECT
			remote_wallet_address
		FROM
			contacts
		WHERE
			local_member_did = ?
		AND
			remote_member_did = ?
	`;


	const args = [
		member_did,
		seller_did
	]
	
	console.log(args);

	let row
	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	console.log(row);

	return row.remote_wallet_address;

}


const initPresentation = async (url) => {
	const method = 'post'

	const data = {
		query: [
			{
				type: 'QueryByExample',
				credentialQuery: [
					{
						type: ['VerifiableCredential'],
						reason: 'We want to present credentials.',
					},
				],
			},
		],
	}

	const params = { method, url, data }

	let response
	try {
		response = await axios(params)
	} catch (err) {
		const error = {
			status: -1,
			data: 'unknown error',
		}

		if (err.response) {
			error.status = err.response.status
			error.data = err.response.data
		} else if (err.code === 'ECONNRESET') {
			error.status = 500
			error.data = 'ECONNRESET'
		} else {
			error.status = 400
			error.data = 'Undefined Error'
		}

		return [null, error]
	}

	return [response.data, null]
}

const sendPresentation = async(url, keyPair, domain, challenge, vc) => {

	console.log('--- Making presentation ---');

	const presentation = {
		'@context': [
			'https://www.w3.org/2018/credentials/v1',
			'https://w3id.org/traceability/v1'
		],
		id: `urn:uuid:${challenge}`,
		type: ['VerifiablePresentation'],
		verifiableCredential: [vc],
		holder: keyPair.controller,
	}

	url = url.replace('available', 'submissions')
	const method = 'post'

	console.log('before sign');
	
	let data;

	try {
		data = await signPresentation(
   			presentation,
   			keyPair,
			domain,
			challenge
		);
	} catch(err) {
		
		console.log('COULD NOT SIGN PRESENTATION!!!!');
		console.log(presentation);
		console.log(keyPair);
		throw err;
	}

	const params = { method, url, data }

	let response
	try {
		response = await axios(params)
	} catch (err) {
		const error = {
			status: -1,
			data: 'unknown error',
		}

		if (err.response) {
			error.status = err.response.status
			error.data = err.response.data
		} else if (err.code === 'ECONNRESET') {
			error.status = 500
			error.data = 'ECONNRESET'
		} else {
			error.status = 400
			error.data = 'Undefined Error'
		}

		return [null, error]
	}

	return [response.data, null]
}

const signPresentation = async (presentation, keyPair, domain, challenge) => {
	console.log('okay?')

	const { items } = await transmute.verifiable.presentation.create({
		presentation,
		format: ['vp'],
		domain,
		challenge,
		documentLoader,
		suite: new Ed25519Signature2018({
			key: await Ed25519VerificationKey2018.from(keyPair),
		}),
	})

	console.log('oh god!!')

	const [signedPresentation] = items
	return signedPresentation
}

