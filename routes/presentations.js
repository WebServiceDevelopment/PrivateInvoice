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

const uuidv4					= require('uuid').v4;
const { verifyPresentation } = require('./sign_your_credentials.js');
const { handleContactRequest } = require('../modules/contacts_in.js');

// Global Variable for Storing Challenges

const challenges = {}

// Define 

router.post('/available', async (req, res) => {

	console.log('--- /api/presentations/available ---');
	console.log(req.body);

	// Create a challenge
	const domain = process.env.DOMAIN;
	const challenge = uuidv4();

	// Store it in Redis with a expiration timer of 10 seconds
	challenges[challenge] = 1;
	setTimeout( () => {
		delete challenges[challenge];
	}, 10 * 1000);

	// Return the domain and challenge
	res.json({
		...req.body,
		domain,
		challenge
	});

});

router.post('/submissions', async (req, res) => {

	console.log('--- /api/presentations/submissions ---');
	const signedPresentation = req.body;
	const { domain, challenge } = signedPresentation.proof;

	// 1.
	// First we need to see if the challenge is still available
	// And delete it if it exists

	if(!challenges[challenge]) {
		// return 400;
	}
	delete challenges[challenge];

	// 2.
	// Then we need to verify the presentation 
	// TODO: Figure out why this does not verify
	// https://github.com/WebServiceDevelopment/PrivateInvoice/issues/15

	const result = await verifyPresentation(signedPresentation);

	console.log(result);
	console.log(result.credentials);
	console.log(result.presentation);

	if(!result.verified) {
		// return 400;
	}

	// 3.
	// Assuming that works, then we need to figure out how to
	// handle the contents of credentials that have been sent
	// to us

	console.log('Signed Presentation');
	console.log(signedPresentation);

	const { verifiableCredential } = signedPresentation;

	console.log('Verifiable Credential List');
	console.log( verifiableCredential);

	const [ credential ] = verifiableCredential;

	console.log('Credential');
	console.log(credential);

	// First option is a contact request, which does not require the
	// controller to be in the list of contacts

	if(credential.type.indexOf('VerifiableBusinessCard') !== -1) {
		// Handle Contact Request
		const [ status, message ] = await handleContactRequest( credential );
		return res.status(status).end(message);
	}

	res.status(400).end('no valid credential detected');


});
