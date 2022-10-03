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

const {
    handleCreateBusinessCard,
    handleAddContact,
    handleGetContactTable,
    handleGetContactList,
} = require('../modules/contacts')

//----------------------------- define endpoints -----------------------------

router.post('/createBusunessCard', async (req, res) => {
    const { buyer, seller, uses, expire, linkRelationship } = req.body
    const { member_did } = req.session.data
    const [vbc, err] = await handleCreateBusinessCard(
        member_did,
        buyer, // 1 or 0
        seller, // 1 or 0
        uses, // number of times business card can be used
        expire, // date expires in yyyy-mm-dd format
        linkRelationship // 'Seller', 'Buyer', or 'Partner'
    )

    if (err) {
        res.status(400).json(err)
    }

    res.json(vbc)
})

router.post('/addContact', async (req, res) => {
    const { body } = req // VBC in body
    const { member_did } = req.session.data
    const response = await handleAddContact(member_did, body)
    const status = response.err === 0 ? 200 : 400
    res.status(status).json(response) // { err, msg }
})

router.get('/getContactTable', async (req, res) => {
    const { member_did } = req.session.data
    const contactTable = await handleGetContactTable(member_did)
    res.json(contactTable) // contacts[]
})

router.get('/getContactList', async (req, res) => {
    const { contactType } = req.query // 'sellers', or 'buyers'
    const { member_did } = req.session.data
    const response = await handleGetContactList(member_did, contactType)
    const status = response.err === 0 ? 200 : 400
    res.status(status).json(response) // { err, contacts[] }
})
