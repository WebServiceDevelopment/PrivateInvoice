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

const sub                       = require("../modules/invoice_sub.js");
const tran                      = require("../modules/invoice_sub_transaction.js");
const eth                       = require("../modules/web3_eth.js");
const web3                      = eth.getWeb3();

// Database
const config                    = require('../config.json');


// Table Name
const SELLER_STATUS             = "seller_status";
const SELLER_DOCUMENT           = "seller_document";
const CONTACTS                  = "contacts";

// CURRENCY
const CURRENCY                  = config.CURRENCY


// ------------------------------- End Points -------------------------------
/*
 * tellMeYourWalletAccount
 */
router.post('/tellMeYourWalletAccount', async function(req, res) {

	const METHOD = '/tellMeYourWalletAccount';

    const { seller_did, buyer_did } = req.body;

    // 1.
    //
    const [ seller_host, err1 ] = await sub.getBuyerHost(CONTACTS, seller_did, buyer_did);
    if(err1) {

		let msg = `Error:${METHOD}: Invalid request.`;

        return res.status(400)
			.json({
				err: 1,
				msg : msg
			});
    }

	// 2.
	//
    if(!sub.check_ipadder(req.ip , seller_host)) {

        let msg = `Error:${METHOD}: Invalid request.`;

        return res.status(400)
			.json({
				err: 2,
				msg : msg
			});
    }

    res.json({
        err : 0,
        msg : {"account":process.env.ACCOUNT}
    });

    return;
});


/*
 * sellerToConnect
 */
router.post('/sellerToConnect', async (req, res) => {

	const METHOD = '/sellerToConnect';

	const { seller_uuid, buyer_did } = req.body;

	// 1.
	//
	const [ seller_host, err1 ] = await sub.getSellerHost(CONTACTS, seller_uuid, buyer_did);

	if(err1) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}

	// 2.
	//
    if(!sub.check_ipadder(req.ip , seller_host)) {
		
        let msg = `Error:${METHOD}: Invalid request.`;
		
        return res.status(400)
			.json({
				err: 1,
				msg: msg
			});
    }

	console.log("/sellerToConnect accepted");

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});
	return;


});

/*
 * sellerToConfirm
 */
router.post('/sellerToConfirm', async (req, res) => {

	const METHOD = '/sellerToConfirm';

	const { document_uuid, buyer_did } = req.body;


	const [ _, err] = await sub.setConfirm(SELLER_STATUS, document_uuid, buyer_did);

	if(err) {

        let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}

	console.log("/sellerToConfirm accepted");

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});

});

/*
 * sellerToUnconfirm
 */
router.post('/sellerToUnconfirm', async (req, res) => {

	const METHOD = '/sellerToConfirm';

	const { document_uuid, buyer_did } = req.body;


	const [ _, err] = await sub.setUnconfirm(SELLER_STATUS, document_uuid, buyer_did);

	if(err) {

        let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}

	console.log("/sellerToUnconfirm accepted");

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});

});

/*
 * sellerToReturn
 */
router.post('/sellerToReturn', async (req, res) => {

	const METHOD = '/sellerToReturn';

	const { document_uuid, buyer_did } = req.body;


	const [_, err] = await sub.setReturn(SELLER_STATUS, document_uuid, buyer_did);

	if(err) {
        let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}

	console.log("/sellerToReturn accepted");

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});

});

/*
 * sellerToMakePayment
 */
router.post('/sellerToMakePayment', async (req, res) => {

	const METHOD = '/sellerToMakePayment';

	const { document_uuid, buyer_did , hash} = req.body;

	// 1.
	// Check the transaction receipt.
	// Happy path just okay.
    // getTransactionReciept
    //
    const [ receipt, err1 ] = await eth.getTransactionReceipt(web3, hash) ;

    if(err1) {

        let msg = `Error:${METHOD}: No transaction reciept was found.`

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
    }

	console.log(receipt);

	// 2.
	//
    const [ result, err2 ] = await eth.getTransaction(web3, hash) ;

    if(err2) {
        let msg = `Error:${METHOD}:No transaction was found.`

		res.status(400)
			.json({
				err: 2,
				msg: msg
			});
		return;
    }

	// 3.
	// getDocument
	// And get total from document_json.
	// And convert units to wei.
	//
    const [ document, _3 ] = await sub.getDocument(SELLER_DOCUMENT, document_uuid);
	const document_json = JSON.parse(document.document_json);
	const totalPaymentDue = document_json.credentialSubject.totalPaymentDue;

	console.log("/sellerToMakePayment : totalPaymentDue="+totalPaymentDue.price);

	let wk = '0';
	if( totalPaymentDue != null && totalPaymentDue.price != null) {
		wk = totalPaymentDue.price;
	}
	const total = web3.utils.toWei(wk , CURRENCY.symbol);

	// 4.
	// Does transaction value and invoice total match?
	//

	if( result != null) {

		if( result.value !=  total) {
			let msg = "Transaction value and invoice total do not match."

			res.status(400)
				.json({
					err: 1,
					msg: msg
				});
			return;
		}
	}

    // 5.
    // begin Transaction
    //
    const [ conn , _5 ] = await tran.connection ();
    await tran.beginTransaction(conn);
	
	// 6.
	//
	const [ _6, err6] = await tran.setMakePayment_status(conn, SELLER_STATUS, document_uuid, buyer_did);

	if(err6) {
		console.log(err6);
		let code = 400;
		let errno = 6;
        res.status(400)
			.json(tran.rollbackAndReturn(conn, code, err6, errno, METHOD));
		return;
	}

	// 7.
	//
	const [_7, err7] = await tran.setMakePayment_document(conn, SELLER_DOCUMENT, document_uuid, hash);

	if(err7) {
		console.log(err7);
		let code = 400;
		let errno = 7;
        res.status(400)
			.json(tran.rollbackAndReturn(conn, code, err7, errno, METHOD));
		return;
	}

	// 8.
	// commit
    //
    const [ _8, err8 ] = await tran.commit(conn);

    if (err8) {
		console.log(err8);
        let errno = 8;
        let code = 400;
        res.status(400)
			.json(tran.rollbackAndReturn(conn, code, err8, errno, METHOD));
		return;
    }

    // 9.
    //
    conn.end();

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});

	console.log("/sellerToMakePayment accepted");
});

/*
 * sellerToPaymentReservation
 */
router.post('/sellerToPaymentReservation', async (req, res) => {

	const METHOD = '/sellerToPaymentReservation';

	const { document_uuid, buyer_did } = req.body;


	const [ _, err] = await sub.setPaymentReservation(SELLER_STATUS, document_uuid, buyer_did);

	if(err) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});

		return;
	}

	console.log("/sellerToPaymentReservation accepted");

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});
});

/*
 * sellerToCancelPaymentReservation
 */
router.post('/sellerToCancelPaymentReservation', async (req, res) => {

	const METHOD = '/sellerToCancelPaymentReservation';

	const { document_uuid, buyer_did } = req.body;


	const [ _, err] = await sub.resetPaymentReservation(SELLER_STATUS, document_uuid, buyer_did);

	if(err) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});

	console.log("/sellerToPaymentReservation accepted");
});

/*
 * sellerRollbackReturnToSent
 */
router.post('/sellerRollbackReturnToSent', async (req, res) => {

	const METHOD = '/sellerRollbackReturnToSent';

	const { document_uuid, buyer_did } = req.body;


	const [ _, err] = await sub.rollbackReturnToSent(SELLER_STATUS, document_uuid, buyer_did);

	if(err) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});

	console.log("/sellerRollbackReturnToSent accepted");
});

/*
 * sellerRollbackConfirmToSent
 */
router.post('/sellerRollbackConfirmToSent', async (req, res) => {

	const METHOD = '/sellerRollbackConfirmToSent';

	const { document_uuid, buyer_did } = req.body;


	const [ _, err] = await sub.rollbackConfirmToSent(SELLER_STATUS, document_uuid, buyer_did);

	if(err) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});

	console.log("/sellerRollbackConfirmToSent accepted");
});

/*
 * sellerRollbackSentToConfirm
 */
router.post('/sellerRollbackSentToConfirm', async (req, res) => {

	const METHOD = '/sellerRollbackSentToConfirm';

	const { document_uuid, buyer_did } = req.body;


	const [ _, err] = await sub.rollbackSentToConfirm(SELLER_STATUS, document_uuid, buyer_did);

	if(err) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});

		return;
	}

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});

	console.log("/sellerRollbackSentToConfirm accepted");
});

/*
 * sellerRollbackPaidToConfirm
 */
router.post('/sellerRollbackPaidToConfirm', async (req, res) => {

	const METHOD = '/sellerRollbackPaidToConfirm';

	const { document_uuid, buyer_did } = req.body;


	const [ _, err] = await sub.rollbackPaidToConfirm(SELLER_STATUS, document_uuid, buyer_did);

	if(err) {

		let msg = `Error:${METHOD}: Invalid request.`;

		res.status(400)
			.json({
				err: 1,
				msg: msg
			});
		return;
	}

	res.status(200)
		.json({
			err: 0,
			msg: 'accepted'
		});

	console.log("/sellerRollbackPaidToConfirm accepted");
});

