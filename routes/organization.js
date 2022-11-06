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

// Import Router

const express = require('express')
const router = express.Router()
module.exports = router

// Import Modules
const { updateOrganization } = require('../modules/organization/')

/*
 * Update Organization
 * PUT /api/organization/
 * BODY: Organization Details (type)
 */
router.put('/', async function (req, res) {
    const { organization_did } = req.session.data
    const organizationDetails = {
        name: req.body.organization_name || '',
        postcode: req.body.organization_postcode || '',
        address: req.body.organization_address || '',
        building: req.body.organization_building || '',
        department: req.body.organization_department || '',
        tax_id: req.body.organization_tax_id || '',
        country: req.body.addressCountry || '',
        region: req.body.addressRegion || '',
        city: req.body.addressCity || '',
    }

    const err = await updateOrganization(
        organization_did, // string, did:key:123
        organizationDetails // object OrganizationDetails
    )

    if (err) {
        return res.status(400).json('Error: Invalid request')
    }

    // Step 4 : Update Current Redis Session
    req.session.data.organization_name = req.body.organization_name
    req.session.data.organization_postcode = req.body.organization_postcode
    req.session.data.organization_address = req.body.organization_address
    req.session.data.organization_building = req.body.organization_building
    req.session.data.organization_department = req.body.organization_department
    req.session.data.organization_tax_id = req.body.organization_tax_id
    req.session.data.addressCountry = req.body.addressCountry
    req.session.data.addressRegion = req.body.addressRegion
    req.session.data.addressCity = req.body.addressCity

    res.json({
        err: 0,
        msg: 'okay',
    })
})
