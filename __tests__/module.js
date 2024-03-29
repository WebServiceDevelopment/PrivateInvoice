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

const sidetreeWallet = require('@sidetree/wallet')

module.exports = {
	createKeyPair : _createKeyPair,
	createDidElement : _createDidElement
}

async function _createKeyPair (mnemonic, hdpath, keyType) {

	const keyPair = await sidetreeWallet.toKeyPair(mnemonic, keyType, hdpath)
	return keyPair

}

async function _createDidElement(publicKey, recoveryKey, updateKey) {

	const createOperation = await sidetreeWallet.operations.create({
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

	return createOperation;

}
