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

const {
    softDeleteSeller,
    softDeleteBuyer,
} = require('../modules/softDelete_sub.js')

const {
    getDocumentBuyer,
    getDocumentSeller,
    getArchiveDocumentBuyer,
    getArchiveDocumentSeller,
    getDraftDocument,
} = require('../modules/invoice_document_sub.js')

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
    console.log('aaa')
    const { action } = req.query
    const { document_uuid, gasLimit } = req.body
    const { member_did, wallet_address } = req.session.data

    console.log(action)

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

/*
 * 1.
 * softDeleteSeller
 */
router.post('/softDeleteSeller', async function (req, res) {
    const [result, err] = await softDeleteSeller(
        req.session.data.member_did,
        req.body.document_uuid
    )
    if (err) {
        res.status(400).json({
            err: 1,
            msg: 'Error : SQL execution failed',
        })
        return
    }

    if (result.affectedRows != 1) {
        res.status(400).json({
            err: 2,
            msg: 'Incorrect request',
        })
        return
    }

    return res.json({
        err: 0,
        msg: 'okay',
    })
})

/*
 * softDeleteBuyer
 */
router.post('/softDeleteBuyer', async function (req, res) {
    const [result, err] = await softDeleteBuyer(
        req.session.data.member_did,
        req.body.document_uuid
    )
    if (err) {
        res.status(400).json({
            err: 1,
            msg: 'Error : SQL execution failed',
        })
        return
    }

    if (result.affectedRows != 1) {
        res.status(400).json({
            err: 2,
            msg: 'Incorrect request',
        })
        return
    }

    return res.json({
        err: 0,
        msg: 'okay',
    })
})

/*
 * 1.
 * getDocumentBuyer
 */
router.get('/getDocumentBuyer', async function (req, res) {
    const METHOD = '/getDocumentBuyer'

    const [result, _] = await getDocumentBuyer(req.query.document_uuid)

    if (!result) {
        let msg = `ERROR:${METHOD}: Buyer DOCUMENT NOT FOUND FOR MEMBER`

        res.json({
            err: 1,
            msg: msg,
        })
        return
    }

    let doc = {}
    doc.document_json = JSON.parse(result.document_json)

    res.json({
        err: 0,
        msg: doc,
    })
})

/*
 * 2.
 * getDocumentSeller
 */
router.get('/getDocumentSeller', async function (req, res) {
    const METHOD = '/getDocumentSeller'

    const [result, _] = await getDocumentSeller(req.query.document_uuid)

    if (!result) {
        let msg = `ERROR:${METHOD}: seller DOCUMENT NOT FOUND FOR MEMBER`

        return res.json({
            err: 1,
            msg: msg,
        })
    }

    let doc = {}
    doc.document_json = JSON.parse(result.document_json)

    res.json({
        err: 0,
        msg: doc,
    })
})

/*
 * 3.
 * getArchiveDocumentBuyer
 */
router.get('/getArchiveDocumentBuyer', async function (req, res) {
    const METHOD = '/getArchiveDocumentBuyer'

    const [result, _] = await getArchiveDocumentBuyer(req.query.document_uuid)

    if (!result) {
        let msg = `ERROR:${METHOD}: Buyer DOCUMENT NOT FOUND FOR MEMBER`

        res.json({
            err: 1,
            msg: msg,
        })
        return
    }

    let doc = {}
    doc.document_json = JSON.parse(result.document_json)

    res.json({
        err: 0,
        msg: doc,
    })
})

/*
 * 4.
 * getArchiveDocumentSeller
 */
router.get('/getArchiveDocumentSeller', async function (req, res) {
    const METHOD = '/getArchiveDocumentSeller'

    const [result, _] = await getArchiveDocumentSeller(req.query.document_uuid)

    if (!result) {
        let msg = `ERROR:${METHOD}: seller DOCUMENT NOT FOUND FOR MEMBER`

        return res.json({
            err: 1,
            msg: msg,
        })
    }

    let doc = {}
    doc.document_json = JSON.parse(result.document_json)

    res.json({
        err: 0,
        msg: doc,
    })
})

/*
 * 5.
 * getDraftDocument
 */
router.get('/getDraftDocument', async function (req, res) {
    const METHOD = '/getDraftDocument'

    const [doc, _] = await getDraftDocument(
        req.session.data.member_did,
        req.query.document_uuid
    )

    if (!doc) {
        let msg = `ERROR:${METHOD}: draft DOCUMENT NOT FOUND FOR MEMBER`

        return res.json({
            err: 1,
            msg: msg,
        })
    }

    doc.document_body = JSON.parse(doc.document_body)
    doc.document_meta = JSON.parse(doc.document_meta)
    doc.document_totals = JSON.parse(doc.document_totals)
    doc.seller_details = JSON.parse(doc.seller_details)
    doc.buyer_details = JSON.parse(doc.buyer_details)
    doc.currency_options = JSON.parse(doc.currency_options)
    doc.document_json = JSON.parse(doc.document_json)

    res.json({
        err: 0,
        msg: doc,
    })
})
