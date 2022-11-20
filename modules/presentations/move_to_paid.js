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
const tran						= require("./invoice_sub_transaction.js");
const eth						= require("./web3_eth.js");

//  web3.js
const web3						= eth.getWeb3();

// Table Name
const SELLER_STATUS			    = "seller_status";
const SELLER_DOCUMENT		    = "seller_document";

const moveToPaid = async (document_uuid, buyer_did, hash) => {

	const [ _, err] = await sub.setPaymentReservation(SELLER_STATUS, document_uuid, buyer_did);

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
		return 1;
	}

	console.log(receipt);

	// 2.
	//
	const [ result, err2 ] = await eth.getTransaction(web3, hash) ;

	if(err2) {
		let msg = "No transaction was found."
		console.log("error :"+msg);
		let err = {err:msg}
		return 2;
	}

	// 3.
	// getDocument
	// And get total from document_json.
	// And convert units to wei.
	//
	const [ document, _3 ] = await sub.getDocument(SELLER_DOCUMENT, document_uuid);
	const document_json = JSON.parse(document.document_json);
	const totalPaymentDue = document_json.credentialSubject.totalPaymentDue;

	console.log("moveToPaid : totalPaymentDue="+totalPaymentDue.price);

	// 4.
	let wk = '0';
	if( totalPaymentDue != null && totalPaymentDue.price != null) {
		wk = totalPaymentDue.price;
		wk = wk.replace(/,/g, "");
	}

	let total;
	try {
		total = web3.utils.toWei(wk , 'Gwei');
	} catch (err4) {
		console.log(err4);
		return 4;
	}

	// 5.
	// Does transaction value and invoice total match?
	//

	if( result != null) {
		console.log(result.value +":"+total);

		if( result.value !=  total) {
		let msg = "Transaction value and invoice total do not match."
			console.log("error :"+msg);
			let err = {err:msg}
			return 5;
		}
	} else {
		console.log("5:"+result)
	}

	// 6.
	// begin Transaction
	//
	const [ conn , _6 ] = await tran.connection ();
	await tran.beginTransaction(conn);

	// 7.
	//
	const [ _7, err7] = await tran.setMakePayment_status(conn, SELLER_STATUS, document_uuid, buyer_did);

	if(err7) {
		console.log(err7);
		let code = 400;
		let errno = 7;
		tran.rollbackAndReturn(conn, code, err7, errno);
		return 7;
	}

	// 8.
	//
	const [_8, err8] = await tran.setMakePayment_document(conn, SELLER_DOCUMENT, document_uuid, hash);

	if(err8) {
		console.log(err8);
		let code = 400;
		let errno = 8;
		tran.rollbackAndReturn(conn, code, err8, errno);
		return 8;
	}

	// 9.
	// commit
	//
	const [ _9, err9 ] = await tran.commit(conn);

	if (err9) {
		console.log(err9);
		let errno = 9;
		let code = 400;
		tran.rollbackAndReturn(conn, code, err9, errno);
		return 9;
	}

	// 10.
	//
	conn.end();
	return null;

}

module.exports = {
	moveToPaid
}
