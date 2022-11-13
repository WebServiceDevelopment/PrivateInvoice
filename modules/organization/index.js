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

// Database

const db = require('../../database.js')

// Libraries

const uuidv4 = require('uuid').v4
const { generateMnemonic } = require('bip39')
const { ethers } = require('ethers')

// Modules

const { insertMember, insertPrivateKeys } = require('../member')
const { createDidKey, insertFunds } = require('../wallet')

const storePhrase = async (
    uuid, // string
    mnemonic // string
) => {
    const sql = `
		INSERT INTO mnemonics (
			organization_did,
			recovery_phrase
		) VALUES (
			?,
			?
		)
	`

    const args = [uuid, mnemonic]

    try {
        await db.insert(sql, args)
    } catch (err) {
        throw err
    }
}

const insertOrganization = async (
    organization_uuid, // string
    organizationDetails, // object
    organizationAddress // object
) => {
    const sql = `
		INSERT INTO organizations (
			organization_did,
			organization_name,
			organization_department,
			organization_tax_id,
			addressCountry,
			addressRegion,
			organization_postcode,
			addressCity,
			organization_address,
			organization_building
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
			?
		)
	`

    const args = [
        organization_uuid,
        organizationDetails.name,
        organizationDetails.department,
        organizationDetails.tax_id,
        organizationAddress.country,
        organizationAddress.region,
        organizationAddress.postcode,
        organizationAddress.city,
        organizationAddress.line1,
        organizationAddress.line2,
    ]

    try {
        await db.insert(sql, args)
    } catch (err) {
        throw err
    }
}

/*
 * Create Organization
 *
 */

const createOrganization = async (
    organizationDetails, // object OrganizationDetails
    organizationAddress, // object OrganizationAddress
    memberDetails // object MemberDetails
) => {
    // Generate Organization GUID and Mnemonic
    const organizationUuid = `uri:uuid:${uuidv4()}`
    const organizationMnemonic = generateMnemonic()

    // Store organization uuid and phrase
    await storePhrase(
        organizationUuid, // string
        organizationMnemonic // string
    )

    // Store organization uuid and details
    await insertOrganization(
        organizationUuid, //string
        organizationDetails, // object OrganizationDetails
        organizationAddress // object OrganizationAddress
    )

    // Generate Member Did
    const memberDid = await createDidKey(organizationMnemonic, 0)
    const wallet = ethers.Wallet.fromMnemonic(mnemonic)
    const { address } = wallet

    // Debug with ganache
    await insertFunds(address)
}

/*
 * UpdateOrganization
 *
 */

const updateOrganization = async (
    organization_did, // string, did:key:123
    organizationDetails // object OrganizationDetails
) => {
    const sql = `
		UPDATE
			organizations
		SET
			organization_name = ?,
			organization_postcode = ?,
			organization_address = ?,
			organization_building = ?,
			organization_department = ?,
			organization_tax_id = ?,
			addressCountry = ?,
			addressRegion = ?,
			addressCity = ?
		WHERE
			organization_did = ?
	`

    const args = [
        organizationDetails.name,
        organizationDetails.postcode,
        organizationDetails.address,
        organizationDetails.building,
        organizationDetails.department,
        organizationDetails.tax_id,
        organizationDetails.country,
        organizationDetails.region,
        organizationDetails.city,
        organization_did,
    ]

    // Step 3 : Write Changes to log database

    try {
        await db.update(sql, args)
    } catch (err) {
        return err
    }
}

// Exports

module.exports = {
    createOrganization,
    updateOrganization,
}
