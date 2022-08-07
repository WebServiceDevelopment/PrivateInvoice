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

// Import Router

const express                   = require('express')
const router                    = express.Router()
module.exports                  = router

// Import Libraries

const uuidv4                    = require('uuid').v4

// Import Modules

const { verifyPresentation }    = require('../modules/sign_your_credentials.js')
const { handleContactRequest }  = require('../modules/contacts_in.js')
const { handleIncomingInvoice } = require('../modules/invoices_in.js')
const { handleStatusUpdate }    = require('../modules/update_status.js')

// Global Variable for Storing Challenges

const challenges                = {}

// Define

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * available
 */
router.post('/available', async (req, res) => {
    console.log('--- /api/presentations/available ---')
    console.log(req.body)

    // Create a challenge
    const domain = process.env.SERVER_LOCATION.split("://")[1];
    const challenge = uuidv4()

	console.log("domain ="+domain);

    // Store it in Redis with a expiration timer of 10 seconds
    challenges[challenge] = 1
    setTimeout(() => {
        delete challenges[challenge]
    }, 10 * 1000)

    // Return the domain and challenge
    res.json({
        ...req.body,
        domain,
        challenge,
    })
})

/*
 * 2.
 * submissions
 */
router.post('/submissions', async (req, res) => {

    console.log('--- /api/presentations/submissions ---')
    const signedPresentation = req.body
    const { domain, challenge } = signedPresentation.proof

    // 1.
    // First we need to see if the challenge is still available
    // And delete it if it exists

    if (!challenges[challenge]) {
        // return 400;
    }
    delete challenges[challenge]

    // 2.
    // Then we need to verify the presentation
    
	const result = await verifyPresentation(signedPresentation)
    if (!result.verified) {
        // return 400;
    }

    // 3.
    // Assuming that works, then we need to figure out how to
    // handle the contents of credentials that have been sent
    // to us

    const { verifiableCredential } = signedPresentation
    const [credential] = verifiableCredential

    // First option is a contact request, which does not require the
    // controller to be in the list of contacts

    if (credential.type.indexOf('VerifiableBusinessCard') !== -1) {
        // Handle Contact Request
        const [status, message] = await handleContactRequest(credential)
        return res.status(status).end(message)
    } else if (credential.type.indexOf('CommercialInvoiceCertificate') !== -1) {
        // Handle Commercial Invoice
        console.log('handle commercial invoice!!!!')
        return await handleIncomingInvoice(credential, res)
        // return res.status(400).end("Stahhp it");
    } else if (credential.type.indexOf('PGAStatusMessageCertificate') !== -1) {
        // Handle Commercial Invoice
        console.log('handle status update!!!!')
        return await handleStatusUpdate(credential, res)
    }

    res.status(400).end('no valid credential detected')
})
