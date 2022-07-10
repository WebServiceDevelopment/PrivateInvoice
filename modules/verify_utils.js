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

// Libraries

const axios                 = require('axios')
const moment                    = require('moment');

// Sign
const transmute                 = require('@transmute/vc.js');

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

// Database

const db = require('../database.js');


const documentLoader = async (iri) => {

    if(context[iri]) {
        return { document: context[iri] };
    }

    if(iri.indexOf('did:key') === 0) {
        const document = await resolve(iri);
        return { document };
    }

    if(iri.indexOf('did:elem:ganache') === 0) {
		const url = `http://192.168.1.126:4000/api/1.0/identifiers/${iri}`
		const res = await axios.get(url);
        return { document : res.data };
    }

    const message = `Unsupported iri: ${iri}`;
    console.error(message);
    throw new Error(message);

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


module.exports = {
	documentLoader,
	getPrivateKeys
}
