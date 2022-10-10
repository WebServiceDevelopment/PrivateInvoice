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
    getCount,
    getFolder,
    getTotal,
    nullCheckArgsOfInvoiceTray,
} = require('../../modules/tray')

// Database

const SELLER_DRAFT_STATUS = 'seller_status_draft'

// ------------------------------- End Points -------------------------------

/*
 * getCountSeller
 */
router.get('/getCountOfDraft', async function (req, res) {
    req.body = [
        {
            archive: 0,
            folder: 'draft',
            role: 'seller',
            type: 'invoice',
        },
    ]

    const table = SELLER_DRAFT_STATUS

    const [err, counts] = await getCount(req, res, table)

    if (err) {
        res.json({
            err: 0,
            msg: counts,
        })
        return
    }

    res.json({
        err: err,
        msg: counts,
    })
})

/*
 * getFolderOfDraft
 */
router.get('/getFolderOfDraft', async function (req, res) {
    const METHOD = '/getFolderOfDraft'

    const offset = req.query.offset
    const limit = req.query.limit

    req.body = {
        archive: 0,
        folder: 'draft',
        role: 'seller',
        type: 'invoice',
        offset: offset,
        limit: limit,
    }

    const [rows, err] = await getFolder(req, res, SELLER_DRAFT_STATUS)

    if (err) {
        let msg = `ERROR:${METHOD}: Could not get Folder`
        res.status(400).json({
            err: 5,
            msg: msg,
        })
    }

    res.json({
        err: 0,
        msg: rows,
    })
})

/*
 * getTotalOfDraft
 */
router.get('/getTotalOfDraft', async function (req, res) {
    const METHOD = '/getTotalOfDraft'

    const type = req.query.type

    req.body = {
        archive: 0,
        folder: 'draft',
        role: 'seller',
        type: 'invoice',
    }

    if (type != 'invoice') {
        let msg = `ERROR:${METHOD}: Invalid argument`
        res.status(400).json({
            err: 1,
            msg: msg,
        })
    }

    const [total, err] = await getTotal(req, res, SELLER_DRAFT_STATUS)

    if (err) {
        let msg = `ERROR:${METHOD}: Could not get Total`
        res.status(400).json({
            err: 1,
            msg: { total: 0 },
        })
    }

    res.json({
        err: 0,
        msg: total,
    })
})
