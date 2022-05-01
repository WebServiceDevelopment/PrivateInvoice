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
const sub           = require("./tray_sub.js");

// Import Router

const express = require('express');
const router = express.Router();
module.exports = router;

// Database

const CLIENT_ARCHIVE_STATUS = "client_status_archive";
const SUPPLIER_ARCHIVE_STATUS = "supplier_status_archive";

// Total
router.post('/getTotalClient', async function(req, res) {

    sub.getTotal(req, res, CLIENT_ARCHIVE_STATUS);

});
router.post('/getTotalSupplier', async function(req, res) {

    sub.getTotal(req, res, SUPPLIER_ARCHIVE_STATUS);

});

// End Points
router.post('/getCountClient', function(req, res) {

    sub.getCount(req, res, CLIENT_ARCHIVE_STATUS);

});

router.post('/getCountSupplier', function(req, res) {

    sub.getCount(req, res, SUPPLIER_ARCHIVE_STATUS);

});

router.post('/getFolderClient', function(req, res) {

    sub.getFolder(req, res, CLIENT_ARCHIVE_STATUS);

});

router.post('/getFolderSupplier', function(req, res) {

    sub.getFolder(req, res, SUPPLIER_ARCHIVE_STATUS);

});
