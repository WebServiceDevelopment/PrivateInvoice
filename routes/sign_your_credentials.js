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

// Import sub

// Import Router
const express                   = require('express');

// Libraries

const moment					= require('moment');

// Sign
const transmute					= require('@transmute/vc.js');

const {
	Ed25519Signature2018,
	Ed25519VerificationKey2018,
} = require('@transmute/ed25519-signature-2018');

const context = {
	"https://www.w3.org/2018/credentials/v1" : require('../context/credentials_v1.json'),
	"https://w3id.org/traceability/v1" : require('../context/traceability_v1.json')
}

/*
 * documentLoader;
 */
const documentLoader = async (iri) => {

	if(context[iri]) {
		return { document: context[iri] };
	}

	const message = `Unsupported iri: ${iri}`;
	console.error(message);
	throw new Error(message);

}


// module
module.exports = {
	signInvoice : signInvoice,
}

// ------------------------------- modules -------------------------------

/*
 * signInvoice (uuid, json_str)
 */
async function signInvoice (uuid, json_str) {
 
	const keyPair = {
		"id": "did:key:z6Mkf56ZMux5Di3vjhUKh1TFPhJLFXCRshEZ5s6hSFDXFqUK#z6Mkf56ZMux5Di3vjhUKh1TFPhJLFXCRshEZ5s6hSFDXFqUK",
		"type": "JsonWebKey2020",
		"controller": "did:key:z6Mkf56ZMux5Di3vjhUKh1TFPhJLFXCRshEZ5s6hSFDXFqUK",
		"publicKeyJwk": {
			"kty": "OKP",
			"crv": "Ed25519",
			"x": "CS4utW8JLa1uK2m8s1MGmfLadVBir3tKVQql9C8cBoA"
		},
		"privateKeyJwk": {
			"kty": "OKP",
			"crv": "Ed25519",
			"x": "CS4utW8JLa1uK2m8s1MGmfLadVBir3tKVQql9C8cBoA",
			"d": "A_uk3z4SI_6ml15iOiuLkF-aUiqd210SoVmH2KhGYp0"
		},
		"@context": [
			"https://w3id.org/wallet/v1"
		],
		"name": "Sidetree Key",
		"image": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
		"description": "Generated by @sidetree/wallet.",
		"tags": []
	}
	
	const credential = JSON.parse(json_str);

	credential.id = uuid;
	credential.issuanceDate = moment().format('yyyy-MM-DD')
	credential.issuer.id = "did:elem:ganache:EiClyGV3hyFWAq3zFBDbXIh6gDpSrqWeiL4Dlrv9Gjdbxw";
	
	const { items } = await transmute.verifiable.credential.create({
		credential,
		format: ['vc'],
		documentLoader,
		suite: new Ed25519Signature2018({
			key: await Ed25519VerificationKey2018.from(keyPair)
		})
	});

	const [ signedCredential ] = items;

	return signedCredential;

}
