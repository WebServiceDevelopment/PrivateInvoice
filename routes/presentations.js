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

// Import Libraries


// Import Modules

const {
    handleAvailable,
    handleSubmission
} = require('../modules/presentations')



// Global Variable for Storing Challenges

const challenges = {}

// Define

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * available
 */
router.post('/available', async (req, res) => {
    console.log('--- /api/presentations/available ---')
    console.log(req.body)

    // Create a challenge
    const { domain, challenge } = await handleAvailable();

    // Return the domain and challenge
    res.json({
        ...req.body,
        domain,
        challenge,
    })
})

/*
 * 2.
 * submissions
 */
router.post('/submissions', async (req, res) => {
    console.log('--- /api/presentations/submissions ---')
    const signedPresentation = req.body
    const { domain, challenge } = signedPresentation.proof



    res.status(400).end('no valid credential detected')
})
