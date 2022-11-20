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
const { handleLogin } = require('../modules/session/')

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * logout
 */
router.get('/logout', function (req, res) {
    req.session.destroy()
    res.clearCookie('connect.sid')
    res.redirect('/')
})

/*
 * 2.
 * check
 */
router.all('/check', async function (req, res) {
    const isLoggedIn = req.session && req.session.data ? true : false

    if (!isLoggedIn) {
        return res.status(400).json({
            message: 'No active session found for request',
        })
    }

    res.json(req.session.data)
})

/*
 * 3.
 * login
 */
router.post('/login', async function (req, res) {
    const { membername, password } = req.body

    const [data, err] = await handleLogin(membername, password)
    if (err) {
        return res.status(400).json(err)
    }

    req.session.data = data

    res.json({
        err: 0,
        msg: 'okay',
    })
})
