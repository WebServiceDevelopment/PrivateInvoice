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
const sub						= require("./invoice_sub.js");
const eth						= require("./web3_eth.js");
const to_seller					= require("./buyer_to_seller.js");
const tran                      = require("./invoice_sub_transaction.js");
const Tx						= require('ethereumjs-tx').Transaction;
const util						= require("./util.js");

// Import Router

const express					= require('express');
const router					= express.Router();
module.exports					= router;

//  web3.js

const web3						= eth.getWeb3();

web3.eth.transactionConfirmationBlocks = 2;

// Libraries

const ipfs_http_client          = require('ipfs-http-client');
const Ipfs_Http_Client          = ipfs_http_client.create('http://192.168.1.127:5001');

// Database

const config                    = require('../config.json');

const BUYER_STATUS				= "buyer_status";
const BUYER_DOCUMENT			= "buyer_document";

const CONTACTS					= "contacts";

// ------------------------------- End Points -------------------------------

/*
 * [ Return to Sender ]
 * returnToSender
 */
router.post('/returnToSender', async function(req, res) {
	const METHOD = '/returnToSender';

	let start = Date.now();

	const { document_uuid } = req.body;
	const { member_uuid } = req.session.data;

	let errno, code;

    // 1.
	//
    const [ seller_uuid, err1 ] = await sub.getSellerUuid(BUYER_STATUS, document_uuid, member_uuid);
    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).json(err1);
    }

    // 2.
	//
    const [ seller_host, err2 ] = await sub.getSellerHost(CONTACTS, seller_uuid, member_uuid);
    if(err2) {
        console.log("Error 2 status = 400 err="+err2);
        return res.status(400).json(err2);
    }

    // 3. buyer connect check
	//
    const [ code3, err3 ] = await to_seller.connect(seller_host, member_uuid, seller_uuid);

    if(code3 !== 200) {
        console.log("Error 3 code="+code3+":err="+err3);
        let msg;
        if(code3 == 500) {
            msg = {"err":"The destination node cannot be found."};
        } else {
            msg = {"err":err3};
        }
        return res.status(400).json(msg);
    }

    // 4.
    // begin Transaction
    //
    const [ conn , _4 ]  = await tran.connection ();
    await tran.beginTransaction(conn);

	// 5.
	// Set BUYER_STATUS to 'return' with document_uuid as the key.
	//
	const [_5 , err5 ] = await tran.setReturn (conn, BUYER_STATUS, document_uuid , member_uuid);

    if (err5 ) {
		errno = 5;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err5, errno));
    }
	
	// 6.
	// Send a 'return' request to seller.
	//
    const [ code6, err6 ] = await to_seller.return(seller_host, document_uuid, member_uuid);

    if(code6 !== 200) {

		errno = 6;
		return res.status(400).json(tran.rollbackAndReturn(conn, code6, err6, errno));
    }
	
    // 7.
    // commit
    //

   	const [ _7, err7 ] = await tran.commit(conn);

	if (err7) {

		errno = 7;
		code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err7, errno);

	// 8.
	//
		const [ code8, err8 ] = await to_seller.rollbackReturnToSent(seller_host, member_uuid, seller_uuid);

		if(code8 !== 200) {
			console.log("Error 8 code="+code8+":err="+err8);
			if(code8 == 500) {
				msg = {"err":"seller connect check:ECONNRESET"};
			} else {
				msg = {"err":err8};
			}
		}
		return res.status(400).json(msg);

	}

	// 9.
	//
   	conn.end();

	//console.log("/return accepted");

	res.json({
		err : 0,
		msg : "okay"
	});

	let end = Date.now();
	console.log("/return Time: %d ms", end - start);

});

/*
 * [ Confirm Invoice ]
 * confirm
 */
router.post('/confirm', async function(req, res) {

	const METHOD = '/confirm';

	let start = Date.now();

	const { document_uuid } = req.body;
	const { member_uuid } = req.session.data;

	let errno, code;

    // 1.
	//
    const [ seller_uuid, err1 ] = await sub.getSellerUuid(BUYER_STATUS, document_uuid, member_uuid);
    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).json(err1);
    }

    // 2.
	//
    const [ seller_host, err2 ] = await sub.getSellerHost(CONTACTS, seller_uuid, member_uuid);

    if(err2) {
        console.log("Error 2 status = 400 err="+err2);
        return res.status(400).json(err2);
    }

    //3. buyer connect check
	//
    const [ code3, err3 ] = await to_seller.connect(seller_host, member_uuid, seller_uuid);

    if(code3 !== 200) {
        console.log("Error 3 code="+code3+":err="+err3);
        let msg;
        if(code3 == 500) {
            msg = {"err":"The destination node cannot be found."};
        } else {
            msg = {"err":err3};
        }
        return res.status(400).json(msg);
    }


    // 4.
    // begin Transaction
    //
    const [ conn , _4 ]= await tran.connection ();
    await tran.beginTransaction(conn);

	// 5.
	//
	const [ _5, err5 ] = await tran.setConfirm (conn, BUYER_STATUS, document_uuid , member_uuid);

    if (err5 ) {
		errno = 5;
		code = 400;

		return res.status(400).json(tran.rollbackAndReturn(conn, code, err5, errno));
    }

	// 6.
	//
    const [ code6, err6 ] = await to_seller.confirm(seller_host, document_uuid, member_uuid);

    if(code6 !== 200) {
		console.log("seller_host="+seller_host+":"+document_uuid+":"+member_uuid);
		errno = 6;
		return res.status(400).json(tran.rollbackAndReturn(conn, code6, err6, errno));
    }
	
    // 7.
    // commit
    //
	const [ _7, err7 ] = await tran.commit(conn);

	if (err7) {

		errno = 7;
        code = 400;
        let msg = tran.rollbackAndReturn(conn, code, err7, errno);

	// 8.
	//
		const [ code8, err8 ] = await to_seller.rollbackConfirmToSent(seller_host, member_uuid, seller_uuid);

		if(code8 !== 200) {
			console.log("Error 8 code="+code8+":err="+err8);
			if(code8 == 500) {
				msg = {"err":"seller connect check:ECONNRESET"};
			} else {
				msg = {"err":err8};
			}
		}

        return res.status(400).json(msg);
	}

	// 9.
	//
	conn.end();

	//console.log("/confirm accepted");

	res.json({
		err : 0,
		msg : "okay"
	});

	let end = Date.now();
    console.log("/confirm Time: %d ms", end - start);

});

/*
 * [ Unconfirm ]
 * unconfirm
 */
router.post('/unconfirm', async function(req, res) {

	const METHOD = '/unconfirm';

	let start = Date.now();

	const { document_uuid } = req.body;
	const { member_uuid } = req.session.data;

	let errno, code;

    // 1.
	//
    const [ seller_uuid, err1 ] = await sub.getSellerUuid( BUYER_STATUS, document_uuid, member_uuid);

    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).json(err1);
    }

    // 2.
	//
    const [ seller_host, err2 ] = await sub.getSellerHost( CONTACTS, seller_uuid, member_uuid);

    if(err2) {
        console.log("Error 2 status = 400 err="+err2);

        return res.status(400).json(err2);
    }

    // 3. buyer connect check
	//
    const [ code3 , err3 ] = await to_seller.connect( seller_host, member_uuid, seller_uuid);

    if( code3 !== 200) {
        console.log("Error 3 code="+code3+":err="+err3);
        let msg;
        if(code3 == 500) {
            msg = {"err":"The destination node cannot be found."};
        } else {
            msg = {"err":err3};
        }
        return res.status(400).json(msg);
    }

    // 4
    // begin Transaction
    //
    const [ conn , _4 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 5.
	//
	const [ _5, err5] = await tran.setUnconfirm (conn, BUYER_STATUS, document_uuid , member_uuid);

    if (err5 ) {
        errno = 54
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err5, errno));
    }

	// 6.
	//
    const [ code6, err6 ] = await to_seller.unconfirm(seller_host, document_uuid, member_uuid);

    if(code6 !== 200) {
		errno = 6;
		return res.status(400).json(tran.rollbackAndReturn(conn, code6, err6, errno));
    }

    // 7.
    // commit
    //
    const [ _7, err7 ] = await tran.commit(conn);

	if (err7) {
        errno = 7;
        code = 400;
        let msg = tran.rollbackAndReturn(conn, code, err7, errno);

	// 8.
	//
		const [ code8, err8 ] = await to_seller.rollbackSentToConfirm(seller_host, member_uuid, seller_uuid);

		if(code8 !== 200) {
			console.log("Error 8 code="+code8+":err="+err8);
			if(code8 == 500) {
				msg = {"err":"seller connect check:ECONNRESET"};
			} else {
				msg = {"err":err8};
			}
		}
		return res.status(400).json(msg);

	}

	// 9.
	//
   	conn.end();

	//console.log("/unconfirm accepted");

	res.json({
		err : 0,
		msg : "okay"
	});

	let end = Date.now();
    console.log("/unconfirm Time: %d ms", end - start);

});

/*
* [ Make Payment ]
* makePayment
*/

router.post('/makePayment', async function(req, res) {

	const _METHOD = '/makePayment'
	const _NO = '030';

	let start = Date.now();

	const { document_uuid , gasLimit} = req.body;
	const { member_uuid } = req.session.data;

	let errno, code ;

    // 1.
	// getSellerUuid
	//
    const [ seller_uuid, err1 ] = await sub.getSellerUuid(BUYER_STATUS, document_uuid, member_uuid);

    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).json(err1);
    }

    // 2.
	// getSellerHost
	//
    const [ seller_host, err2 ] = await sub.getSellerHost(CONTACTS, seller_uuid, member_uuid);

    if(err2) {
        console.log("Error 2 status = 400 err="+err2);

        return res.status(400).json(err2);
    }

    // 3.
	// connect
	//
    const [ code3, err3 ] = await to_seller.connect(seller_host, member_uuid, seller_uuid);

    if(code3 !== 200) {
        console.log("Error 3 code="+code3+":err="+err3);
        let msg;
        if(code3 == 500) {
            msg = {"err":"The destination node cannot be found."};
        } else {
            msg = {"err":err3};
        }
        return res.status(400).json(msg);
    }

	// 4.
	// Ask for remittance amount from document.
	//

	// 5.
	// paymentReservation
	//
    const [ code5, err5 ] = await to_seller.paymentReservation(seller_host, document_uuid, member_uuid);

    if(code5 !== 200) {
        console.log("Error 5 code="+code5+":err="+err5);
        let msg;
        if(code5 == 500) {
            msg = {"err":"seller connect check:ECONNRESET"};
        } else {
            msg = {"err":err5};
        }
        return res.status(400).json(msg);
    }


	// 6.
	// get value from Document
	//
	const [ document , err6 ] = await sub.getDocument(BUYER_DOCUMENT, document_uuid);

	if(err6) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_uuid);

		console.log("error 6: getDocumen");

        return res.status(400).json(err6);
		return;
	}

	// 7.
	//
	let doc;
	try {
		doc = JSON.parse( document.document_json);
	} catch (err7) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_uuid);

		console.log("error JSON.parse ="+doc);
		for (let key in doc){
			console.log(key +":"+ doc[key]);
		}

        return res.status(400).json(err7);
		return;
	}

	// 8.
	// contract_address 
	//

	const contract_address = process.env.ACCOUNT;

    //console.log("contract_address ="+contract_address)

	// 9.
	// Balance before the start of payment
	// Ask for the balance of ETH
	const [ balanceWei_1, err9 ] = await  eth.getBalance(web3, contract_address) ;

	if( err9 ) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_uuid);

		console.log("error 9: getBalance");

        return res.status(400).json(err9);
		return;
	}


    // 10.
    // Get seller account
    //
    const [status10, data10] = await to_seller.getAccountOfSellerWallet(seller_host, seller_uuid, member_uuid) ;

    if(status10 != 200) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_uuid);

        console.log("Error 10 status = 400 err="+data10);

        return res.status(400).json(data10);
    }

    const msg = (data10.msg);

    const to_address = msg.account;

    //console.log("to_address="+to_address);


	// 11.
	// Ask for payment from document.
	// And Convert payment to hex.
	//
	let payment = doc.credentialSubject.totalPaymentDue.price.replace(/,/g,"")

	if(payment.indexOf(' ')) {
        payment = payment.split(" ")[0];
    }

	if(payment.indexOf('$')) {
        payment = payment.replace(/$/g,'');
    }

	//console.log("payment="+payment)
	
	const makePaymantTo = web3.utils.toHex(payment*1000000000);


	// 12.
	// Register document in ipfs and ask for cid.
	// And Convert ipfs cid to hex.
	//
	
	const ipfs_result = await Ipfs_Http_Client.add( document.document_json );
    const ipfs_cid = ipfs_result.cid.toString();
    const ipfs_cid_hex = web3.utils.toHex(ipfs_cid);

	console.log("cid="+ipfs_cid+":ipfs_cid_hex ="+ipfs_cid_hex)

	// 13. 
	// privateKey.
	//
	const PrivateKey = process.env.PRIVATE_KEY;


	// 14. 
	// sendTransaction
	//

	const [ receipt14, err14 ] = await util.sendSignedTransaction (web3, contract_address, PrivateKey, to_address, gasLimit, makePaymantTo, ipfs_cid_hex)

	if ( err14) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_uuid);

		let rt = {err:"Error : sendSignedTransaction failed."};

		return res.status(400).json(rt);
	}

	const hash = receipt14.transactionHash;
	console.log("14 a :"+hash);


    // 15.
    // begin Transaction
    //
    const [ conn , _15 ] = await tran.connection ();
    await tran.beginTransaction(conn);


	// 16.
	// setMakePayment_status
	//
	const [ _16, err16 ] = await tran.setMakePayment_status (conn, BUYER_STATUS, document_uuid , member_uuid);

    if (err16 ) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_uuid);

        errno = 16;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err16, errno));
    }

	// 17.
	// setMakePayment_document
	//
	const [ _17, err17 ] = await tran.setMakePayment_document (conn, BUYER_DOCUMENT, document_uuid , hash);

    if (err17 ) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_uuid);

        errno = 17;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err17, errno));
    }


	// 18.
	// makePayment
	//
    const [ code18, err18 ] = await to_seller.makePayment(seller_host, document_uuid, member_uuid, hash);

    if(code18 !== 200) {
		errno = 18;
		return res.status(400).json(tran.rollbackAndReturn(conn, code18, err18, errno));
    }


    // 19.
    // commit
    //
   	const [ _19, err19 ] = await tran.commit(conn);

	if (err19) {
        errno = 19;
        code = 400;
        let msg = tran.rollbackAndReturn(conn, code, err19, errno);


	// 20.
	// rollback
		const [ code20, err20 ] = await to_seller.rollbackPaidToConfirm(seller_host, member_uuid, seller_uuid);

		if(code20 !== 200) {
			console.log("Error 20 code="+code20+":err="+err20);
			if(code20 == 500) {
				msg = {"err":"seller connect check:ECONNRESET"};
			} else {
				msg = {"err":err20};
			}
		}

        return res.status(400).json(msg);
	}


	// 21.
	//
   	conn.end();
	

	// 22.
	// ETH balance Confirmation
	//
	const [ balanceWei_2, _22 ] = await  eth.getBalance(web3, contract_address) ;

   	let balanceETH_1 = web3.utils.fromWei(balanceWei_1 , 'ether');
   	let balanceETH_2 = web3.utils.fromWei(balanceWei_2 , 'ether');
   	let balanceETH_3 = web3.utils.fromWei((BigInt(balanceWei_1) - BigInt(balanceWei_2)).toString() , 'ether');

	//console.log("Before:"+balanceETH_1+"ETH"+":"+"After:"+balanceETH_2+"ETH"+"paid="+balanceETH_3+" ETH");

	// 23.
    // ETH transaction result
    //
    const [ transaction_result, err23 ] = await  eth.getTransaction(web3, hash) ;

	if( err23) {
			console.log("err23"+err23);
	}
   	console.log(transaction_result);


	// IP ADDRESS OF IPFS SERVER
	const ipfs_address = config.IPFS_ADDRESS;

	//console.log("/makePayment accepted");

	let end = Date.now();
    console.log("/makePayment Time: %d ms", end - start);

	res.json({
		err : 0,
		msg : {
			"consumed":balanceETH_3+" ETH",
			"transaction_result" : transaction_result,
			"ipfs_cid":ipfs_cid,
			"ipfs_address": ipfs_address
		}
	});

	return;

});

