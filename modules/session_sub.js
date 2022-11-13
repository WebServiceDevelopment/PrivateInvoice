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

//  Database
const db = require('../database.js')

// Exports

module.exports = {
    handleLogin: _handleLogin,
    getSessionData: _getSessionData,
}

/*
 * handleLogin
 */

async function _handleLogin(membername, password) {
    // 1.

    let sql
    sql = `
		SELECT
			member_did,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_did,
			created_on,
			wallet_address,
			avatar_uuid
		FROM
			members
		WHERE
			membername = ?
        OR
            work_email = ?
	`

    const args = [membername, membername]

    let member_data
    member_data = await db.selectOne(sql, args)

    if (!member_data) {
        return [null, { err: 100, msg: 'USERNAME NOT FOUND' }]
    }

    // 2.
    let match = false
    match = await db.compare(password, member_data.password_hash)

    if (!match) {
        return [null, { err: 100, msg: 'INCORRECT PASSWORD' }]
    }

    // 3.
    sql = `
		SELECT
			organization_name,
			organization_postcode,
			organization_address,
			organization_building,
			organization_department,
			organization_tax_id,
			addressCountry,
			addressRegion,
			addressCity
		FROM
			organizations
		WHERE
			organization_did = ?
	`

    let org
    try {
        org = await db.selectOne(sql, [member_data.organization_did])
    } catch (err) {
        return [null, { err: 100, msg: 'COULD NOT FIND ORG' }]
    }

    // 4.
    member_data.organization_name = org.organization_name
    member_data.organization_postcode = org.organization_postcode
    member_data.organization_address = org.organization_address
    member_data.organization_building = org.organization_building
    member_data.organization_department = org.organization_department
    member_data.organization_tax_id = org.organization_tax_id
    member_data.addressCountry = org.addressCountry
    member_data.addressRegion = org.addressRegion
    member_data.addressCity = org.addressCity

    // 5.
    delete member_data.password_hash
    delete member_data.avatar_uuid

    return [member_data, null]
}

/*
 * getSessionData
 */
async function _getSessionData(member_did) {
    let sql

    // 1.
    sql = `
		SELECT
			member_did,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_did,
			wallet_address
		FROM
			members
		WHERE
			member_did = ?
	`

    let member_data
    try {
        member_data = await db.selectOne(sql, [member_did])
    } catch (err) {
        return [null, err]
    }

    // 2.
    sql = `
		SELECT
			organization_name,
			organization_postcode,
			organization_address,
			organization_building,
			organization_department,
			organization_tax_id,
			addressCountry,
			addressRegion,
			addressCity
		FROM
			organizations
		WHERE
			organization_did = ?
	`
    let org
    try {
        org = await db.selectOne(sql, [member_data.organization_did])
    } catch (err) {
        return [null, err]
    }

    // 3.
    member_data.organization_name = org.organization_name
    member_data.organization_postcode = org.organization_postcode
    member_data.organization_address = org.organization_address
    member_data.organization_building = org.organization_building
    member_data.organization_department = org.organization_department
    member_data.organization_tax_id = org.organization_tax_id
    member_data.addressCountry = org.addressCountry
    member_data.addressRegion = org.addressRegion
    member_data.addressCity = org.addressCity

    // 4.
    delete member_data.password_hash

    // 5.
    return [member_data, null]
}
