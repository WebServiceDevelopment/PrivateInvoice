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
const { handleIncomingInvoice } = require('./buyer_handle_invoice.js')

// Import Modules
const sub = require("../invoice_sub.js");

const {
    moveToTrash,
    moveToPaid,
    moveToArchive,
} = require('./move_to.js');

// Database
const db = require('../../database.js')

const handleStatusUpdate = async (
    credential // signed credential
) => {

    const [message] = credential.credentialSubject.items;

    let status, document_uuid, buyer_did, seller_did, hash;

    let msg, err;

    switch (message.statusCode) {
        case 'toConfirm':

            status = 'seller_status';
            document_uuid = message.recordNo;
            buyer_did = message.entryNo;
            [msg, err] = await sub.setConfirm(status, document_uuid, buyer_did);
            if (err) {
                _error(message.statusCode, msg, err);
                return res.status(400).end(msg);
            }
            return res.status(200).end('okay');

        case 'toPaid':

            status = 'seller_status';
            document_uuid = message.recordNo;
            buyer_did = message.entryNo;
            hash = message.validCodeReason;

            [msg, err] = await moveToPaid(document_uuid, buyer_did, hash);
            if (err) {
                _error(message.statusCode, msg, err);
                return res.status(400).end(msg);
            }
            return res.status(200).end('okay');

        case 'toReturn':

            status = 'seller_status';
            document_uuid = message.recordNo;
            buyer_did = message.entryNo;

            [msg, err] = await sub.setReturn(status, document_uuid, buyer_did);
            if (err) {
                _error(message.statusCode, msg, err);
                return res.status(400).end(msg);
            }

            console.log("toReturn accepted");

            return res.status(200).end('okay');

        case "toWithdraw":

            status = 'buyer_status';
            document_uuid = message.recordNo;
            seller_did = message.entryNo;

            [msg, err] = await sub.setWithdrawSeller(status, document_uuid, seller_did);
            if (err) {
                _error(message.statusCode, msg, err);
                return res.status(400).end(msg);
            }

            return res.status(200).end('okay');

        case "toTrash":
        case "toRecreate":

            status = 'buyer_status';
            document_uuid = message.recordNo;
            seller_did = message.entryNo;

            [msg, err] = await moveToTrash(status, document_uuid, seller_did);
            if (err) {
                _error(message.statusCode, msg, err);
                return res.status(400).end(msg);
            }

            console.log("moveToTrash accepted");

            return res.status(200).end('okay');

        case "toArchive":

            status = 'buyer_status';
            document_uuid = message.recordNo;
            seller_did = message.entryNo;

            [msg, err] = await moveToArchive(document_uuid);
            if (err) {
                _error(message.statusCode, msg, err);
                return res.status(400).end(msg);
            }

            console.log("moveToArchive accepted");

            return res.status(200).end('okay');

        default:
            return res.status(400).end('Invalid message')
    }


    function _error(statusCode, msg, err) {

        console.log(`${statusCode}, mag=${msg}, err=+${err}`);
    }

}

const handleAvailable = async () => {
    const domain = process.env.SERVER_DOMAIN
    const challenge = uuidv4()
    myCache.set(challenge, challenge, 100);
    return { domain, challenge }
}

const handleSubmission = async (
    domain, // string uri
    challenge, // string uuid
    signedPresentation // signed presentation obj
) => {

    // 1.
    // First we need to see if the challenge is still available
    // And delete it if it exists

    if (!myCache.take(challenge)) {
        // return res.status(400).end('Invalid challenge')
    }

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

    const credentialType = type.find(t => t !== 'VerifiableCredential')
    switch (credentialType) {
        case 'VerifiableBusinessCard':
            return await handleContactRequest(credential)
        case 'CommercialInvoiceCertificate':
            return handleIncomingInvoice(credential)
        case 'PGAStatusMessageCertificate':
            return handleStatusUpdate(credential)
    }

    throw new Error(`Unhandled credential type: ${credentialType}`)
}

module.exports = {
    handleAvailable,
    handleSubmission
}