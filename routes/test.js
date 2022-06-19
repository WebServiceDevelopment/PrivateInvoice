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

const express					= require('express');
const router					= express.Router();
module.exports					= router;

// Import Libraries

const axios						= require('axios');
const db			 				= require('../database.js');
const { signPresentation } = require('./sign_your_credentials.js');

// Helper functions

const exampleVC = {
	"@context": [
		"https://www.w3.org/2018/credentials/v1"
	],
	"id": "urn:uuid:4f1eabd0-76b7-4c8b-be72-a125b8bb9c48",
	"type": [
		"VerifiableCredential"
	],
	"issuer": "did:key:z6MktiSzqF9kqwdU8VkdBKx56EYzXfpgnNPUAGznpicNiWfn",
	"issuanceDate": "2010-01-01T19:23:24Z",
	"credentialSubject": {
		"id": "did:example:123"
	},
	"proof": {
		"type": "Ed25519Signature2018",
		"created": "2022-05-07T15:30:56Z",
		"verificationMethod": "did:key:z6MktiSzqF9kqwdU8VkdBKx56EYzXfpgnNPUAGznpicNiWfn#z6MktiSzqF9kqwdU8VkdBKx56EYzXfpgnNPUAGznpicNiWfn",
		"proofPurpose": "assertionMethod",
		"jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..GgO_6jlepqqhXbeSqLCfp4NEnzqi4JTmwNCDQT2hi9TR2nhQ8NhY9CTjssXrsxTSYNPED1MVmCll7Hsj33KYDQ"
	}
}

const getPrivateKeys = async (member_did) => {

	const sql = `
		SELECT
			public_key
		FROM
			privatekeys
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
		return [ null, err ];
	}

	const keyPair = JSON.parse(row.public_key);
	return [ keyPair, null ];

}


const initPresentation = async () => {

	const body = {
		query: [
			{
				type: "QueryByExample",
				credentialQuery: [
					{
						type: ["VerifiableCredential"],
						reason: "We want to present credentials."
					}
				]
			}
		]
	};

	const params = {
		method: 'post',
		url: 'http://192.168.1.126:3000/api/presentations/available',
		data: body
	}

	let response;
	try {
		response = await axios(params);
	} catch(err) {
		const error = {
			status: -1,
			data: 'unknown error'
		}

		if(err.response) {
			error.status = err.response.status;
			error.data = err.response.data;
		} else if(err.code === 'ECONNRESET') {
			error.status = 500;
			error.data = 'ECONNRESET';
		} else {
			error.status = 400;
			error.data = 'Undefined Error';
		}

		return [ null, error ];
	}

	return [ response.data, null ];

}

const sendPresentation = async( keyPair, domain, challenge, vc ) => {

	console.log(keyPair);

	const presentation = {
		'@context': [
			'https://www.w3.org/2018/credentials/v1'
		],
		id: `urn:uuid:${challenge}`,
		type: [
			'VerifiablePresentation'
		],
		verifiableCredential: [],
		holder: keyPair.controller,
	};

	if(vc) {
		presentation.verifiableCredential.push(vc);
	} else {
		presentation.verifiableCredential.push(exampleVC);
	}

	console.log('before sign');

	const signedPresentation = await signPresentation(
		presentation, 
		keyPair, 
		domain, 
		challenge);
	
	console.log('!!! signed !!!');
	console.log(signedPresentation);

	const params = {
		method: 'post',
		url: 'http://192.168.1.126:3000/api/presentations/submissions',
		data: signedPresentation
	}

	let response;
	try {
		response = await axios(params);
	} catch(err) {
		const error = {
			status: -1,
			data: 'unknown error'
		}

		if(err.response) {
			error.status = err.response.status;
			error.data = err.response.data;
		} else if(err.code === 'ECONNRESET') {
			error.status = 500;
			error.data = 'ECONNRESET';
		} else {
			error.status = 400;
			error.data = 'Undefined Error';
		}

		return [ null, error ];
	}

	return [ response.data, null ];

}

// Routes

router.post('/present', async (req, res) => {
	
	console.log(req.url);

	// 1.
	// First we get the key pair for the user initializing the
	// presentation

	const { member_uuid } = req.session.data;
	const [ keyPair, _err1 ] = await getPrivateKeys(member_uuid);
	if(_err1) {
		return res.json({
			err: 1,
			msg: 'could not get private keys'
		});
	}

	// 2.
	// Then we want to call `/api/presentations/available`
	// Which returns a domain and challenge

	const [ available, _err2 ] = await initPresentation();
	if(_err2) {
		return res.json({
			err: 2,
			msg: 'could not init presentation'
		});
	}
	const { domain, challenge } = available;
	
	// 3.
	// Then we sign and send the presentation to the 
	// submissions end-point

	sendPresentation(keyPair, domain, challenge, null);

	res.json({
		err: 0,
		msg: 'okay'
	});

});
