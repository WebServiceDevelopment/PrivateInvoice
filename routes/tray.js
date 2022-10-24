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

// Import Modules
const { getCount, getFolder, getTotal } = require('../modules/tray')

router.get('/getCount', async (req, res) => {
    // Get member did from session data
    const { member_did } = req.session.data // did:key:123

    // Parse Query Parameters
    const { folder } = req.query // optional, enum
    const role = req.query.role === 'buyer' ? 'buyer' : 'seller' // optional
    const archive = parseInt(req.query.archive) || 0 // optional

    console.log('get folder for count')
    console.log(folder, role, archive)

    // Get counts from tray module
    const [err, counts] = await getCount(
        member_did, // did:key:123
        role, // enum 'buyer', 'seller'
        archive, // 0, 1
        folder // (optional) enum 'draft', 'sent', ...
    )

    // Handle errors
    if (err) {
        return res.status(400).end('Could not get Folder')
    }

    // Return number[]
    res.json(counts)
})

router.get('/getFolder', async (req, res) => {
    // Get member did from session data
    const { member_did } = req.session.data

    // Parse Query Parameters
    const { folder } = req.query // required, enum
    const limit = parseInt(req.query.limit) || 25 // optional, number
    const offset = parseInt(req.query.offset) || 0 // optional, number
    const role = req.query.role === 'buyer' ? 'buyer' : 'seller' // optional, enum
    const archive = parseInt(req.query.archive) || 0 // optional, bool

    // Get folder from tray module
    const [rows, err] = await getFolder(
        member_did, // did:key:123
        role, // enum 'buyer', 'seller'
        folder, // enum 'draft', 'sent', ...
        archive, // 0, 1
        limit, // number
        offset // number
    )

    // Handle errors
    if (err) {
        return res.status(400).end('Could not get Folder')
    }

    // Return InvoiceMetadata[]
    res.json(rows)
})

router.get('/getTotal', async (req, res) => {
    // Get member did from session data
    const { member_did } = req.session.data // did:key:123

    // Parse Query Parameters
    const { folder } = req.query // required
    const role = req.query.role === 'buyer' ? 'buyer' : 'seller' // optional
    const archive = parseInt(req.query.archive) || 0 // optional

    // Get total from tray module
    const [total, err] = await getTotal(
        member_did, // did:key:123
        role, // enum 'buyer', 'seller'
        folder, // enum 'draft', 'sent', ...
        archive // 0, 1
    )

    // Handle errors
    if (err) {
        return res.status(400).end('Could not process total')
    }

    // Return { total: number }
    res.json(total)
})
