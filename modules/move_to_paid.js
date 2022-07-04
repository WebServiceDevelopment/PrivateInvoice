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

const sub					   = require("../routes/invoice_sub.js");
const tran					  = require("../routes/invoice_sub_transaction.js");
const eth					   = require("../routes/web3_eth.js");

//  web3.js
const web3					  = eth.getWeb3();

// Table Name
const SELLER_STATUS			 = "seller_status";
const SELLER_DOCUMENT		   = "seller_document";
const CONTACTS				  = "contacts";

const moveToPaid = async (document_uuid, buyer_uuid, hash) => {

	// 1.
	// Check the transaction receipt.
	// Happy path just okay.
	// getTransactionReciept
	//
	const [ receipt, err1 ] = await eth.getTransactionReceipt(web3, hash) ;

	if(err1) {
		let msg = "No transaction reciept was found."
		console.log("error :"+msg);
		let err = {err:msg}
		return res.status(400).json(err);
	}

	console.log(receipt);

	// 2.
	//
	const [ result, err2 ] = await eth.getTransaction(web3, hash) ;

	if(err2) {
		let msg = "No transaction was found."
		console.log("error :"+msg);
		let err = {err:msg}
		return res.status(400).json(err);
	}

	// 3.
	// getDocument
	// And get total from document_json.
	// And convert units to wei.
	//
	const [ document, _3 ] = await sub.getDocument(SELLER_DOCUMENT, document_uuid);
	const document_json = JSON.parse(document.document_json);
	const totalPaymentDue = document_json.credentialSubject.totalPaymentDue;

	console.log("totalPaymentDue="+totalPaymentDue.price);

	let wk = '0';
	if( totalPaymentDue != null && totalPaymentDue.price != null) {
/*
		if( totalPaymentDue.price.indexOf(" ") !== -1) {
			wk =  totalPaymentDue.price.split(" ")[0]
			wk = wk.replace(/,/g,'');
		}
*/
		wk = totalPaymentDue.price;
	}
	const total = web3.utils.toWei(wk , 'Gwei');

	// 4.
	// Does transaction value and invoice total match?
	//

	if( result != null) {
		console.log(result.value +":"+total);

		if( result.value !=  total) {
		let msg = "Transaction value and invoice total do not match."
			console.log("error :"+msg);
			let err = {err:msg}
			return res.status(400).json(err);
		}
	} else {
		console.log("4:"+result)
	}

	// 5.
	// begin Transaction
	//
	const [ conn , _5 ] = await tran.connection ();
	await tran.beginTransaction(conn);

	// 6.
	//
	const [ _6, err6] = await tran.setMakePayment_status(conn, SELLER_STATUS, document_uuid, buyer_uuid);

	if(err6) {
		console.log(err6);
		let code = 400;
		let errno = 6;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err6, errno));
	}

	// 7.
	//
	const [_7, err7] = await tran.setMakePayment_document(conn, SELLER_DOCUMENT, document_uuid, hash);

	if(err7) {
		console.log(err7);
		let code = 400;
		let errno = 7;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err7, errno));
	}

	// 8.
	// commit
	//
	const [ _8, err8 ] = await tran.commit(conn);

	if (err8) {
		console.log(err8);
		let errno = 8;
		let code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err8, errno));
	}

	// 9.
	//
	conn.end();


}
