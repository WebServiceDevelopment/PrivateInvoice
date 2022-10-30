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

// Libraries

const uuidv1 = require('uuid').v1

// Database

const db = require('../database.js')

/*
 * 2.
 * setCompanyLogo
 */

const setCompanyLogo = async (
    organization_did, // string, did:key:123
    dataUrl // string 'data:image/png;base64,...'
) => {
    const insertSql = `
		INSERT INTO organization_img (
			logo_uuid,
			img_data
		) VALUES (
			?,
			COMPRESS(?)
		)
	`
    const logo_uuid = uuidv1()
    const insertArgs = [logo_uuid, dataUrl]

    try {
        await db.insert(insertSql, insertArgs)
    } catch (err) {
        return [null, err]
    }

    const updateSql = `
		UPDATE
			organizations
		SET
			logo_uuid = ?
		WHERE
			organization_did = ?
	`

    const updateArgs = [logo_uuid, organization_did]
    try {
        await db.update(updateSql, updateArgs)
    } catch (err) {
        return [null, err]
    }

    return [logo_uuid, null]
}

/*
 * 4.
 * getCompanyLogo
 */
const getCompanyLogo = async (
    logo_uuid // string, uuid
) => {
    const sql = `
		SELECT
			UNCOMPRESS(img_data) AS dataUrl
		FROM
			organization_img
		WHERE
			logo_uuid = ?
		LIMIT 1
	`

    const args = [logo_uuid]

    let row

    try {
        row = await db.selectOne(sql, args)
    } catch (err) {
        return [null, err]
    }

    if (row && row.dataUrl) {
        row.dataUrl = row.dataUrl.toString()
    }

    return [row.dataUrl, null]
}

/*
 * 5. updateOrganization
 *
 */
async function updateOrganization(req) {
    let sql, args, row
    // step 1

    sql = `
        SELECT
            organization_did
        FROM
            members
        WHERE
            member_did = ?
    `

    args = [req.session.data.member_did]

    try {
        row = await db.selectOne(sql, args)
    } catch (err) {
        return [null, err]
    }

    // Step 2 : Update members table

    sql = `
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

    args = [
        req.body.organization_name,
        req.body.organization_postcode,
        req.body.organization_address,
        req.body.organization_building,
        req.body.organization_department,
        req.body.organization_tax_id,
        req.body.addressCountry,
        req.body.addressRegion,
        req.body.addressCity,
        row.organization_did,
    ]

    // Step 3 : Write Changes to log database

    try {
        await db.update(sql, args)
    } catch (err) {
        return [null, err]
    }

    return [true, null]
}

// Exports

module.exports = {
    setCompanyLogo,
    getCompanyLogo,
    updateOrganization,
}
