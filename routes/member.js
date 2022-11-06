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
const { updateProfile } = require('../modules/member/')

/*
 * Update Member Profile
 */
router.put('/', async (req, res) => {
    const { member_did } = req.session.data
    const memberDetails = {
        membername: req.body.membername || '',
        job_title: req.body.job_title || '',
        work_email: req.body.work_email || '',
    }

    const err = await updateProfile(
        member_did, // string, did:key:123
        memberDetails // object MemberDetails
    )
    if (err) {
        return res.status(400).end('invalid request')
    }

    // Step 3 : Update Current Reddis Session

    req.session.data.membername = req.body.membername
    req.session.data.job_title = req.body.job_title
    req.session.data.work_email = req.body.work_email

    res.end('okay')
})
