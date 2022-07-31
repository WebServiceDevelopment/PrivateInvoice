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

const BUYER_ARCHIVE_STATUS	= "buyer_status_archive";
const SELLER_ARCHIVE_STATUS	= "seller_status_archive";

//--------------------------------- End Points --------------------------------
/*
 * 1.
 * getCountOfArchive
 */
router.get('/getCountOfArchive', function(req, res) {
	const archive = req.query.archive;
	const folder = req.query.folder;
	const role = req.query.role;
	const type = req.query.type;

	if(type != 'invoice') {
		res.status(400).json({
			err : 11,
			msg : "Invalid argument"
		});
	}

	if(role != 'buyer' && role != 'seller') {
		res.status(400).json({
			err : 11,
			msg : "Invalid argument"
		});
	}
	
	if(archive != 1 && archive != 0) {
		res.status(400).json({
			err : 11,
			msg : "Invalid argument"
		});
	}

	if(folder != 'paid' && folder != 'trash') {
		res.status(400).json({
			err : 11,
			msg : "Invalid argument"
		});
	}
	
	req.body = [
            {
                archive : archive,
                folder : folder,
                role : role,
                type : 'invoice'
            }
        ]

	//console.log(JSON.stringify(req.body));

	let table_name;

	switch(role) {
	case "buyer":
		table_name = BUYER_ARCHIVE_STATUS;	
	break;
	case "seller":
		table_name = SELLER_ARCHIVE_STATUS;	
	break;
	}

    sub.getCount(req, res, table_name);

});

/*
 * 2.
 * getFolderOfArchive
 */
router.get('/getFolderOfArchive', function(req, res) {

	const archive = req.query.archive;
	const folder = req.query.folder;
	const role = req.query.role;
	const type = req.query.type;

	const offset = req.query.offset;
	const limit = req.query.limit;

    req.body =
            {
                archive : archive,
                folder : folder,
                role : role,
                type : type,
                offset : offset,
                limit : limit
            }

	//console.log(JSON.stringify(req.body));

	let table_name;

	switch(role) {
	case "buyer":
		table_name = BUYER_ARCHIVE_STATUS;	
	break;
	case "seller":
		table_name = SELLER_ARCHIVE_STATUS;	
	break;
	}

    sub.getFolder(req, res, table_name);

});


/*
 * 7.
 * getTotalBuyer
 */
router.get('/getTotalOfArchive', async function(req, res) {

	const archive = req.query.archive;
	const folder = req.query.folder;
	const role = req.query.role;
	const type = req.query.type;

    req.body =
            {
                archive : archive,
                folder : folder,
                role : role,
                type : type
            }

	//console.log(JSON.stringify(req.body));

	let table_name;

	switch(role) {
	case "buyer":
		table_name = BUYER_ARCHIVE_STATUS;	
	break;
	case "seller":
		table_name = SELLER_ARCHIVE_STATUS;	
	break;
	}

    sub.getTotal(req, res, table_name);

});
