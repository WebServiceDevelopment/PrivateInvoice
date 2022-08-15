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

// Module
const myModule = require('./module.js')
const bip39 = require('bip39')
const axios = require('axios')

// Fixtures

const fixedMnemonic = 'employ repeat obey there path car divert myth demise park cement teach';
const keypair1 = require('../__fixtures__/keypairs/keypair1.json');
const createOp = require('../__fixtures__/did_operations/create.json');

describe('did operations', () => {

	it('should create a Ed25519 keypair', async () => {
		const hdPath = "m/44'/60'/0'/0/0";
		const keyType = 'Ed25519';
		const keyPair = await myModule.createKeyPair(fixedMnemonic, hdPath, keyType);
		expect(keyPair).toEqual(keypair1)
	});

	it('should create a did:elem create operation', async() => {
		
		const keyType = 'Ed25519';
		const path0 = "m/44'/60'/0'/0/0";
		const path1 = "m/44'/60'/0'/0/1";
		const path2 = "m/44'/60'/0'/0/2";

		const publicKey = await myModule.createKeyPair(fixedMnemonic, path0, keyType);
		const recoveryKey = await myModule.createKeyPair(fixedMnemonic, path1, keyType);
		const updateKey = await myModule.createKeyPair(fixedMnemonic, path2, keyType);

		const createOperation = await myModule.createDidElement(publicKey, recoveryKey, updateKey);
		expect(createOperation).toEqual(createOp)

	});
	
	it.skip('should create a did:elem:ropsten did', async() => {
		
		const randomMnemonic = bip39.generateMnemonic();

		const keyType = 'Ed25519';
		const path0 = "m/44'/60'/0'/0/0";
		const path1 = "m/44'/60'/0'/0/1";
		const path2 = "m/44'/60'/0'/0/2";

		const publicKey = await myModule.createKeyPair(randomMnemonic, path0, keyType);
		const recoveryKey = await myModule.createKeyPair(randomMnemonic, path1, keyType);
		const updateKey = await myModule.createKeyPair(randomMnemonic, path2, keyType);

		const createOperation = await myModule.createDidElement(publicKey, recoveryKey, updateKey);
		
		const url = 'https://ropsten.element.transmute.industries/api/1.0/operations'

		let res;
		try {
			res = await axios.post(url, createOperation);
		} catch(err) {
			throw err;
		}

		expect(res.status).toBe(200)
		expect(res.data['@context']).toBe('https://w3id.org/did-resolution/v1')

	});

});

