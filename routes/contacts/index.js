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
    getContactTable,
} = require('../../modules/Contacts.js')

//----------------------------- define endpoints -----------------------------

router.post('/createBusunessCard', async function (req, res) {
    const { buyer, seller, uses, expire, linkRelationship } = req.body
    const { member_did } = req.session.data
    const [vbc, err] = await handleCreateBusinessCard(
        member_did,
        buyer,
        seller,
        uses,
        expire,
        linkRelationship
    )

    if (err) {
        res.status(500).json(err)
    }

    res.json(vbc)
})

/*
 * 2.
 * addContact
 */

router.post('/addContact', async function (req, res) {
    const vbc = req.body
    const { member_did } = req.session.data
    const respCode = await handleAddContact(member_did, vbc)
})

/*
 * 3.
 * getContactTable
 */
router.get('/getContactTable', async function (req, res) {
    const { member_did } = req.session.data
    const contactTable = await getContactTable(member_did)

    console.log('--- Getting contacts ---')
    console.log(contactTable)

    res.json(contactTable)
})

/*
 * 4.
 * getContactList
 */

router.get('/getContactList', async function (req, res) {
    const METHOD = '/getContactList'

    let contactType, myPosition

    // First we get a list of all of the contact uuid's
    // in the direction that we request

    console.log('req.query.contactType=' + req.query.contactType)

    // 1.
    //
    switch (req.query.contactType) {
        case 'sellers':
            contactType = 'seller_did'
            myPosition = 'buyer_did'

            break
        case 'buyers':
            contactType = 'remote_member_did'
            myPosition = 'local_member_did'

            break
        default:
            let msg = `ERROR:${METHOD}: Invalid contact type provided`

            res.status(400).json({
                err: 1,
                msg: msg,
            })
            return
    }

    //2.
    //
    const [rows, err2] = await getContactListByMember_did(
        contactType,
        myPosition,
        req.session.data.member_did
    )

    if (err2) {
        let msg = `ERROR:${METHOD}: Invalid request`

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    if (!rows.length) {
        res.json({
            err: 0,
            msg: [],
        })
        return
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
    //
    res.json({
        err: 0,
        msg: contactList,
    })
})
