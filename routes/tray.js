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

"use strict";

// Inport
const sub					= require("../modules/tray_sub.js");

// Import Router

const express				= require('express');
const router				= express.Router();
module.exports				= router;

// Database

const BUYER_STATUS			= "buyer_status";
const SELLER_STATUS			= "seller_status";

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * getCountBuyer
 */
router.post('/getCountBuyer', function(req, res) {

	sub.getCount(req, res, BUYER_STATUS);

});

/*
 * 2.
 * getCountSeller
 */
router.post('/getCountSeller', function(req, res) {

	sub.getCount(req, res, SELLER_STATUS);

});

/*
 * 3.
 * getFolderBuyer
 */
router.post('/getFolderBuyer', function(req, res) {

	sub.getFolder(req, res, BUYER_STATUS);

});

/*
 * 4.
 * getFolderSeller
 */
router.post('/getFolderSeller', function(req, res) {

	sub.getFolder(req, res, SELLER_STATUS);

});

/*
 * 5.
 * getTotalBuyer
 */
router.post('/getTotalBuyer', async function(req, res) {

	sub.getTotal(req, res, BUYER_STATUS);

});

/*
 * 6.
 * getTotalSeller
 */
router.post('/getTotalSeller', async function(req, res) {

	sub.getTotal(req, res, SELLER_STATUS);

});

