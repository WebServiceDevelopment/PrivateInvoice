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
    sendInvoice
} = require('../modules/invoice')

router.put('/status', async (req, res) => {

    const { action } = req.query
    const { document_uuid } = req.body
    const { member_did } = req.session.data

    switch (action) {
        case 'send':
            sendInvoice(member_did, document_uuid)
            break;
        default:
            return res.status(400).end('invalid status provided');
    }

    res.json({
        err: 0,
        msg: document_uuid,
    })
});