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
const eth						= require("../modules/web3_eth.js");
const to_seller                 = require("../modules/buyer_to_seller.js");
const wallet_sub                = require("../modules/wallet_sub.js");

// Import Router

const express					= require('express');
const router					= express.Router();
module.exports					= router;

//  web3,js
const web3						= eth.getWeb3();

// Libraries
const currency                  = require('currency.js');

// Database

const config                    = require('../config.json');

const BUYER_STATUS              = "buyer_status";
const BUYER_DOCUMENT			= "buyer_document";
const BUYER_DOCUMENT_ARCHIVE	= "buyer_document_archive";

const SELLER_DOCUMENT			= "seller_document";
const SELLER_DOCUMENT_ARCHIVE	= "seller_document_archive";

const CONTACTS                  = "contacts";

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * getReceiptInResentActivity
 */
router.post('/getReceiptInResentActivity', async function(req, res) {

	const hash = req.body.settlement_hash;

	// 1.
	//
	const [ receipt, err1 ] = await  eth.getTransactionReceipt(web3, hash) ;

	if(err1) {
		console.log("error balanceWei");
		res.json({
			err : err1,
			msg : null
		});
		return;
	}

	res.json({
		err : 0,
		msg : {
			"receipt" 	: receipt,
		}
	});

	return;

});

/*
 * 2.
 * getResentActivityOfWallet
 */
router.post('/getResentActivityOfWallet', async function(req, res) {

	const LIST_MAX = 20;

	let len1, len2, len3, len4, len5, len6;
	let Activity = [];
	let Activity1 = [];
	let Activity2 = [];
	// 1.
	// 
	const a1 = await wallet_sub.getRecentActivity(SELLER_DOCUMENT, LIST_MAX);
	const a2 = await wallet_sub.getRecentActivity(SELLER_DOCUMENT_ARCHIVE, LIST_MAX);
	const a3 = await wallet_sub.getRecentActivity(BUYER_DOCUMENT, LIST_MAX);
	const a4 = await wallet_sub.getRecentActivity(BUYER_DOCUMENT_ARCHIVE, LIST_MAX);

	// 2.
	//
	let json;

	len1 = a1.length;
	for(let i =0; i<len1; i++){
		a1[i].type = "Sale";
		json = JSON.parse(a1[i].document_json);
		a1[i].amount = "+"+json.credentialSubject.totalPaymentDue.price +" "+ json.credentialSubject.totalPaymentDue.priceCurrency;
	}

	len2 = a2.length;
	for(let i =0; i<len2; i++){
		a2[i].type = "Sale";
		json = JSON.parse(a2[i].document_json);
		a2[i].amount = "+"+json.credentialSubject.totalPaymentDue.price +" "+ json.credentialSubject.totalPaymentDue.priceCurrency;
	}

	// 3.
	//
	let k = 0;
	for( let i=0, j=0 ; i< len1 || j < len2; ) {
		if(i == len1) {
			for(;j < len2;j++,k++) {
				Activity1[k] = {...a2[j]};
			}
			break;
		}
		if(j == len2) {
			for(;i < len1;i++,k++) {
				Activity1[k] = {...a1[i]};
			}
			break;
		}
		if(a1[i].settlement_time >= a2[j].settlement_time) {
				Activity1[k] = {...a1[i]};
				i++;
		} else {
				Activity1[k] = {...a2[j]};
				j++;
		}

	}
	len5 = k;


	// 4.
	//
	len3 = a3.length;
	for(let i =0; i<len3; i++){
		a3[i].type = "Purchase";
		json = JSON.parse(a3[i].document_json);
		a3[i].amount = "-"+json.credentialSubject.totalPaymentDue.price +" "+ json.credentialSubject.totalPaymentDue.priceCurrency;
	}

	len4 = a4.length;
	for(let i =0; i<len4; i++){
		a4[i].type = "Purchase";
		json = JSON.parse(a4[i].document_json);
		a4[i].amount = "-"+json.credentialSubject.totalPaymentDue.price +" "+ json.credentialSubject.totalPaymentDue.priceCurrency;
	}

	// 5.
	//
	k = 0;
	for( let i=0, j=0 ; i< len3 || j < len4; ) {
		if(i == len3) {
			for(;j < len4;j++,k++) {
				Activity2[k] = {...a4[j]};
			}
			break;
		}
		if(j == len4) {
			for(;i < len3;i++,k++) {
				Activity2[k] = {...a3[i]};
			}
			break;
		}
		if(a3[i].settlement_time >= a4[j].settlement_time) {
				Activity2[k] = {...a3[i]};
				i++;
		} else {
				Activity2[k] = {...a4[j]};
				j++;
		}
		k++;

	}
	len6 = k;


	// 6.
	//
	k = 0;
	for( let i=0, j=0 ; i< len5 || j < len6; ) {
		if(i == len5) {
			for(;j < len6 &&  k < LIST_MAX;j++,k++) {
				Activity[k] = {...Activity2[j]};
			}
			break;
		}
		if(j == len6) {
			for(;i < len5 && k < LIST_MAX ;i++,k++) {
				Activity[k] = {...Activity1[i]};
			}
			break;
		}
		if(Activity1[i].settlement_time >= Activity2[j].settlement_time) {
				Activity[k] = {...Activity1[i]};
				i++;
		} else {
				Activity[k] = {...Activity2[j]};
				j++;
		}

		k++;
		if( k >= LIST_MAX) {
			break;
		}
	}

	res.json({
		err : 0,
		msg : {
			"activity" : Activity
		}
	});

	return;

});

/*
 * 3.
 * getWalletInfo
 */



router.post('/getWalletInfo', async function(req, res) {

	const { wallet_address, member_uuid } = req.session.data;
	
	// 1.
	// 
	
	//console.log("NetworkType="+await web3.eth.net.getNetworkType())
	//console.log("Chain id="+await web3.eth.getChainId())

	const type = await web3.eth.net.getNetworkType();
	const id = await web3.eth.getChainId();
	const account = wallet_address;

    // 2.
    // getBalance
	
	const from_account = wallet_address;
    const [ balanceWei, err2 ] = await  eth.getBalance(web3, from_account) ;

    if(err2) {
        console.log("error 2: balanceWei");
        res.json({
            err : err2,
            msg : null
        });
        return;
    }

	//console.log("balanceWei ="+balanceWei)

	let balanceGwei = web3.utils.fromWei(balanceWei,'Gwei');
	//console.log("balanceGwei ="+balanceGwei)

	res.json({
		err : 0,
		msg : {
			"balanceGwei" : balanceGwei,
			"accountAddress" : account,
			"networkType" : type,
			"chainId" : id
		}
	});

	return;

});

/*
 * 4.
 * [ Make Paymant]
 * getCurrentBalanceOfBuyer
 */
router.post('/getCurrentBalanceOfBuyer', async function(req, res) {

	const METHOD = '/getCurrentBalanceOfBuyer'

	const { document_uuid } = req.body;
	const { member_uuid } = req.session.data;

    // 1.
    // getSellerUuid
    //
    const [ seller_uuid, err1 ] = await sub.getSellerUuid(BUYER_STATUS, document_uuid, member_uuid);
    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).end(err1);
    }

    // 2.
    // getSellerHost
    //
    const [ seller_host, err2 ] = await sub.getSellerHost(CONTACTS, seller_uuid, member_uuid);
    if(err2) {
        console.log("Error 2 status = 400 err="+err2);
        return res.status(400).end(err2);
    }

	// 3.
	// getDocument
	//
	const [ document , err3 ] = await sub.getDocument(BUYER_DOCUMENT, document_uuid);

	if(err3) {
		console.log("error getDocumen");
		res.json({
			err : err3,
			msg : null
		});
		return;
	}

	// 4.
	//
	let doc;
	try {
		doc = JSON.parse( document.document_json);
	} catch (err4) {
		console.log("error JSON.parse ="+doc);
		for (let key in doc){
			console.log(key +":"+ doc[key]);
		}
		res.json({
			err : err4,
			msg : null
		});
		return;
	}


	// 5.
	// from_accoun
	//

	const from_account = process.env.ACCOUNT;
	//console.log("from_account ="+from_account)

	// 6.
	// code
	//
	const [code , err6 ] = await eth.getCode(web3, from_account );

	if(code == null) {
		console.log("Error 6 status = 400 err="+err6);

        return res.status(400).end(err6);
	}
	//console.log("code="+code);


	// 7.
	// Get seller account
	//
	const [status7, data7] = await to_seller.getAccountOfSellerWallet(seller_host, seller_uuid, member_uuid) ;

	if(status7 != 200) {
		console.log("Error 7 status = 400 err="+data7);

        return res.status(400).end(data7);
	}

	const msg = (data7.msg);

	const to_account = msg.account;

	//console.log("to_account="+to_account)

	// 8.
	// callObject
	//

	let callObject = {
		to: to_account,
		code: code
	}

	//console.log("from_account="+from_account);

	// 9.
	// getBalance
	//
	const [ balanceWei, err9 ] = await  eth.getBalance(web3, from_account) ;

	if(err9) {
		console.log("error 9: balanceWei "+err9);
		res.json({
			err : err9,
			msg : null
		});
		return;
	}


	// 10.
	// getGasPrice
	//
	const [ gasPrice, err10 ] = await  eth.getGasPrice(web3) ;

	if(err10) {
		console.log("error 10: gasPrice,");
		res.json({
			err : err10,
			msg : null
		});
		return;
	}

	// 11.
	// estimateGas
	// 

	const [ estimateGas, err11 ] = await  eth.estimateGas(web3,callObject ) ;
	if(err11) {
		console.log("error 11:estimateGas,");
		res.json({
			err : err11,
			msg : null
		});
		return;
	}

/*
*	const blockCount = 4;
*	const newestBlock = "latest";
*	//const rewardPercentiles = [25, 50, 75];
*	const rewardPercentiles = ["25", "50", "75"];
*
*	const [ estimateGas, err11 ] = await  eth.getFeeHistory(web3, blockCount, newestBlock, rewardPercentiles ) ;
*	if(err11) {
*		console.log("error 11:estimateGas,"+err11);
*		res.json({
*			err : err11,
*			msg : null
*		});
*		return;
*	}
*
*	function formatFeeHistory(result, includePending) {
*  let blockNum = result.oldestBlock;
*  let index = 0;
*  const blocks = [];
*  while (blockNum < result.oldestBlock + historicalBlocks) {
*    blocks.push({
*      number: blockNum,
*      baseFeePerGas: Number(result.baseFeePerGas[index]),
*      gasUsedRatio: Number(result.gasUsedRatio[index]),
*      priorityFeePerGas: result.reward[index].map(x => Number(x)),
*    });
*    blockNum += 1;
*    index += 1;
*  }
*  if (includePending) {
*    blocks.push({
*      number: "pending",
*      baseFeePerGas: Number(result.baseFeePerGas[historicalBlocks]),
*      gasUsedRatio: NaN,
*      priorityFeePerGas: [],
*    });
*  }
*  return blocks;
*}
*
*const blocks = formatFeeHistory(feeHistory, false);
*console.log(blocks);
*/


	//console.log("estimateGas= "+estimateGas);

	// 12.
	// Add the integer part and the decimal point separatelya.
	//
	let balanceGwei = web3.utils.fromWei(balanceWei, 'Gwei');
	let gasPriceGwei = web3.utils.fromWei(gasPrice , 'Gwei');
	let gasGwei = estimateGas * gasPriceGwei;

	let payment = doc.credentialSubject.totalPaymentDue.price.replace(/,/g,"");

	let makePaymantTo = parseFloat(payment);
	let transferCost  = 0;

	//console.log (balanceGwei+":"+ makePaymantTo +":"+ transferCost +":"+ gasGwei);
	let endBalance = await _calc_decimalPart (balanceGwei, makePaymantTo , transferCost , gasGwei);


	// 13.
	// create transaction_result
	//
	const transaction_result = {
		"balanceGwei" 	: currency(balanceGwei,config.CURRENCY).format(true) ,
		"makePaymantTo" : currency(makePaymantTo,config.CURRENCY).format(true),
		"transferCost" 	: currency(transferCost,config.CURRENCY).format(true),
		"gas" 			: currency(gasGwei,config.CURRENCY).format(true),
		"endBalance" 	: currency(endBalance,config.CURRENCY).format(true)
	}


	res.json({
		err : 0,
		msg : transaction_result,
	});

	//console.log("After:"+ balanceGwei+"Gwei");

	return;

	function _calc_decimalPart (balanceGwei, makePaymantTo , transferCost , gasGwei) {


		let integerPart = parseInt(balanceGwei) - parseInt(gasGwei) - parseInt(makePaymantTo) - parseInt(transferCost);
		//console.log("1 integerPart="+integerPart);

		let decimalPart = _decimalPart(balanceGwei) - _decimalPart(gasGwei) - _decimalPart(makePaymantTo) - _decimalPart(transferCost);

		//console.log("2 decimalPart="+decimalPart);

		if( decimalPart == 0) {
			return integerPart;
		} else if( decimalPart < 0 ) {
			decimalPart = -1 * decimalPart;
			decimalPart = web3.utils.fromWei(decimalPart.toString() ,'Gwei');

			return (integerPart-1) + (1-decimalPart).toString().substr(1);
		} else {
			decimalPart = web3.utils.fromWei(decimalPart.toString() ,'Gwei');

			return integerPart + decimalPart.toString().substr(1);
		}		

	}

	function _decimalPart(num){
		if( num == 0 || num == null || num == '') {
			return 0;
		}
		let numStr = num+'';
		let dotIdx  = numStr.indexOf(".");
		let result  = "0." + (dotIdx > -1 ? numStr.substring(dotIdx + 1) : "0");

		if( num = '0.0') {
			return 0;
		}
		//console.log("result = "+result);

		let res;
		try {
			res = web3.utils.toWei(result , 'Gwei');
		} catch(e) {
			res = 0;
		}

		//console.log("res = "+res+":num = "+num);

		return  (res);
	}

});

/*
 * 5.
 * [ View Transaction Receipt ]
 */
router.post('/getTransactionReceipt', async function(req, res) {

	const METHOD = '/getTransactionReceipt'

	const { document_uuid , role, archive} = req.body;

	let table;

	// 1.
	//

	switch(role){
	case 'buyer':
		switch(archive){
		case 0:
			table = BUYER_DOCUMENT;
		break;
		case 1:
			table = BUYER_DOCUMENT_ARCHIVE;
		break;
		default:
			res.json({
				err : "Invalid argument.",
				msg : null
			});
			return ;
		}
	break;
	case 'seller':
		switch(archive){
		case 0:
			table = SELLER_DOCUMENT;
		break;
		case 1:
			table = SELLER_DOCUMENT_ARCHIVE;
		break;
		default:
			res.json({
				err : "Invalid argument.",
				msg : null
			});
			return ;
		}
	break;
	default:
		res.json({
			err : "Invalid argument.",
			msg : null
		});
		return ;
	}

	// 2.
	//
	const [ document , err2 ] = await sub.getDocument(table, document_uuid);

	if(err2) {
		console.log("error getDocumen");
		res.json({
			err : err2,
			msg : null
		});
		return;
	}

	if(document == null ) {
		console.log("Documen is null");
		res.json({
			err : "Not found.",
			msg : null
		});
		return;
	}

	const hash = document.settlement_hash;

	// 3.
	//
	const [ receipt, err3 ] = await  eth.getTransactionReceipt(web3, hash) ;

	if(err3) {
		console.log("error balanceWei");
		res.json({
			err : err3,
			msg : null
		});
		return;
	}

	res.json({
		err : 0,
		msg : {
			"receipt" 	: receipt,
		}
	});

	return;

});

/*
 * 6.
 * [ JSON DATA ]
 * getIPFScidByTransactionHash
 */
router.post('/getIPFScidByTransactionHash', async function(req, res) {

	const METHOD = '/getIPFScidByTransactionHash'

	const { transactionHash } = req.body;


	// 1.
	// getTransaction
	//
	const [ result, err1 ] = await  eth.getTransaction(web3, transactionHash) ;

	if(err1) {
		console.log("error balanceWei");
		res.json({
			err : err1,
			msg : null
		});
		return;
	}

	// 2.
	// hexToAscii
	//
	const ipfs_cid = web3.utils.hexToAscii(result.input);

	// 3.
	// ipfs_address
	//
	const ipfs_address = process.env.IPFS_ADDRESS;

	res.json({
		err : 0,
		msg : {
			"ipfs_cid" 	: ipfs_cid,
			"ipfs_address" : ipfs_address
		}
	});

	return;

});

