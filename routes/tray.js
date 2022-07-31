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
 * getCount
 */
router.get('/getCountOfInvoice', function(req, res) {

	//console.log("/getCountOfInvoice")

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
            err : 12,
            msg : "Invalid argument"
        });
    }

    if(archive != 0) {
        res.status(400).json({
            err : 13,
            msg : "Invalid argument"
        });
    }

    if(folder != '[sent,returned,confirmed,paid]') {
        res.status(400).json({
            err : 14,
            msg : "Invalid argument"
        });
    }


    switch(role) {
    case "buyer":
    	req.body = [
            { type : "invoice", role : "buyer", folder : "sent", archive : 0 },
            { type : "invoice", role : "buyer", folder : "returned", archive : 0 },
            { type : "invoice", role : "buyer", folder : "confirmed", archive : 0 },
            { type : "invoice", role : "buyer", folder : "paid", archive : 0 }
        ]
    break;
    case "seller":
    	req.body = [
            { type : "invoice", role : "seller", folder : "sent", archive : 0 },
            { type : "invoice", role : "seller", folder : "returned", archive : 0 },
            { type : "invoice", role : "seller", folder : "confirmed", archive : 0 },
            { type : "invoice", role : "seller", folder : "paid", archive : 0 }
        ]
    break;
    }

    sub.getCount(req, res, ((role) => {
			switch(role) {
			case "buyer":
				return BUYER_STATUS;
			case "seller":
				return SELLER_STATUS;
			}
		})(role)
	);

});


/*
 * 2.
 * getFolderOfInvoice
 */
router.get('/getFolderOfInvoice', function(req, res) {

    const archive = req.query.archive;
    const folder = req.query.folder;
    const role = req.query.role;
    const type = req.query.type;

    const offset = req.query.offset;
    const limit = req.query.limit;

    if(type != 'invoice') {
        res.status(400).json({
            err : 11,
            msg : "Invalid argument"
        });
    }

    if(role != 'buyer' && role != 'seller') {
        res.status(400).json({
            err : 12,
            msg : "Invalid argument"
        });
    }

    if(archive != 0) {
        res.status(400).json({
            err : 13,
            msg : "Invalid argument"
        });
    }

    switch(folder) {
	case 'sent':
	case 'returned':
	case 'confirmed':
	case 'paid':
	break;
	default:
        res.status(400).json({
            err : 14,
            msg : "Invalid argument"
        });
		
	}

    req.body = 
			{
				archive : archive,
				folder : folder,
				role : role,
				type : type,
				offset : offset,
				limit : limit
			}


	sub.getFolder(req, res, ((role) => {
			switch(role) {
			case "buyer":
				return BUYER_STATUS;
			case "seller":
				return SELLER_STATUS;
			}
		})(role)
	);

});


/*
 * 3.
 * getTotalInvoice
 */
router.get('/getTotalOfInvoice', async function(req, res) {

    const archive = req.query.archive;
    const folder = req.query.folder;
    const role = req.query.role;
    const type = req.query.type;

    const offset = req.query.offset;
    const limit = req.query.limit;

    if(type != 'invoice') {
        res.status(400).json({
            err : 11,
            msg : "Invalid argument"
        });
    }

    if(role != 'buyer' && role != 'seller') {
        res.status(400).json({
            err : 12,
            msg : "Invalid argument"
        });
    }

    if(archive != 0) {
        res.status(400).json({
            err : 13,
            msg : "Invalid argument"
        });
    }

    switch(folder) {
	case 'sent':
	case 'returned':
	case 'confirmed':
	case 'paid':
	break;
	default:
        res.status(400).json({
            err : 14,
            msg : "Invalid argument"
        });
		
	}

    req.body = 
			{
				archive : archive,
				folder : folder,
				role : role,
				type : type,
				offset : offset,
				limit : limit
			}


	sub.getTotal(req, res, ((role) => {
			switch(role) {
			case "buyer":
				return BUYER_STATUS;
			case "seller":
				return SELLER_STATUS;
			}
		})(role)
	);

});
