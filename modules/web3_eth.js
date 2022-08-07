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

// Database

const config                    = require('../config.json');

// Database Libraries

// web3.js
const Web3						= require('web3');
const web3						= new Web3();

const URL						= process.env.GANACHE_ADDRESS;

web3.setProvider(new web3.providers.HttpProvider(URL));
web3.eth.defaultAccount			= process.env.ACCOUNT;


// Exports 
module.exports = {
	getBalance 				: _getBalance,
	sendTransaction 		: _sendTransaction,
	sendSignedTransaction 	: _sendSignedTransaction,
	getTransaction			: _getTransaction,
	getGasPrice				: _getGasPrice,
	estimateGas				: _estimateGas,
	getCode					: _getCode,
	getTransactionCount		: _getTransactionCount,
	getTransactionReceipt	: _getTransactionReceipt,
	getWeb3					: _getWeb3,
	getFeeHistory 			: _getFeeHistory,
}

//------------------------------- export modules -------------------------------

/*
 * getWeb3
 */
function _getWeb3() {
	return web3;
}

/*
 * getBalance
 */
async function _getBalance(web3, coinbase) {

    try {
        const balanceWei = await __getBalance(web3, coinbase) ;

    	return [balanceWei, null];
    } catch (err) {
        return [false, err];
    }

    function __getBalance(web3, coinbase) {

        return new Promise((resolve, reject) => {
            web3.eth.getBalance(coinbase, (error, balanceWei) => {

                if( error ) {
                    return reject(error);
                }
                resolve (balanceWei);
            });
        });
    }

}

/*
 * sendTransaction
 */
async function _sendTransaction(web3, transactionObject) {

    try {
        const hash = await __sendTransaction(web3, transactionObject) ;

    	return [hash, null];
    } catch (err) {
        return [false, err];
    }

    function __sendTransaction(web3, transactionObject) {

        return new Promise((resolve, reject) => {
            web3.eth.sendTransaction(transactionObject, (error, hash) => {

                if( error ) {
                    return reject(error);
                }
                resolve (hash);
            });
        });
    }

}

/*
 * sendSignedTransaction
 */
async function _sendSignedTransaction(web3, transactionObject) {

    try {
        const hash = await __sendSignedTransaction(web3, transactionObject) ;

    	return [hash, null];
    } catch (err) {
            return [false, err];
    }

    function __sendSignedTransaction(web3, transactionObject) {

        return new Promise((resolve, reject) => {
            web3.eth.sendSignedTransaction(transactionObject, (error, hash) => {

                if( error ) {
                    return reject(error);
                }
                resolve (hash);
            });
        });
    }
}

/*
 * getTransaction
 */
async function _getTransaction(web3, hash) {

    try {
        const result = await __getTransaction(web3, hash) ;

    	return [result, null];
    } catch (err) {
        return [false, err];
    }

    function __getTransaction(web3, hash) {

        return new Promise((resolve, reject) => {
            web3.eth.getTransaction(hash, (error, result) => {

                if( error ) {
                    return reject(error);
                }
                resolve (result);
            });
        });
    }

}

/*
 * getGasPrice
 */
async function _getGasPrice(web3 ) {

    try {
        const gasPrice = await __getGasPrice(web3) ;

    	return [gasPrice, null];
    } catch (err) {
        return [false, err];
    }

    function __getGasPrice(web3) {

        return new Promise((resolve, reject) => {
            web3.eth.getGasPrice( (error, gasPrice) => {

                if( error ) {
                    return reject(error);
                }
                resolve (gasPrice);
            });
        });
    }

}

/*
 * estimateGas
 */
async function _estimateGas(web3 , callObject) {

    try {
        const estimateGas = await __estimateGas(web3, callObject) ;

    	return [estimateGas, null];
    } catch (err) {
        return [false, err];
    }

    function __estimateGas(web3, callObject) {

        return new Promise((resolve, reject) => {
            web3.eth.estimateGas(callObject, (error, estimateGas) => {

                if( error ) {
                    return reject(error);
                }
                resolve (estimateGas);
            });
        });
    }

}

/*
 * getCode
 */
async function _getCode(web3 , account) {

    try {
        const code = await __getCode(web3, account) ;

    	return [code, null];
    } catch (err) {
        return [false, err];
    }

    function __getCode(web3, account) {

        return new Promise((resolve, reject) => {
            web3.eth.getCode(account, (error, code) => {

                if( error ) {
                    return reject(error);
                }
                resolve (code);
            });
        });
    }

}

/*
 * getTransactionCount
 */
async function _getTransactionCount(web3 , address) {

    try {
        const count = await __getTransactionCount(web3, address) ;

    	return [count, null];
    } catch (err) {
        return [false, err];
    }

    function __getTransactionCount(web3, address) {

        return new Promise((resolve, reject) => {
            web3.eth.getTransactionCount(address, (error, count) => {

                if( error ) {
                    return reject(error);
                }
                resolve (count);
            });
        });
    }

}

/*
 * getTransactionReceipt
 */
async function _getTransactionReceipt(web3 , hash) {

    try {
        const receipt = await __getTransactionReceipt(web3) ;

    	return [receipt, null];
    } catch (err) {
        return [false, err];
    }

    function __getTransactionReceipt(web3) {

        return new Promise((resolve, reject) => {
            web3.eth.getTransactionReceipt(hash, (error, receipt) => {

                if( error ) {
                    return reject(error);
                }
                resolve (receipt);
            });
        });
    }

}

/*
 * getFeeHistory
 */
async function _getFeeHistory(web3, blockCount, newestBlock, rewardPercentiles ) {

    try {
        const fee = await __getFeeHistory(web3, blockCount, newestBlock, rewardPercentiles) ;

    	return [fee, null];
    } catch (err) {
        return [false, err];
    }

    function __getFeeHistory(web3, blockCount, newestBlock, rewardPercentiles) {

        return new Promise((resolve, reject) => {
            web3.eth.getFeeHistory(blockCount, newestBlock, rewardPercentiles, (error, fee) => {

                if( error ) {
                    return reject(error);
                }
                resolve (fee);
            });
        });
    }

}

/*
 * getMaxPriorityFeePerGas
 */
async function _getMaxPriorityFeePerGas(web3) {

    try {
        const fee = await __getMaxPriorityFeePerGas(web3) ;

    	return [fee, null];
    } catch (err) {
        return [false, err];
    }

    function __getMaxPriorityFeePerGas(web3) {

        return new Promise((resolve, reject) => {
            web3.eth.getMaxPriorityFeePerGas( (error, fee) => {

                if( error ) {
                    return reject(error);
                }
                resolve (fee);
            });
        });
    }

}
