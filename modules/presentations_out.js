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

'use strict'

// NPM Libraries

const axios = require('axios')
const transmute = require('@transmute/vc.js')

const {
    Ed25519Signature2018,
    Ed25519VerificationKey2018,
} = require('@transmute/ed25519-signature-2018')

const context = {
    'https://www.w3.org/2018/credentials/v1': require('../context/credentials_v1.json'),
    'https://w3id.org/traceability/v1': require('../context/traceability_v1.json'),
}

const { resolve } = require('@transmute/did-key.js')

// Local Libraries

const db = require('../database.js')

/**
 * Helper Functions
 **/

const checkStatus = () => {
    return true
}

const documentLoader = async (iri) => {
    if (context[iri]) {
        return { document: context[iri] }
    }

    if (iri.indexOf('did:key') === 0) {
        const document = await resolve(iri)
        return { document }
    }

    const message = `Unsupported iri: ${iri}`
    console.error(message)
    throw new Error(message)
}

/**
 * Module Functions
 **/

const getPrivateKeys = async (member_did) => {
    const sql = `
		SELECT
			public_key
		FROM
			privatekeys
		WHERE
			member_did = ?
	`

    const args = [member_did]

    let row
    try {
        row = await db.selectOne(sql, args)
    } catch (err) {
        return [null, err]
    }

    const keyPair = JSON.parse(row.public_key)
    return [keyPair, null]
}

const initPresentation = async (url) => {
    const method = 'post'

    const data = {
        query: [
            {
                type: 'QueryByExample',
                credentialQuery: [
                    {
                        type: ['VerifiableCredential'],
                        reason: 'We want to present credentials.',
                    },
                ],
            },
        ],
    }

    const params = { method, url, data }

    let response
    try {
        response = await axios(params)
    } catch (err) {
        const error = {
            status: -1,
            data: 'unknown error',
        }

        if (err.response) {
            error.status = err.response.status
            error.data = err.response.data
        } else if (err.code === 'ECONNRESET') {
            error.status = 500
            error.data = 'ECONNRESET'
        } else {
            error.status = 400
            error.data = 'Undefined Error'
        }

        return [null, error]
    }

    return [response.data, null]
}

const sendPresentation = async (url, keyPair, domain, challenge, vc) => {
    const presentation = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: `urn:uuid:${challenge}`,
        type: ['VerifiablePresentation'],
        verifiableCredential: [vc],
        holder: keyPair.controller,
    }

    url = url.replace('available', 'submissions')
    const method = 'post'

    const data = await signPresentation(
        presentation,
        keyPair,
        domain,
        challenge
    )

    const params = { method, url, data }

    let response
    try {
        response = await axios(params)
    } catch (err) {
        const error = {
            status: -1,
            data: 'unknown error',
        }

        if (err.response) {
            error.status = err.response.status
            error.data = err.response.data
        } else if (err.code === 'ECONNRESET') {
            error.status = 500
            error.data = 'ECONNRESET'
        } else {
            error.status = 400
            error.data = 'Undefined Error'
        }

        return [null, error]
    }

    return [response.data, null]
}

const signPresentation = async (presentation, keyPair, domain, challenge) => {
    console.log('okay?')

    const { items } = await transmute.verifiable.presentation.create({
        presentation,
        format: ['vp'],
        domain,
        challenge,
        documentLoader,
        suite: new Ed25519Signature2018({
            key: await Ed25519VerificationKey2018.from(keyPair),
        }),
    })

    console.log('oh god!!')

    const [signedPresentation] = items
    return signedPresentation
}

const makePresentation = async (url, keyPair, vc) => {
    console.log('making the presentation!!!')

    // 1 Init Presentation

    console.log(url)

    const [available, _err1] = await initPresentation(url)
    if (_err1) {
        return [null, 'could not init']
    }

    const { domain, challenge } = available
    console.log(domain, challenge)

    // 2 Send Presentation

    const [send, _err2] = await sendPresentation(
        url,
        keyPair,
        domain,
        challenge,
        vc
    )
    if (_err2) {
        console.log(_err2)
        return [null, 'could not submit']
    }

    // Return Success

    return [send, null]
}

module.exports = {
    getPrivateKeys: getPrivateKeys,
    initPresentation: initPresentation,
    sendPresentation: sendPresentation,
    signPresentation: signPresentation,
    makePresentation: makePresentation,
}
