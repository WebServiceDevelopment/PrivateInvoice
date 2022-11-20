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

const express = require('express')
const router = express.Router()
module.exports = router

const { createDraft, updateDraft, updateStatus } = require('../modules/invoice')

router.post('/', async (req, res) => {
    const { member_did } = req.session.data
    const member_data = {
        organization_name: req.session.data.organization_name,
        organization_postcode: req.session.data.organization_postcode,
        organization_address: req.session.data.organization_address,
        organization_building: req.session.data.organization_building,
        organization_department: req.session.data.organization_department,
        organization_tax_id: req.session.data.organization_tax_id,
        addressCountry: req.session.data.addressCountry,
        addressRegion: req.session.data.addressRegion,
        addressCity: req.session.data.addressCity,
    }

    const document_uuid = await createDraft(member_did, member_data)
    res.json({
        err: 0,
        msg: document_uuid,
    })
})

router.put('/', async (req, res) => {
    const { member_did } = req.session.data
    const updatedDoc = req.body
    await updateDraft(member_did, updatedDoc)
    res.json({
        err: 0,
        msg: updatedDoc.document_uuid,
    })
})

router.patch('/', async (req, res) => {
    const { action } = req.query
    const { document_uuid, gasLimit } = req.body
    const { member_did, wallet_address } = req.session.data

    await updateStatus(
        action, // enum send, confirm, unconfirm
        member_did, // string did:key:123
        document_uuid, // string uuid
        wallet_address, // string
        gasLimit // number | null
    )

    res.json({
        err: 0,
        msg: document_uuid,
    })
})
