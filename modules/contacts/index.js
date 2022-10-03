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

const uuidv4 = require('uuid').v4

const {
    createBusinessCard,
    checkForExistingContact,
    insertNewContact,
    insertInviteTable,
    getContactTable,
} = require('./contacts_sub.js')

const { getContactListByMember_did } = require('./contacts_in.js')
const { verifyCredential, getPrivateKeys } = require('../verify_utils.js')
const { signBusinessCard } = require('../sign_your_credentials.js')
const { makePresentation } = require('../presentations_out.js')

const handleCreateBusinessCard = async (
    member_did, // string 'did:key:123'
    buyer, // 1 or 0
    seller, // 1 or 0
    uses, // number
    expire, // yyyy-mm-dd date
    linkRelationship // 'Seller', 'Buyer', or 'Partner' enum
) => {
    const invite_code = uuidv4()
    const args = [invite_code, member_did, buyer, seller, uses, expire]

    const [_, err3] = await insertInviteTable(args)
    if (err3) {
        return [null, err3]
    }

    // 1.3
    const [keyPair, err4] = await getPrivateKeys(member_did)
    if (err4) {
        return [null, err4]
    }

    // 1.4

    const [credential, err5] = await createBusinessCard(
        member_did,
        invite_code,
        keyPair,
        linkRelationship
    )

    if (err5) {
        return [null, err5]
    }

    const vbc = await signBusinessCard(credential, keyPair)
    return [vbc, null]
}

const handleAddContact = async (member_did, body) => {
    const METHOD = '/addContact'

    // 2.1
    // First we need to verifyCredential
    //

    const verified = await verifyCredential(body)
    if (!verified) {
        return {
            err: 1,
            msg: `Error:${METHOD}:Contact did not verify`,
        }
    }

    // 2.2
    // we need to check if the contact already exists
    //

    const local_member_did = member_did
    const remote_member_did = body.issuer.id
    // const remote_member_did = body.credentialSubject.id;

    const exists = await checkForExistingContact(
        local_member_did,
        remote_member_did
    )

    if (exists) {
        return {
            err: 2,
            msg: `Error:${METHOD}:Contact already exists`,
        }
    }

    // 2.3
    // Keypair
    //

    const [keyPair, err3] = await getPrivateKeys(member_did)
    if (err3) {
        return {
            err: 3,
            msg: `Error:${METHOD}:could not get private keys`,
        }
    }

    // 2.4
    // Extract linkRelationship from details

    const { relatedLink } = body
    const { linkRelationship } = relatedLink[0]

    switch (linkRelationship) {
        case 'Partner':
        case 'Buyer':
        case 'Seller':
            break
        default:
            return {
                err: 4,
                msg: `Error:${METHOD}: Incorrect inkRelationship`,
            }
    }

    // 2.5
    // Then we need to try and contact the remote host
    // We start by creating our own verifiable business card

    const invite_code = body.id.split(':').pop()
    const [credential, err5] = await createBusinessCard(
        member_did,
        invite_code,
        keyPair,
        linkRelationship
    )
    if (err5) {
        return {
            err: 5,
            msg: `Error:${METHOD}: could not create business card`,
        }
    }

    // 2.6
    //
    credential.relatedLink.push({
        type: 'LinkRole',
        target: remote_member_did,
        linkRelationship: 'Invite',
    })

    const vbc = await signBusinessCard(credential, keyPair)

    // 2.7
    // Then we need to send our verifiable business card to the other
    // party

    const [link] = body.relatedLink
    const url = link.target

    const [_response, err7] = await makePresentation(url, keyPair, vbc)
    if (err7) {
        return {
            err: 7,
            msg: `Error:${METHOD}: Presentation failed`,
        }
    }

    // 2.8
    // For debug purposes, if we add ourselves as a contact, then the
    // entry has already been made as a result of the presentation
    // on our server

    if (local_member_did === remote_member_did) {
        return {
            err: 0,
            msg: 'okay',
        }
    }

    // 2.9
    // If we get a successful response from the presentation,
    // then we need to add a contact on our own server

    const [_created, err9] = await insertNewContact(
        invite_code,
        local_member_did,
        body
    )
    if (err9) {
        return {
            err: 9,
            msg: `Error:${METHOD}: insertNewContact`,
        }
    }

    // 2.10
    // End Route

    return {
        err: 0,
        msg: 'okay',
    }
}

const handleGetContactTable = async (member_did) => {
    const contactTable = await getContactTable(member_did)
    return contactTable
}

const handleGetContactList = async (member_did, contactQuery) => {
    const METHOD = '/getContactList'

    let contactType, myPosition

    // 1.

    switch (contactQuery) {
        case 'sellers':
            contactType = 'seller_did'
            myPosition = 'buyer_did'
            break
        case 'buyers':
            contactType = 'remote_member_did'
            myPosition = 'local_member_did'
            break
        default:
            return {
                err: 1,
                msg: `ERROR:${METHOD}: Invalid contact type provided`,
            }
    }

    //2.
    const [rows, err2] = await getContactListByMember_did(
        contactType,
        myPosition,
        member_did
    )

    if (err2) {
        return {
            err: 2,
            msg: `ERROR:${METHOD}: Invalid request`,
        }
    }

    if (!rows.length) {
        return {
            err: 0,
            msg: [],
        }
    }

    // 3.
    //
    const contactList = rows.map((row) => {
        const org = JSON.parse(row.remote_organization)

        return {
            remote_origin: row.remote_origin,
            member_did: row.remote_member_did,
            membername: row.remote_membername,
            organization_name: org.name,
            organization_address: org.address,
            organization_building: org.building,
            organization_department: org.department,
            organization_tax_id: '',
            addressCountry: org.country,
            addressRegion: org.state,
            addressCity: org.city,
            wallet_address: '',
        }
    })

    // 4.

    return {
        err: 0,
        msg: contactList,
    }
}

module.exports = {
    handleCreateBusinessCard,
    handleAddContact,
    handleGetContactTable,
    handleGetContactList,
}
