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

// Import sub

const sub                   	= require("./invoice_sub.js");
const tran                      = require("./invoice_sub_transaction.js");

// Import Router

const express = require('express');
const router = express.Router();
module.exports = router;

// Database

// Table Name
const CLIENT_DOCUMENT       	= "client_document";
const CLIENT_STATUS         	= "client_status";
const CONTACTS					= "contacts";

// Accept an Invoice

router.post('/clientToConnect', async (req, res) => {

	//console.log(supplier_uuid);
	//console.log(client_uuid);

	const { supplier_uuid, client_uuid } = req.body;

	// 1.
	//
	const [ supplier_host, err ] = await sub.getSupplierHost(CONTACTS, supplier_uuid, client_uuid);
	if(err) {
        console.log("Error getSupplierHost");
		return res.status(400).json(err);
	}

	// 2.
	//
    if(!check_ipadder(req.ip , supplier_host)) {
        console.log("invalid request : req.ip="+req.ip+":supplier_host="+supplier_host);
        return res.status(400).json(err);
    }

	console.log("/clientToConnect accepted");
/*
	console.log(req.socket.localPort);
	console.log(req.socket.remotePort);
*/

	return res.status(200).end('accepted');

    function check_ipadder (req_ip , supplier_host) {

        let ip = req_ip.split(":")[3];

        if(supplier_host.indexOf(ip) != -1) {
                return true;
        }
        return false;
    }

});

router.post('/clientToSend', async (req, res) => {

	//console.log("/clientToSend");

	const { document, status } = req.body;
	const { document_uuid, supplier_uuid, client_uuid} = document;

	let errno, code;

	// 1.
	let  document_json;
	try {
		document_json = JSON.stringify(document);
	} catch (err1) {
		return res.status(400).end(err1);
	}
	

	// 2. 
	// Second we check to see if there is any contact information
	const [ supplier_host, err2 ] = await sub.getSupplierHost(CONTACTS, supplier_uuid, client_uuid);

	if(err2) {
		return res.status(400).json(err2);
	}

	// 3.
	// Then we check to see if there is any data already registered
	//
	const [ _3, err3] = await sub.checkForExistingDocument(CLIENT_DOCUMENT, document_uuid);

	if(err3) {
		return res.status(400).json(err3);
	}

/*
 * Convert time format from ISO format to Date format.
*/
	// 4.
	//
	status.due_by = new Date(Date.parse(status.due_by));

    // 5.
    // begin Transaction
    //
    const [ conn , _5 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 6.
	const [ _6, err6 ] = await tran.insertDocument(conn, CLIENT_DOCUMENT, status, document_json);

	if(err6) {
		errno = 6;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err6, errno));
    }

	// 7.
	//
	const [ _7, err7] = await tran.insertStatus(conn, CLIENT_STATUS, status);

	if(err7) {
		errno = 7;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err7, errno));
	}

	// 8.
    // commit
    //
    const [ _8, err8] = await tran.commit(conn);

	if (err8) {
        errno = 8;
        code = 400;
        return res.status(400).json(tran.rollbackAndReturn(conn, code, err8, errno));
	}

	// 9.
	//
   	conn.end();

	res.status(200).end('accepted');

	console.log("/clientToSend accepted");
});

router.post('/clientToWithdraw', async (req, res) => {

	const { document_uuid, client_uuid, document_folder} = req.body;

    // 1.
	// STATUS
    // First we go ahead and get the status.
    //
    const [ old_status , _1 ] = await sub.getStatus( CLIENT_STATUS, document_uuid) ;

    if(old_status == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

    // 2.
    // Second we go ahead and get the document
    //
    const [ old_document , _2 ] = await sub.getDocument( CLIENT_DOCUMENT, document_uuid) ;

	if(old_document == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

	// 3.
	const [ _3, err3] = await sub.setWithdrawClient(CLIENT_STATUS, document_uuid , client_uuid, document_folder );
	if(err3) {
		console.log('/clientToWithdraw err='+err3);
		if(err3 == null) {
			return res.status(400).json({message:"Record is not found."});
		}
		return res.status(400).json(err3);
	}

	console.log("/clientToWithdraw accepted");

	res.status(200).end('accepted');

});

router.post('/clientRollbackReturnToSent', async (req, res) => {

	const { document_uuid, client_uuid, document_folder} = req.body;

    // 1.
	// STATUS
    // First we go ahead and get the status.
    //
    const [ old_status , _1 ] = await sub.getStatus( CLIENT_STATUS, document_uuid) ;

    if(old_status == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

    // 2.
    // Second we go ahead and get the document
    //
    const [ old_document , _2 ] = await sub.getDocument( CLIENT_DOCUMENT, document_uuid) ;

	if(old_document == undefined) {
        res.json({
            err : 0,
            msg : 'Record is not exist.'
        });
        return;
    }

	// 3.
	const [ _3, err3] = await sub.rollbackReturnToSent(CLIENT_STATUS, document_uuid , client_uuid, document_folder );
	if(err3) {
		console.log('/rollbackReturnToSent err='+err3);

		if(err3 == null) {
			return res.status(400).json({message:"Record is not found."});
		}
		return res.status(400).json(err3);
	}

	console.log("/rollbackReturnToSent accepted");

	res.status(200).end('accepted');

});
