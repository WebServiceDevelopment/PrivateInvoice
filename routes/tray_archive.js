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

// Import Router

const express                   = require('express');
const router                    = express.Router();
module.exports                  = router;

// Import Modules
const {
    getCount,
    getFolder,
    getTotal,
	nullCheckArgsOfInvoiceTray,
}                               = require("../modules/tray_sub.js");

// Database

const BUYER_ARCHIVE_STATUS      = "buyer_status_archive";
const SELLER_ARCHIVE_STATUS     = "seller_status_archive";

//--------------------------------- End Points --------------------------------
/*
 * 1.
 * getCountOfArchive
 */
router.get('/getCountOfArchive', async function(req, res) {

	const METHOD = '/getCountOfArchive';

	const archive = req.query.archive;
	const folder = req.query.folder;
	const role = req.query.role;
	const type = req.query.type;

// 1.
	if(type != 'invoice') {
		let msg = `ERROR:${METHOD}: Invalid argument`;
		res.status(400).json({
			err : 1,
			msg : msg
		});
	}

	if(role != 'buyer' && role != 'seller') {
		let msg = `ERROR:${METHOD}: Invalid argument`;
		res.status(400).json({
			err : 1,
			msg : msg
		});
	}
	
	if(archive != 1 && archive != 0) {
		let msg = `ERROR:${METHOD}: Invalid argument`;
		res.status(400).json({
			err : 1,
			msg : msg
		});
	}

	if(folder != 'paid' && folder != 'trash') {

		let msg = `ERROR:${METHOD}: Invalid argument`;

		res.status(400).json({
			err : 1,
			msg : msg
		});
	}
	
// 2.
	req.body = [
            {
                archive : archive,
                folder : folder,
                role : role,
                type : 'invoice'
            }
        ]

	const table = ((role) => {

			switch(role) {
			case "buyer":
				return BUYER_ARCHIVE_STATUS;	
			case "seller":
				return SELLER_ARCHIVE_STATUS;	
			}

		})(role)

    const [err , counts] = await getCount(req, res, table);

    if(err) {

        res.json({
			err: 0,
			msg: counts
		});
		return;
    }

    res.json({
        err: 0,
        msg: counts
    });


});

/*
 * 2.
 * getFolderOfArchive
 */
router.get('/getFolderOfArchive', async function(req, res) {

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

    const [rows, err1] = await getFolder(req, res, table_name);

	if(err1) {
		let msg = `ERROR:${METHOD}: Could not get Folder`
        res.status(400).json({
            err : 1,
            msg : msg
        });
	}

	res.json({
		err : 0,
		msg : rows
	});

});


/*
 * 3.
 * getTotalOfArchive
 */
router.get('/getTotalOfArchive', async function(req, res) {

	const METHOD = '/getTotalOfArchive';

	const archive = req.query.archive;
	const folder = req.query.folder;
	const role = req.query.role;
	const type = req.query.type;

	if(nullCheckArgsOfInvoiceTray(req)== false) {

		let msg = `ERROR:${METHOD}: Invalid argument`

		res.status(400)
			.json({
				err : 1,
				msg : msg
			});
		return;
	}

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

    const [total, err] = await getTotal(req, res, table_name);

	if(err) {
		let msg = `ERROR:${METHOD}: Could not get Total`
        res.status(400).json({
            err : 1,
            msg : {total : 0}
        });
	}

	res.json({
		err : 0,
		msg : total
	});

});
