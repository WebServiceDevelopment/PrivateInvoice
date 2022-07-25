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
const sub						= require("../modules/invoice_sub.js");
const tran					    = require("../modules/invoice_sub_transaction.js");
const to_seller					= require("../modules/buyer_to_seller.js");
const eth						= require("../modules/web3_eth.js");

const Tx						= require('ethereumjs-tx').Transaction;
const util						= require("../modules/util.js");

// Import Router

const express					= require('express');
const router					= express.Router();
module.exports					= router;

const { 
	createConfirmMessage,
	createReturnMessage,
	createPaymentMessage
} = require('../modules/update_status.js');

const { 
	getPrivateKeys, 
	makePresentation 
} = require('../modules/presentations_out.js');

//  web3.js

const web3						= eth.getWeb3();
web3.eth.transactionConfirmationBlocks = 2;

// Ipfs client url
let ip_wk = process.env.IPFS_ADDRESS.split(":");
const IPFS_CLIENT_URL = ip_wk[0]+":"+ip_wk[1]+":5001"

console.log("IPFS_CLIENT_URL ="+IPFS_CLIENT_URL );

// Libraries
const ipfs_http_client		  	= require('ipfs-http-client');
//const Ipfs_Http_Client		= ipfs_http_client.create('http://192.168.1.127:5001');
const Ipfs_Http_Client		  	= ipfs_http_client.create(IPFS_CLIENT_URL);

// Database

const db						= require('../database.js');
const config					= require('../config.json');

const BUYER_STATUS				= "buyer_status";
const BUYER_DOCUMENT			= "buyer_document";

const CONTACTS					= "contacts";

// Helper function

const getPrivateKey = async(member_did) => {

	const sql = `
		SELECT
			wallet_private_key
		FROM
			members
		WHERE
			member_did = ?
	`;

	const args = [
		member_did
	];

	let row;
	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	console.log(row.wallet_private_key);
	const buffer = Buffer.from(row.wallet_private_key.substring(2), 'hex');
	console.log(buffer);
	console.log(buffer.length);
	const privatekey = new Uint8Array(buffer);
	console.log(privatekey);

	return privatekey;

}

const getSellerAddress = async(seller_did, member_did) => {

	const sql = `
		SELECT
			remote_wallet_address
		FROM
			contacts
		WHERE
			local_member_did = ?
		AND
			remote_member_did = ?
	`;


	const args = [
		member_did,
		seller_did
	]
	
	console.log(args);

	let row
	try {
		row = await db.selectOne(sql, args);
	} catch(err) {
		throw err;
	}

	console.log(row);

	return row.remote_wallet_address;

}

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * [ Return to Sender ]
 * returnToSender
 */
router.post('/returnToSender', async function(req, res) {
	const METHOD = '/returnToSender';

	let start = Date.now();

	const { document_uuid } = req.body;
	const { member_did } = req.session.data;

	const USE_PRESENTATION = true;
	let errno, code;

	// 1.
	//
	const [ seller_did, err1 ] = await sub.getSellerDid(BUYER_STATUS, document_uuid, member_did);
	if(err1) {
		console.log("Error 1 status = 400 err="+err1);

		return res.status(400).json(err1);
	}

	// 2.
	//
	const [ seller_host, err2 ] = await sub.getSellerHost(CONTACTS, seller_did, member_did);
	if(err2) {
		console.log("Error 2 status = 400 err="+err2);
		return res
			.status(400)
			.json(err2);
	}

	// 3. buyer connect check
	//
	
/*
*	if(!USE_PRESENTATION) {
*/
		const [ code3, err3 ] = await to_seller.connect(seller_host, member_did, seller_did);

		if(code3 !== 200) {
			console.log("Error 3 code="+code3+":err="+err3);
			let msg;
			if(code3 == 500) {
				msg = {"err":"The destination node cannot be found."};
			} else {
				msg = {"err":err3};
			}
			return res
				.status(400)
				.json(msg);
		}
/*
*	}
*/

	// 4.
	// begin Transaction
	//
	const [ conn , _4 ]  = await tran.connection ();
	await tran.beginTransaction(conn);

	// 5.
	// Set BUYER_STATUS to 'return' with document_uuid as the key.
	//
	const [_5 , err5 ] = await tran.setReturn (conn, BUYER_STATUS, document_uuid , member_did);

	if (err5 ) {
		errno = 5;
		code = 400;
		return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err5, errno));
	}
	
	// 6.
	// Send a 'return' request to seller.
	//
   	// Get private keys to sign credential

	const [keyPair, err] = await getPrivateKeys(member_did);
	if(err) {
		throw err;
	}

	const url = `${seller_host}/api/presentations/available`
	console.log(url);
	const credential = await createReturnMessage(document_uuid,member_did, keyPair);
	const [ sent, err6 ] = await makePresentation(url, keyPair, credential);
	if(err6) {
		return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, 'code6', err6, 6));
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
		const [ code8, err8 ] = await to_seller.rollbackReturnToSent(seller_host, member_did, seller_did);

		if(code8 !== 200) {
			console.log("Error 8 code="+code8+":err="+err8);
			if(code8 == 500) {
				msg = {"err":"seller connect check:ECONNRESET"};
			} else {
				msg = {"err":err8};
			}
		}
		return res
			.status(400)
			.json(msg);

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
 * 2.
 * [ Confirm Invoice ]
 * confirm
 */
router.post('/confirm', async function(req, res) {

	const METHOD = '/confirm';

	let start = Date.now();

	const { document_uuid } = req.body;
	const { member_did } = req.session.data;

	const USE_PRESENTATION = true;
	let errno, code;

	// 1.
	//
	const [ seller_did, err1 ] = await sub.getSellerDid(BUYER_STATUS, document_uuid, member_did);
	if(err1) {
		console.log("Error 1 status = 400 err="+err1);

		return res
			.status(400)
			.json(err1);
	}

	// 2.
	//
	const [ seller_host, err2 ] = await sub.getSellerHost(CONTACTS, seller_did, member_did);

	if(err2) {
		console.log("Error 2 status = 400 err="+err2);
		return res
			.status(400)
			.json(err2);
	}

	//3. buyer connect check
	//
	
/*
*	if(!USE_PRESENTATION) {
*/
		const [ code3, err3 ] = await to_seller.connect(seller_host, member_did, seller_did);

		if(code3 !== 200) {
   			console.log("Error 3 code="+code3+":err="+err3);
   			const msg = code3 === 500 ? 
				{"err":"The destination node cannot be found"} :
				{"err":err3};

			return res
				.status(400)
				.json(msg);
		}
/*
*	}
*/


	// 4.
	// begin Transaction
	//
	const [ conn , _4 ]= await tran.connection ();
	await tran.beginTransaction(conn);

	// 5.
	//
	const [ _5, err5 ] = await tran.setConfirm (conn, BUYER_STATUS, document_uuid , member_did);

	if (err5 ) {
		errno = 5;
		code = 400;

		return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err5, errno));
	}

	// 6.
	//
   	// Get private keys to sign credential

	const [keyPair, err] = await getPrivateKeys(member_did);
	if(err) {
		throw err;
	}

	const url = `${seller_host}/api/presentations/available`
	console.log(url);
	const credential = await createConfirmMessage(document_uuid,member_did, keyPair);
	const [ sent, err6 ] = await makePresentation(url, keyPair, credential);
	if(err6) {
		return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, 'code6', err6, 6));
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
		const [ code8, err8 ] = await to_seller.rollbackConfirmToSent(seller_host, member_did, seller_did);

		if(code8 !== 200) {
			console.log("Error 8 code="+code8+":err="+err8);
			if(code8 == 500) {
				msg = {"err":"seller connect check:ECONNRESET"};
			} else {
				msg = {"err":err8};
			}
		}

		return res
			.status(400)
			.json(msg);
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
 * 3.
 * [ Unconfirm ]
 * unconfirm
 */
router.post('/unconfirm', async function(req, res) {

	const METHOD = '/unconfirm';

	let start = Date.now();

	const { document_uuid } = req.body;
	const { member_did } = req.session.data;

	let errno, code;

	// 1.
	//
	const [ seller_did, err1 ] = await sub.getSellerDid( BUYER_STATUS, document_uuid, member_did);

	if(err1) {
		console.log("Error 1 status = 400 err="+err1);

		return res
			.status(400)
			.json(err1);
	}

	// 2.
	//
	const [ seller_host, err2 ] = await sub.getSellerHost( CONTACTS, seller_did, member_did);

	if(err2) {
		console.log("Error 2 status = 400 err="+err2);

		return res
			.status(400)
			.json(err2);
	}

	// 3. buyer connect check
	//
	const [ code3 , err3 ] = await to_seller.connect( seller_host, member_did, seller_did);

	if( code3 !== 200) {
		console.log("Error 3 code="+code3+":err="+err3);
		let msg;
		if(code3 == 500) {
			msg = {"err":"The destination node cannot be found."};
		} else {
			msg = {"err":err3};
		}
		return res
			.status(400)
			.json(msg);
	}

	// 4
	// begin Transaction
	//
	const [ conn , _4 ] = await tran.connection ();
	await tran.beginTransaction(conn);

	// 5.
	//
	const [ _5, err5] = await tran.setUnconfirm (conn, BUYER_STATUS, document_uuid , member_did);

	if (err5 ) {
		errno = 54
		code = 400;
		return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err5, errno));
	}

	// 6.
	//
	const [ code6, err6 ] = await to_seller.unconfirm(seller_host, document_uuid, member_did);

	if(code6 !== 200) {
		errno = 6;
		return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code6, err6, errno));
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
		const [ code8, err8 ] = await to_seller.rollbackSentToConfirm(seller_host, member_did, seller_did);

		if(code8 !== 200) {
			console.log("Error 8 code="+code8+":err="+err8);
			if(code8 == 500) {
				msg = {"err":"seller connect check:ECONNRESET"};
			} else {
				msg = {"err":err8};
			}
		}
		return res
			.status(400)
			.json(msg);

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
 * 4.
 * [ Make Payment ]
 * makePayment
 */

router.post('/makePayment', async function(req, res) {

	const _METHOD = '/makePayment'
	const _NO = '030';

	let start = Date.now();
	const USE_PRESENTATION = true;

	const { document_uuid , gasLimit} = req.body;
	const { member_did } = req.session.data;

	let errno, code ;

	// 1.
	// getSellerDid
	//
	const [ seller_did, err1 ] = await sub.getSellerDid(BUYER_STATUS, document_uuid, member_did);

	if(err1) {
		console.log("Error 1 status = 400 err="+err1);

		return res
			.status(400)
			.json(err1);
	}

	// 2.
	// getSellerHost
	//
	const [ seller_host, err2 ] = await sub.getSellerHost(CONTACTS, seller_did, member_did);

	if(err2) {
		console.log("Error 2 status = 400 err="+err2);

		return res
			.status(400)
			.json(err2);
	}

	// 3.
	// connect
	
/*
*	if(!USE_PRESENTATION) {
*/

		const [ code3, err3 ] = await to_seller.connect(seller_host, member_did, seller_did);

		if(code3 !== 200) {
			console.log("Error 3 code="+code3+":err="+err3);
			let msg;
			if(code3 == 500) {
				msg = {"err":"The destination node cannot be found."};
			} else {
				msg = {"err":err3};
			}

			return res
				.status(400)
				.json(msg);
		}

/*
*	}
*/

	// 4.
	// Ask for remittance amount from document.
	//

	// 5.
	// paymentReservation
	
	if(!USE_PRESENTATION) {

		const [ code5, err5 ] = await to_seller.paymentReservation(seller_host, document_uuid, member_did);

		if(code5 !== 200) {
			console.log("Error 5 code="+code5+":err="+err5);
			let msg;
			if(code5 == 500) {
				msg = {"err":"seller connect check:ECONNRESET"};
			} else {
				msg = {"err":err5};
			}
			return res
				.status(400)
				.json(msg);
		}

	}


	// 6.
	// get value from Document
	//
	const [ document , err6 ] = await sub.getDocument(BUYER_DOCUMENT, document_uuid);

	if(err6) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_did);

		console.log("error 6: getDocumen");

		return res
			.status(400)
			.json(err6);
	}

	// 7.
	//
	let doc;
	try {
		doc = JSON.parse( document.document_json);
	} catch (err7) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_did);

		console.log("error JSON.parse ="+doc);
		for (let key in doc){
			console.log(key +":"+ doc[key]);
		}

		return res
			.status(400)
			.json(err7);
	}

	// 8.
	// contract_address 
	//

	const { wallet_address } = req.session.data;
	const contract_address = wallet_address;

	//console.log("contract_address ="+contract_address)

	// 9.
	// Balance before the start of payment
	// Ask for the balance of ETH
	const [ balanceWei_1, err9 ] = await  eth.getBalance(web3, contract_address) ;

	if( err9 ) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_did);
		console.log("error 9: getBalance");

		return res
			.status(400)
			.json(err9);
	}


	// 10.
	// Get seller account
	
	const to_address = await getSellerAddress(seller_did, member_did);
	
	/*
	const [status10, data10] = await to_seller.getAccountOfSellerWallet(seller_host, seller_did, member_did) ;

	if(status10 != 200) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_did);

		console.log("Error 10 status = 400 err="+data10);

		return res
			.status(400)
			.json(data10);
	}

	const msg = (data10.msg);
	const to_address = msg.account;
	*/

	console.log("to_address="+to_address);


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
	

	// const PrivateKey = process.env.PRIVATE_KEY;
	const PrivateKey = await getPrivateKey(member_did);

	// 14. 
	// sendTransaction
	//

	const [ receipt14, err14 ] = await util.sendSignedTransaction (web3, contract_address, PrivateKey, to_address, gasLimit, makePaymantTo, ipfs_cid_hex)

	if ( err14) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_did);

		let rt = {err:"Error : sendSignedTransaction failed."};

		return res
			.status(400)
			.json(rt);
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
	const [ _16, err16 ] = await tran.setMakePayment_status (conn, BUYER_STATUS, document_uuid , member_did);

	if (err16 ) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_did);

		errno = 16;
		code = 400;
		return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err16, errno));
	}

	// 17.
	// setMakePayment_document
	//
	const [ _17, err17 ] = await tran.setMakePayment_document (conn, BUYER_DOCUMENT, document_uuid , hash);

	if (err17 ) {
		await util.cancelPaymentReservation(seller_host, document_uuid, member_did);

		errno = 17;
		code = 400;
		return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, code, err17, errno));
	}


	// 18.
	// makePayment
	//
   	// Get private keys to sign credential

	const [keyPair, err] = await getPrivateKeys(member_did);
	if(err) {
		throw err;
	}

	const url = `${seller_host}/api/presentations/available`
	console.log(url);
	const credential = await createPaymentMessage(document_uuid,member_did, keyPair, hash);
	const [ sent, err18 ] = await makePresentation(url, keyPair, credential);
	if(err18) {
		return res
			.status(400)
			.json(tran.rollbackAndReturn(conn, 'code18', err18, 18));
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
		const [ code20, err20 ] = await to_seller.rollbackPaidToConfirm(seller_host, member_did, seller_did);

		if(code20 !== 200) {
			console.log("Error 20 code="+code20+":err="+err20);
			if(code20 == 500) {
				msg = {"err":"seller connect check:ECONNRESET"};
			} else {
				msg = {"err":err20};
			}
		}

		return res
			.status(400)
			.json(msg);
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


	// 23.
	// ETH transaction result
	//
	const [ transaction_result, err23 ] = await  eth.getTransaction(web3, hash) ;

	if( err23) {
			console.log("err23"+err23);
	}
   	console.log(transaction_result);


	// IP ADDRESS OF IPFS SERVER
	const ipfs_address = process.env.IPFS_ADDRESS;

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

