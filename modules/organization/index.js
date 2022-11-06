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
    updateOrganization,
}
