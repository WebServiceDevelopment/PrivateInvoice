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

 Author: Ogawa Kousei (collins@wsd.co.jp)
    
**/

'use strict'

const NodeCache = require("node-cache");
const myCache = new NodeCache();

const uuidv4 = require('uuid').v4

const { verifyPresentation } = require('../sign_your_credentials.js')
const {
    handleContactRequest,
} = require('../contacts/contacts_in.js')
const { handleIncomingInvoice } = require('../invoices_in.js')
const { handleStatusUpdate } = require('../update_status.js')

const handleAvailable = async () => {

    const domain = process.env.SERVER_DOMAIN
    const challenge = uuidv4()

    return { domain, challenge }
}

const handleSubmission = async () => {

    // 1.
    // First we need to see if the challenge is still available
    // And delete it if it exists

    if (!challenges[challenge]) {
        // return res.status(400).end('Invalid challenge')
    }
    delete challenges[challenge]

    // 2.
    // Then we need to verify the presentation

    const result = await verifyPresentation(signedPresentation)
    if (!result.verified) {
        // return res.status(400).end('Invalid challenge')
    }

    // 3.
    // Assuming that works, then we need to figure out how to
    // handle the contents of credentials that have been sent
    // to us

    const { verifiableCredential } = signedPresentation
    const [credential] = verifiableCredential
    const { type } = credential

    // First option is a contact request, which does not require the
    // controller to be in the list of contacts

    if (type.find('VerifiableBusinessCard')) {
        // Handle Contact Request
        const [status, message] = await handleContactRequest(credential)
        return res.status(status).end(message)
    } else if (type.find('CommercialInvoiceCertificate')) {
        // Handle Commercial Invoice
        console.log('handle commercial invoice!!!!')
        return await handleIncomingInvoice(credential, res)
        // return res.status(400).end("Stahhp it");
    } else if (type.indexOf('PGAStatusMessageCertificate')) {
        // Handle Commercial Invoice
        console.log('handle status update!!!!')
        return await handleStatusUpdate(credential, res)
    }

}

module.exports = {
    handleAvailable,
    handleSubmission
}