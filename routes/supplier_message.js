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

// Import Router

const express = require('express');
const router = express.Router();
module.exports = router;

// Database


// Table Name
const SUPPLIER_STATUS         	= "supplier_status";
const CONTACTS					= "contacts";

// Accept an Invoice

router.post('/supplierToConnect', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;

	const [ supplier_host, err ] = await sub.getSupplierHost(CONTACTS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

    if(!check_ipadder(req.ip , supplier_host)) {
        console.log("invalid request : req.ip="+req.ip+":supplier_host="+supplier_host);
        return res.status(400).json(err);
    }

	return res.status(200).end('accepted');

    function check_ipadder (req_ip , supplier_host) {

        let ip = req_ip.split(":")[3];

        if(supplier_host.indexOf(ip) != -1) {
                return true;
        }
        return false;
    }

});

router.post('/supplierToConfirm', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;


	const [_, err] = await sub.setConfirm(SUPPLIER_STATUS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

	console.log("/supplierToConfirm accepted");

	res.status(200).end('accepted');

});

router.post('/supplierToUnconfirm', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;


	const [_, err] = await sub.setUnconfirm(SUPPLIER_STATUS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

	res.status(200).end('accepted');

	console.log("/supplierToUnconfirm accepted");
});

router.post('/supplierToReturn', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;


	const [_, err] = await sub.setReturn(SUPPLIER_STATUS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

	console.log("/supplierToReturn accepted");

	res.status(200).end('accepted');

});

router.post('/supplierToMakePayment', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;


	const [_, err] = await sub.setMakePayment(SUPPLIER_STATUS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

	res.status(200).end('accepted');

	console.log("/supplierToMakePayment accepted");
});

/*
*
*/
router.post('/supplierToPaymentReservation', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;


	const [_, err] = await sub.setPaymentReservation(SUPPLIER_STATUS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

	res.status(200).end('accepted');

	console.log("/supplierToPaymentReservation accepted");
});

/*
*
*/
router.post('/supplierRollbackReturnToSent', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;


	const [_, err] = await sub.rollbackReturnToSent(SUPPLIER_STATUS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

	res.status(200).end('accepted');

	console.log("/supplierRollbackReturnToSent accepted");
});

/*
*
*/
router.post('/supplierRollbackConfirmToSent', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;


	const [_, err] = await sub.rollbackConfirmToSent(SUPPLIER_STATUS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

	res.status(200).end('accepted');

	console.log("/supplierRollbackConfirmToSent accepted");

});

/*
*
*/
router.post('/supplierRollbackSentToConfirm', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;


	const [_, err] = await sub.rollbackSentToConfirm(SUPPLIER_STATUS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

	res.status(200).end('accepted');

	console.log("/supplierRollbackSentToConfirm accepted");
});

router.post('/supplierRollbackPaidToConfirm', async (req, res) => {

	const { document_uuid, client_uuid } = req.body;


	const [_, err] = await sub.rollbackPaidToConfirm(SUPPLIER_STATUS, document_uuid, client_uuid);

	if(err) {
		console.log(err);
		return res.status(400).json(err);
	}

	res.status(200).end('accepted');

	console.log("/supplierRollbackPaidToConfirm accepted");
});

