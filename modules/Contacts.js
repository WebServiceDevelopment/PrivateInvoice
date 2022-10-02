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

// Import Libraries

const uuidv1 = require('uuid').v1
const uuidv4 = require('uuid').v4
const moment = require('moment')

// Local Modules

const { verifyCredential, getPrivateKeys } = require('./verify_utils.js')
const { signBusinessCard } = require('./sign_your_credentials.js')
const { makePresentation } = require('./presentations_out.js')
const { getContactListByMember_did } = require('./contacts_in.js')

// Database

const db = require('../database.js')

/*
 * createBusinessCard
 */
const createBusinessCard = async (
    req,
    member_did,
    invite_code,
    keyPair,
    linkRelationship
) => {
    let sql, args, row, org

    console.log('sql1')

    // 1.
    sql = `
		SELECT
			member_did AS member_did,
			membername AS member_name,
			job_title AS member_job_title,
			work_email AS member_contact_email,
			organization_did AS organization_did,
			wallet_address
		FROM
			members
		WHERE
			member_did = ?
	`

    args = [member_did]

    try {
        row = await db.selectOne(sql, args)
    } catch (err) {
        return [null, err]
    }

    console.log('sql2')
    // 2.

    sql = `
		SELECT
			organization_name AS organization_name,
			organization_postcode AS organization_postcode,
			organization_address AS organization_address_line1,
			organization_building AS organization_address_line2,
			organization_department AS organization_department,
			organization_tax_id AS organization_tax_id,
			addressCountry AS organization_address_country,
			addressRegion AS organization_address_region,
			addressCity AS organization_address_city
		FROM
			organizations
		WHERE
			organization_did = ?
	`

    args = [row.organization_did]

    try {
        org = await db.selectOne(sql, args)
    } catch (err) {
        return [null, err]
    }

    console.log('timestamp')

    // 3.
    const timestamp = moment().toJSON()
    const issuanceDate = timestamp.split('.').shift() + 'Z'
    const { controller } = keyPair

    //4.

    //console.log('json')
    console.log('linkRelationship=' + linkRelationship)

    const credential = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3id.org/traceability/v1',
        ],
        type: ['VerifiableCredential', 'VerifiableBusinessCard'],
        id: `urn:uuid:${invite_code}`,
        name: 'Verifiable Business Card',
        relatedLink: [
            {
                type: 'LinkRole',
                target: `${process.env.SERVER_LOCATION}/api/presentations/available`,
                linkRelationship: linkRelationship,
            },
        ],
        issuanceDate: issuanceDate,
        issuer: {
            id: controller,
            type: 'Person',
            name: row.member_name,
            email: row.member_contact_email,
            jobTitle: row.member_job_title,
        },
        credentialSubject: {
            id: row.organization_did,
            type: 'Organization',
            name: org.organization_name,
            contactPoint: `${row.member_name}@${req.headers.host}`,
            department: org.organization_department,
            address: {
                type: 'PostalAddress',
                postalCode: org.organization_postcode,
                addressLocality: org.organization_address_city,
                addressRegion: org.organization_address_region,
                streetAddress: org.organization_address_line1,
                crossStreet: org.organization_address_line2,
                addressCountry: org.organization_address_country,
            },
            wallet_address: row.wallet_address,
            taxId: org.organization_tax_id,
        },
    }

    return [credential, null]
}

/*
 * checkForExistingContact
 */
const checkForExistingContact = async (local_uuid, remote_uuid) => {
    const sql = `
		SELECT 
			COUNT(*) AS num
		FROM 
			contacts 
		WHERE
			local_member_did = ?
		AND
			remote_member_did = ?
		AND
			removed_on IS NULL
	`

    const args = [local_uuid, remote_uuid]

    const { num } = await db.selectOne(sql, args)
    return num
}

/*
 * insertNewContact
 */
const insertNewContact = async (invite_code, local_member_did, credential) => {
    // Get local username

    const mySql = `
		SELECT
			membername AS local_member_name
		FROM
			members
		WHERE
			member_did = ?
	`

    const myArgs = [local_member_did]

    let row
    try {
        row = await db.selectOne(mySql, myArgs)
    } catch (err) {
        return [null, err]
    }

    const { local_member_name } = row

    // Get Information from Business Card

    const [link] = credential.relatedLink.filter((link) => {
        return link.linkRelationship !== 'Invite'
    })

    const relation = {
        local_to_remote: 0,
        remote_to_local: 0,
    }

    switch (link.linkRelationship) {
        case 'Partner':
            relation.local_to_remote = 1
            relation.remote_to_local = 1
            break
        case 'Buyer':
            relation.remote_to_local = 1
            break
        case 'Seller':
            relation.local_to_remote = 1
            break
    }

    const remote_origin = link.target.replace(
        '/api/presentations/available',
        ''
    )
    const remote_member_did = credential.issuer.id
    const remote_member_name = credential.issuer.name
    const remote_wallet_address = credential.credentialSubject.wallet_address

    const remote_organization = {
        name: credential.credentialSubject.name,
        postcode: credential.credentialSubject.address.postalCode,
        address: credential.credentialSubject.address.streetAddress,
        building: credential.credentialSubject.address.crossStreet,
        department: credential.credentialSubject.department,
        city: credential.credentialSubject.address.addressLocality,
        state: credential.credentialSubject.address.addressRegion,
        country: credential.credentialSubject.address.addressCountry,
        taxId: credential.credentialSubject.taxId,
    }

    const sql = `
		INSERT INTO contacts (
			_id,
			invite_code,
			local_member_did,
			local_membername,
			remote_origin,
			remote_member_did,
			remote_membername,
			remote_wallet_address,
			remote_organization,
			local_to_remote,
			remote_to_local
		) VALUES (
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?
		)
	`

    const _id = uuidv1()

    const args = [
        _id,
        invite_code,
        local_member_did,
        local_member_name,
        remote_origin,
        remote_member_did,
        remote_member_name,
        remote_wallet_address,
        JSON.stringify(remote_organization),
        relation.local_to_remote,
        relation.remote_to_local,
    ]

    try {
        await db.insert(sql, args)
    } catch (err) {
        return [null, err]
    }

    return [true, null]
}

/*
 * getContactTable
 */
const getContactTable = async (member_did) => {
    const sql = `
		SELECT
			remote_origin,
			remote_member_did,
			remote_membername,
			remote_organization,
			local_to_remote,
			remote_to_local,
			created_on
		FROM
			contacts
		WHERE
			local_member_did = ?
	`

    const args = [member_did]
    const rows = await db.selectAll(sql, args)
    const contactTable = rows.map((row) => {
        try {
            row.remote_organization = JSON.parse(row.remote_organization)
        } catch (e) {
            row.remote_organization = ''
        }
        return row
    })

    return contactTable
}

/*
 * insertInviteTable
 */
const insertInviteTable = async (args) => {
    const sql = `
		INSERT INTO invite (
			invite_code,
			local_member_did,
			rel_buyer,
			rel_seller,
			max_count,
			expires_on
		) VALUES (
			?,
			?,
			?,
			?,
			?,
			?
		)
	`

    try {
        await db.insert(sql, args)
    } catch (err) {
        return [null, err]
    }

    return [true, null]
}

const handleCreateBusinessCard = async (
    member_did,
    buyer,
    seller,
    uses,
    expire,
    linkRelationship
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
        req,
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

const handleAddContact = async (vbc) => {
    const METHOD = '/addContact'

    // 2.1
    // First we need to verifyCredential
    //

    const verified = await verifyCredential(body)
    if (!verified) {
        let msg = `Error:${METHOD}:Contact did not verify`

        res.status(400).json({
            err: 1,
            msg: msg,
        })
        return
    }

    // 2.2
    // we need to check if the contact already exists
    //

    const local_member_did = req.session.data.member_did
    const remote_member_did = body.issuer.id
    // const remote_member_did = body.credentialSubject.id;

    const exists = await checkForExistingContact(
        local_member_did,
        remote_member_did
    )
    if (exists) {
        let msg = `Error:${METHOD}:Contact already exists`

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    // 2.3
    // Keypair
    //

    const [keyPair, err3] = await getPrivateKeys(req.session.data.member_did)
    if (err3) {
        let msg = `Error:${METHOD}:could not get private keys`

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    // 2.4
    // Extract linkRelationship from details
    //

    let relatedLink = req.body.relatedLink
    let linkRelationship = relatedLink[0].linkRelationship

    switch (linkRelationship) {
        case 'Partner':
        case 'Buyer':
        case 'Seller':
            break
        default:
            let msg = `Error:${METHOD}: Incorrect inkRelationship`

            res.status(400).json({
                err: 4,
                msg: msg,
            })
            return
    }

    // 2.5
    // Then we need to try and contact the remote host
    // We start by creating our own verifiable business card

    //console.log('2.5');
    const invite_code = body.id.split(':').pop()
    const [credential, err5] = await createBusinessCard(
        req,
        req.session.data.member_did,
        invite_code,
        keyPair,
        linkRelationship
    )
    if (err5) {
        let msg = `Error:${METHOD}: could not create business card`

        res.status(400).json({
            err: 5,
            msg: msg,
        })
        return
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

    //console.log('2.7');
    const [link] = body.relatedLink
    const url = link.target

    const [response, err7] = await makePresentation(url, keyPair, vbc)
    if (err7) {
        let msg = `Error:${METHOD}: Presentation failed`

        res.status(400).json({
            err: 7,
            msg: msg,
        })
        return
    }

    // 2.8
    // For debug purposes, if we add ourselves as a contact, then the
    // entry has already been made as a result of the presentation
    // on our server

    if (local_member_did === remote_member_did) {
        res.json({
            err: 0,
            msg: 'okay',
        })
        return
    }

    // 2.9
    // If we get a successful response from the presentation,
    // then we need to add a contact on our own server

    const [created, err9] = await insertNewContact(
        invite_code,
        local_member_did,
        body
    )
    if (err9) {
        let msg = `Error:${METHOD}: insertNewContact`

        res.status(400).json({
            err: 9,
            msg: msg,
        })
        return
    }

    // 2.10
    // End Route

    res.json({
        err: 0,
        msg: 'okay',
    })
}

module.exports = {
    handleCreateBusinessCard,
    handleAddContact,
    getContactTable,
}
