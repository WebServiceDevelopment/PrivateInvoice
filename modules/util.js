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

//
const to_seller					= require("../modules/buyer_to_seller.js");

const Tx                        = require('ethereumjs-tx').Transaction;

// Database Libraries

// Exports 
module.exports = {
	toReturnError				: _toReturnError,
	cancelPaymentReservation	: _cancelPaymentReservation,
	sendSignedTransaction		: _sendSignedTransaction,
}

// Constant

const GAS_LIMIT = 210000;


//------------------------------- export modules ------------------------------

/*
 * toReturnError
 */
function _toReturnError(err , code, method_no) {

	let ERR_KEYWORD = "Error: Returned error:";
	let error = err.toString();

	let rt ={}

	if(error.indexOf( ERR_KEYWORD ) !== -1) {
		rt.err = error.replace( ERR_KEYWORD,"");
   	}
	rt.code = method_no + code;

	return rt;
}

/*
 * cancelPaymentReservation
 */
async function _cancelPaymentReservation(seller_host, document_uuid, member_did){

	const [ _r, _e ] = await to_seller.cancelPaymentReservation(seller_host, document_uuid, member_did);
	if( _e == null) {
		console.log("cancelPaymentReservation id success.");
	}

	return [ _r, _e ];
}

/*
 * sendSignedTransaction
 */

async function _sendSignedTransaction (web3, buyerAddr, buyerPrivateKey, sellerAddr, gasLimit, value, data) {

    const ROPSTEN_SWITCH_FLAG		= 0;

	const TIMEOUT					= 5000;
    const GANACHE_DEFAULT_CHAINID   = 1337;
    const ROPSTEN_CHAINID 			= 3;

	const DEBUG						= 1;

    const { eth }					= web3;


	// 1.
    // gasLimit to hex.
    //
    let _gasLimit;
    if( typeof (gasLimit) === 'string') {
		if(gasLimit.indexOf(",") !== -1) {
			_gasLimit = gasLimit.replace(/,/g,",");
		} else {
			_gasLimit = gasLimit;
		}
		try {
        	_gasLimit = parseInt(_gasLimit);
		} catch (e) {
        	_gasLimit = GAS_LIMIT;
		}
    }

    let gasLimit_hex;

    if(typeof (_gasLimit) === 'number' && _gasLimit > 0 ) {
    } else {
        gasLimit_hex = GAS_LIMIT;
    }
    gasLimit_hex = web3.utils.toHex(_gasLimit);

	if(DEBUG) {
		console.log("gasLimit="+gasLimit+":"+gasLimit_hex)
	}

	// 2.
	// nonce 
	//
    const count = await eth.getTransactionCount(buyerAddr);

	if(DEBUG) {
    	console.log("count="+count);
	}
    const nonce = web3.utils.toHex(count);

	// 3. .getGasPrice
    const gasPrice = await eth.getGasPrice()

	if(DEBUG) {
    	console.log("gasPrice"+gasPrice)
	}

	// 4.
	// getBalance
	//
	if(DEBUG) {

	    const sellerBalanceStart = await eth.getBalance(sellerAddr);
		const buyerBalanceStart = await eth.getBalance(buyerAddr);

		console.log("Before Balance");
		console.log("seller = "+sellerBalanceStart);
		console.log("buyer  = "+buyerBalanceStart);
	}

	// 5.
	// transactionObject
	//

    let chainId;

    if( ROPSTEN_SWITCH_FLAG ) {
    	chainId = ROPSTEN_CHAINID;
	} else {
    	chainId = web3.utils.toHex(GANACHE_DEFAULT_CHAINID);
	}


    const transactionObject = {
        nonce   : nonce,
        chainId : chainId,
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: gasLimit_hex,
        to		: sellerAddr,
        value   : value,
        data    : data,
        timeout : web3.utils.toHex(TIMEOUT)
    }

	// 6.
	// privateKeyBUF
	//
    const privateKeyBUF = Buffer.from(buyerPrivateKey, 'hex');

	// 7.
	// Tx
	//
    var  tx;
    if( ROPSTEN_SWITCH_FLAG ) {
    	tx = new Tx ( transactionObject , { chain: 'ropsten' });
	} else {
    	tx = new Tx ( transactionObject );
	}

    tx.sign(privateKeyBUF);

	// 8.
	// serializedTx
	// serializedTx_hex
    const serializedTx = tx.serialize();
    const serializedTx_hex = '0x' + serializedTx.toString('hex');

	// 9.
	// sendSignedTransaction
	//
	
    let transaction;
	try {
    	transaction = await eth.sendSignedTransaction(serializedTx_hex);
    	console.log(transaction);
	} catch (err) {
		console.log(err);
    	return [ null, err];
	}

	// 10.
	// getBalance
	//
	if(DEBUG) {

		const sellerBalanceEnd = await eth.getBalance(sellerAddr);
		const buyerBalanceEnd = await eth.getBalance(buyerAddr);

		console.log("After Balance");
		console.log("seller = "+sellerBalanceEnd);
		console.log("buyer  = "+buyerBalanceEnd);
	}

    return [ transaction, null];
}
