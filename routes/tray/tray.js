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

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * getCount
 */
router.get('/getCountOfInvoice', async function (req, res) {
    const METHOD = '/getCountOfInvoice'
    const BUYER_STATUS = 'buyer_status'
    const SELLER_STATUS = 'seller_status'
    const SELLER_DRAFT_STATUS = 'seller_status_draft'
    const { archive, folder, role, type } = req.query

    if (type != 'invoice') {
        let msg = `ERROR:${METHOD}: Invalid argument`

        res.status(400).json({
            err: 11,
            msg: msg,
        })
    }

    if (role != 'buyer' && role != 'seller') {
        let msg = `ERROR:${METHOD}: Invalid argument`

        res.status(400).json({
            err: 12,
            msg: msg,
        })
    }

    if (archive != 0) {
        let msg = `ERROR:${METHOD}: Invalid argument`

        res.status(400).json({
            err: 13,
            msg: msg,
        })
    }

    if (
        folder != '[sent,returned,confirmed,paid]' &&
        folder != '[sent,returned,confirmed,paid,draft]'
    ) {
        let msg = `ERROR:${METHOD}: Invalid argument`

        res.status(400).json({
            err: 14,
            msg: msg,
        })
    }

    switch (role) {
        case 'buyer':
            req.body = [
                { type: 'invoice', role: 'buyer', folder: 'sent', archive: 0 },
                {
                    type: 'invoice',
                    role: 'buyer',
                    folder: 'returned',
                    archive: 0,
                },
                {
                    type: 'invoice',
                    role: 'buyer',
                    folder: 'confirmed',
                    archive: 0,
                },
                { type: 'invoice', role: 'buyer', folder: 'paid', archive: 0 },
            ]
            break
        case 'seller':
            req.body = [
                { type: 'invoice', role: 'seller', folder: 'sent', archive: 0 },
                {
                    type: 'invoice',
                    role: 'seller',
                    folder: 'returned',
                    archive: 0,
                },
                {
                    type: 'invoice',
                    role: 'seller',
                    folder: 'confirmed',
                    archive: 0,
                },
                { type: 'invoice', role: 'seller', folder: 'paid', archive: 0 },
            ]
            break
    }

    const table = ((role) => {
        switch (role) {
            case 'buyer':
                return BUYER_STATUS
            case 'seller':
                return SELLER_STATUS
        }
    })(role)

    const [err, counts] = await getCount(req, res, table)

    if (err) {
        res.json({
            err: err,
            msg: [0, 0, 0, 0],
        })
        return
    }

    if (folder == '[sent,returned,confirmed,paid]') {
        return res.json({
            err: 0,
            msg: counts,
        })
    }

    if (role == 'buyer') {
        res.json({
            err: 0,
            msg: [...counts, 0],
        })
        return
    }

    req.body = [
        {
            archive: 0,
            folder: 'draft',
            role: 'seller',
            type: 'invoice',
        },
    ]

    const draft_table = SELLER_DRAFT_STATUS

    const [err_draft, counts_draft] = await getCount(req, res, draft_table)

    if (err_draft) {
        res.json({
            err: err_draft,
            msg: [...counts, 0],
        })
        return
    }

    res.json({
        err: 0,
        msg: [...counts, counts_draft[0]],
    })
})

/*
 * 2.
 * getFolderOfInvoice
 */
router.get('/getFolderOfInvoice', async function (req, res) {
    const METHOD = '/getFolderOfInvoice'
    const BUYER_STATUS = 'buyer_status'
    const SELLER_STATUS = 'seller_status'

    const { archive, folder, role, type, offset, limit } = req.query

    if (type != 'invoice') {
        res.status(400).json({
            err: 1,
            msg: `ERROR:${METHOD}: Invalid argument`,
        })
    }

    if (role != 'buyer' && role != 'seller') {
        res.status(400).json({
            err: 2,
            msg: `ERROR:${METHOD}: Invalid argument`,
        })
    }

    if (archive != 0) {
        res.status(400).json({
            err: 3,
            msg: `ERROR:${METHOD}: Invalid argument`,
        })
    }

    switch (folder) {
        case 'sent':
        case 'returned':
        case 'confirmed':
        case 'paid':
            break
        default:
            res.status(400).json({
                err: 4,
                msg: `ERROR:${METHOD}: Invalid argument`,
            })
    }

    req.body = {
        archive: archive,
        folder: folder,
        role: role,
        type: type,
        offset: offset,
        limit: limit,
    }

    const [rows, err5] = await getFolder(
        req,
        res,
        ((role) => {
            switch (role) {
                case 'buyer':
                    return BUYER_STATUS
                case 'seller':
                    return SELLER_STATUS
            }
        })(role)
    )

    if (err5) {
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
 * 3.
 * getTotalInvoice
 */
router.get('/getTotalOfInvoice', async function (req, res) {
    const METHOD = '/getTotalOfInvoice'
    const BUYER_STATUS = 'buyer_status'
    const SELLER_STATUS = 'seller_status'

    const { archive, folder, role, type, offset, limit } = req.query

    if (nullCheckArgsOfInvoiceTray(req) == false) {
        res.status(400).json({
            err: 1,
            msg: `ERROR:${METHOD}: Invalid argument`,
        })
    }

    if (type != 'invoice') {
        res.status(400).json({
            err: 2,
            msg: `ERROR:${METHOD}: Invalid argument`,
        })
    }

    if (archive != 0) {
        res.status(400).json({
            err: 3,
            msg: `ERROR:${METHOD}: Invalid argument`,
        })
    }

    switch (folder) {
        case 'sent':
        case 'returned':
        case 'confirmed':
        case 'paid':
            break
        default:
            res.status(400).json({
                err: 4,
                msg: `ERROR:${METHOD}: Invalid argument`,
            })
    }

    req.body = {
        archive: archive,
        folder: folder,
        role: role,
        type: type,
        offset: offset,
        limit: limit,
    }

    const [total, err1] = await getTotal(
        req,
        res,
        ((role) => {
            switch (role) {
                case 'buyer':
                    return BUYER_STATUS
                case 'seller':
                    return SELLER_STATUS
            }
        })(role)
    )

    if (err1) {
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
