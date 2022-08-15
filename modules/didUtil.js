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


// Import Libraries

const bip39					= require('bip39')
const { ethers }			= require('ethers')

const Web3					= require('web3')
const web3					= new Web3(process.env.GANACHE_ADDRESS)

const axios					= require('axios')
const wallet				= require('@sidetree/wallet')

// Database

// Import Modules

// Export Modules
module.exports	= {
	createDidKey			: _createDidKey,
	createDidElem			: _createDidElem,
}

async function _createDidKey ( mnemonic ) {

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

async function _createDidElem ( mnemonic ) {

	const keyType = 'Ed25519';
const publicKey = await wallet.toKeyPair  (mnemonic, keyType, "m/44'/60'/0'/0/0");
const recoveryKey = await wallet.toKeyPair(mnemonic, keyType, "m/44'/60'/0'/1/0");
const updateKey = await wallet.toKeyPair  (mnemonic, keyType, "m/44'/60'/0'/2/0");

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
