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

// Import Libraries

const uuidv1                    = require('uuid').v1
const bip39                     = require('bip39')
const { ethers }                = require('ethers')


// Import Modules
const {
    handleLogin,
    insertMnemonic,
    insertPrivateKeys,
    insertMember,
    getSessionData,
	insertFunds,
}                               = require('../../modules/session_sub.js');

const {
    createDidKey,
    createDidElem,
}                               = require('../../modules/didUtil.js');


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

/*
 * 4.
 * signup
 */

router.post('/signup', async function(req, res) {

	// 0.
	// First we generate a mnemonic for the organization

	console.log(req.body);

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
