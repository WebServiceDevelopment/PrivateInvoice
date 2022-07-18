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
const express				   = require('express');

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

const { checkStatus } = require('@transmute/vc-status-rl-2020');
const { resolve } = require('@transmute/did-key.js');
const { documentLoader } = require('../modules/verify_utils.js');

// module

module.exports = {
	signStatusMessage,
	signInvoice,
	signBusinessCard,
	signPresentation,
	verifyPresentation
}

// ------------------------------- modules -------------------------------


/**
 * Sign Status Message
 **/

async function signStatusMessage (credential, keyPair) {

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

/**
 * Sign Business Card 
 **/

async function signBusinessCard (credential, keyPair) {

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

/**
 * Sign Presentation
 **/

async function signPresentation (presentation, keyPair, domain, challenge) {

	console.log('okay?');

	const { items } = await transmute.verifiable.presentation.create({
		presentation,
		format: ['vp'],
		domain,
		challenge,
		documentLoader,
		suite: new Ed25519Signature2018({
			key: await Ed25519VerificationKey2018.from(keyPair)
		})
	});

	console.log('oh god!!');

	const [ signedPresentation ] = items;
	return signedPresentation;

}

/**
 * Verify Presentation
 **/

async function verifyPresentation (signedPresentation) {
	
	const suite = new Ed25519Signature2018();
	const { domain, challenge } = signedPresentation.proof;

	const result = await transmute.verifiable.presentation.verify({
		presentation: signedPresentation,
		domain,
		challenge,
 		suite,
		checkStatus,
		format: ['vp'],
		documentLoader,
	});

	return result;

}

/*
 * signInvoice (uuid, json_str)
 */

async function signInvoice (uuid, json_str, keyPair) {
 
	const credential = JSON.parse(json_str);
	credential.id = uuid;
	const timestamp = moment().toJSON()
	credential.issuanceDate = timestamp.split('.').shift() + 'Z';
	credential.issuer.id = keyPair.controller;
	
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

