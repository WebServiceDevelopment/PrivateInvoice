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

const express               = require('express');
const router                = express.Router();
module.exports              = router;

// Import Libraries

const uuidv4                = require('uuid').v4;


// Import Modules

const { signBusinessCard }  = require('../modules/sign_your_credentials.js')
const { makePresentation }  = require('../modules/presentations_out.js')

const {
        verifyCredential,
        getPrivateKeys,
}                           = require('../modules/verify_utils.js')

const {
    createBusinessCard,
    checkForExistingContact,
    insertNewContact,
    getContacts,
    insertInviteTable,
}                           = require('../modules/contacts_sub.js')

// Database


// Constants


//----------------------------- define endpoints -----------------------------

/*
 * 1.
 * generate
 */

router.post('/createBusunessCard', async function(req, res) {

	const METHOD = '/createBusunessCard';

	const { body } = req;

// 1.1
	const invite_code = uuidv4();

// 1.2

	const args = [
		invite_code,
		req.session.data.member_did,
		body.buyer,
		body.seller,
		body.uses,
		body.expire
	];

	const [bool3 , err3] = await insertInviteTable(args);
	if(err3) {

		let  msg =  `Error:${METHOD}:could not insert INVITE_TABLE.`;

		res.json({
			err: 3,
			msg: msg
		});
		return;
	}

	console.log(req.session.data.member_did);

// 1.3
	console.log('--- aaa ---');
	const [ keyPair, err4 ] = await getPrivateKeys(req.session.data.member_did);
	if(err4) {

		let msg = `Error:${METHOD}:could not get private keys`;

		res.json({
			err: 4,
			msg: msg
		});
		return;
	}

// 1.4
	console.log('--- bbb ---');

	const [ credential, err5 ] = await createBusinessCard(req, req.session.data.member_did, invite_code, keyPair, body.linkRelationship);
	if(err4) {

		let msg = `Error:${METHOD}:could not create business card`;

		res.json({
			err: 4,
			msg: msg
		});
		return;
	}
	
// 1.5
	console.log('--- ccc ---');
	const vbc = await signBusinessCard(credential, keyPair);
	
// 1.6
	console.log('--- eee ---');
	res.json(vbc);


});

/*
 * 2.
 * addContact
 */

router.post('/addContact', async function(req, res) {

	const METHOD = '/addContact'

	const { body } = req;

	console.log('ADDING CONTACT');
	console.log(body);

	// 2.1 
	// First we need to verifyCredential
    // 

	const verified = await verifyCredential(body);
	if(!verified) {

		let msg = `Error:${METHOD}:Contact did not verify`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}


	// 2.2 
	// we need to check if the contact already exists
	//

	const local_member_did = req.session.data.member_did;
	const remote_member_did = body.issuer.id;
	// const remote_member_did = body.credentialSubject.id;

	const exists = await checkForExistingContact(local_member_did, remote_member_did)
	if(exists) {

		let msg = `Error:${METHOD}:Contact already exists`;

		res.status(400)
			.json({
				err: 2,
				msg: msg
			});
		return;
	}


    // 2.3 
	// Keypair
	//

	const [ keyPair, err3 ] = await getPrivateKeys(req.session.data.member_did);
	if(err3) {

		let msg = `Error:${METHOD}:could not get private keys`;

		res.status(400)
			.json({
				err: 3,
				msg: msg
			});
		return;
	}

    // 2.4 
    // Extract linkRelationship from details
    //
    
	let relatedLink = req.body.relatedLink;
	let linkRelationship = relatedLink[0].linkRelationship;

	switch(linkRelationship) {
	case "Partner":
	case "Buyer":
	case "Seller":
		break;
	default:

		let msg = `Error:${METHOD}: Incorrect inkRelationship`;

		res.status(400)
			.json({
				err: 4,
				msg: msg
			});
		return;
	}


	// 2.5 
	// Then we need to try and contact the remote host
	// We start by creating our own verifiable business card

	//console.log('2.5');
	const invite_code = body.id.split(':').pop();

	const [ credential, err5 ] = await createBusinessCard(req, req.session.data.member_did, invite_code, keyPair, linkRelationship);
	if(err5) {

		let msg = `Error:${METHOD}: could not create business card`;

		res.status(400)
			.json({
				err: 5,
				msg: msg
			});
		return;
	}


	// 2.6
	//
	credential.relatedLink.push({
		type: 'LinkRole',
		target: remote_member_did,
		linkRelationship: 'Invite'
	});

	const vbc = await signBusinessCard(credential, keyPair);

	
	// 2.7
	// Then we need to send our verifiable business card to the other
	// party
	
	//console.log('2.7');
	const [ link ] = body.relatedLink;
	const url = link.target;

	const [ response, err7 ] = await makePresentation(url, keyPair, vbc);
	if(err7) {

		let msg = `Error:${METHOD}: Presentation failed`;

		res.status(400)
		.json({
				err: 7,
				msg: msg
			});
		return;
	}

	
	// 2.8
	// For debug purposes, if we add ourselves as a contact, then the
	// entry has already been made as a result of the presentation
	// on our server
	
	if( local_member_did === remote_member_did) {
		res.json({
			err: 0,
			msg : 'okay'
		});
		return;
	}


	// 2.9
	// If we get a successful response from the presentation,
	// then we need to add a contact on our own server

	const [ created, err9 ] = await insertNewContact(invite_code, local_member_did, body);
	if(err9) {

		let msg = `Error:${METHOD}: insertNewContact`;

		res.status(400)
			.json({
				err: 9,
				msg: msg
			});
		return;
	}

	
	// 2.10
	// End Route

	res.json({
		err: 0,
		msg : 'okay'
	});

});

/*
 * 3.
 * getContactList
 */
router.get('/getContactList', async function(req, res) {

	const { member_did } = req.session.data;
	const contacts = await getContacts(member_did);

	console.log('--- Getting contacts ---');
	console.log(contacts);

	res.json(contacts);

})
