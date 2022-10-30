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

'use strict'

// Import Router

const express = require('express')
const router = express.Router()
module.exports = router

// Import Modules
const sub = require('../../modules/invoice_sub.js')
const to_seller = require('../../modules/buyer_to_seller.js')
const wallet_sub = require('../../modules/wallet_sub.js')

const eth = require('../../modules/web3_eth.js')
const web3 = eth.getWeb3()

// Libraries
const currency = require('currency.js')

// Database

const config = require('../../config.json')

const BUYER_STATUS = 'buyer_status'
const BUYER_STATUS_ARCHIVE = 'buyer_status_archive'
const BUYER_DOCUMENT = 'buyer_document'
const BUYER_DOCUMENT_ARCHIVE = 'buyer_document_archive'

const SELLER_STATUS = 'seller_status'
const SELLER_STATUS_ARCHIVE = 'seller_status_archive'
const SELLER_DOCUMENT = 'seller_document'
const SELLER_DOCUMENT_ARCHIVE = 'seller_document_archive'

const CONTACTS = 'contacts'

// CURRENCY
const CURRENCY = config.CURRENCY

const LIST_MAX_DEFAULT = 20

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * getReceiptInResentActivity
 */
router.get('/getReceiptInResentActivity', async function (req, res) {
    const METHOD = '/getReceiptInResentActivity'

    const hash = req.query.settlement_hash

    // 1.
    //
    const [receipt, err1] = await eth.getTransactionReceipt(web3, hash)

    if (err1) {
        let msg = `ERROR:${METHOD}: Could not get TransactionReceipt`
        res.status(400).json({
            err: err1,
            msg: msg,
        })
        return
    }

    res.json({
        err: 0,
        msg: {
            receipt: receipt,
        },
    })

    return
})

/*
 * 2.
 * getResentActivityOfWallet
 */
router.get('/getResentActivityOfWallet', async function (req, res) {
    const OFFSET = (req.query.start_position || 1) - 1
    const LIST_MAX = (req.query.list_max || LIST_MAX_DEFAULT) + OFFSET

    const SALE = 'Sale'
    const PURCHASE = 'Purchase'

    let Activity = []
    let Activity1 = []
    let Activity2 = []

    const { member_did } = req.session.data

    // 1.
    // Extract RecentActivity from each table and set Type (Sales, Purchase).
    // In addition, _extract() extracts:
    // - Amount
    // - Buyer_name
    // - Buyer_id
    // - CredentialSubject
    //
    const act_S = wallet_sub.getRecentActivityBySeller_did
    const act_B = wallet_sub.getRecentActivityByBuyer_did

    const act_s = wallet_sub.getRecentActivity_seller
    const act_b = wallet_sub.getRecentActivity_buyer

    let str

    // 1.1

    str = _uuidsToString(await act_S(SELLER_STATUS, LIST_MAX, member_did))

    const [a1, len1] = _extract(
        await act_s(SELLER_DOCUMENT, LIST_MAX, str),
        SALE
    )

    // 1.2

    str = _uuidsToString(
        await act_S(SELLER_STATUS_ARCHIVE, LIST_MAX, member_did)
    )

    const [a2, len2] = _extract(
        await act_s(SELLER_DOCUMENT_ARCHIVE, LIST_MAX, str),
        SALE
    )

    // 1.3

    str = _uuidsToString(await act_B(BUYER_STATUS, LIST_MAX, member_did))

    const [a3, len3] = _extract(
        await act_b(BUYER_DOCUMENT, LIST_MAX, str),
        PURCHASE
    )

    // 1.4

    str = _uuidsToString(
        await act_B(BUYER_STATUS_ARCHIVE, LIST_MAX, member_did)
    )

    const [a4, len4] = _extract(
        await act_b(BUYER_DOCUMENT_ARCHIVE, LIST_MAX, str),
        PURCHASE
    )

    // 2.
    // Sort by settlement_time in descending order.
    //
    let k = 0
    for (let i = 0, j = 0; i < len1 || j < len2; k++) {
        if (i == len1) {
            for (; j < len2; j++, k++) {
                Activity1[k] = { ...a2[j] }
            }
            break
        }
        if (j == len2) {
            for (; i < len1; i++, k++) {
                Activity1[k] = { ...a1[i] }
            }
            break
        }
        if (a1[i].settlement_time >= a2[j].settlement_time) {
            Activity1[k] = { ...a1[i] }
            i++
        } else {
            Activity1[k] = { ...a2[j] }
            j++
        }
    }
    const len5 = k

    // 3.
    // Sort by settlement_time in descending order.
    //
    k = 0
    for (let i = 0, j = 0; i < len3 || j < len4; k++) {
        if (i == len3) {
            for (; j < len4; j++, k++) {
                Activity2[k] = { ...a4[j] }
            }
            break
        }
        if (j == len4) {
            for (; i < len3; i++, k++) {
                Activity2[k] = { ...a3[i] }
            }
            break
        }
        if (a3[i].settlement_time >= a4[j].settlement_time) {
            Activity2[k] = { ...a3[i] }
            i++
        } else {
            Activity2[k] = { ...a4[j] }
            j++
        }
    }
    const len6 = k

    // 4.
    // Sort by settlement_time in descending order, limited to 20.
    //

    k = 0
    for (let i = 0, j = 0; i < len5 || j < len6; k++) {
        if (k >= LIST_MAX) {
            break
        }

        if (i == len5) {
            for (; j < len6 && k < LIST_MAX; j++, k++) {
                if (k >= OFFSET) {
                    Activity[k - OFFSET] = { ...Activity2[j] }
                }
            }
            break
        }
        if (j == len6) {
            for (; i < len5 && k < LIST_MAX; i++, k++) {
                if (k >= OFFSET) {
                    Activity[k - OFFSET] = { ...Activity1[i] }
                }
            }
            break
        }
        if (Activity1[i].settlement_time >= Activity2[j].settlement_time) {
            if (k >= OFFSET) {
                Activity[k - OFFSET] = { ...Activity1[i] }
            }
            i++
        } else {
            if (k >= OFFSET) {
                Activity[k - OFFSET] = { ...Activity2[j] }
            }
            j++
        }
    }

    res.json({
        err: 0,
        msg: {
            activity: Activity,
        },
    })

    return

    function _uuidsToString(document_uuids) {
        if (document_uuids.length == 0) {
            return ''
        }

        let d = []
        for (let i in document_uuids) {
            d.push(document_uuids[i].document_uuid)
        }
        return "'" + d.join("','") + "'"
    }

    function _extract(row, type) {
        let len = row.length
        let json

        const PLAS_MINUS = ((type) => {
            switch (type) {
                case SALE:
                    return '+'
                case PURCHASE:
                    return '-'
                default:
                    return ''
            }
        })(type)

        for (let i = 0; i < len; i++) {
            json = JSON.parse(row[i].document_json)

            row[i].type = type
            row[i].amount =
                PLAS_MINUS +
                json.credentialSubject.totalPaymentDue.price +
                ' ' +
                json.credentialSubject.totalPaymentDue.priceCurrency
            switch (type) {
                case SALE:
                    row[
                        i
                    ].buyer_name = `Buyer : ${json.credentialSubject.buyer.name}`
                    row[
                        i
                    ].buyer_id = `Buyer : ${json.credentialSubject.buyer.id}`
                    break
                case PURCHASE:
                    row[
                        i
                    ].seller_name = `seller : ${json.credentialSubject.buyer.name}`
                    row[
                        i
                    ].seller_id = `seller : ${json.credentialSubject.buyer.id}`
                    break
            }
            row[i].credentialSubject = json.credentialSubject

            delete row[i].document_json
        }

        return [row, len]
    }
})

/*
 * 3.
 * getWalletInfo
 */

router.get('/getWalletInfo', async function (req, res) {
    const METHOD = '/getWalletInfo'

    const { wallet_address, member_did } = req.session.data

    // 1.
    //

    const type = await web3.eth.net.getNetworkType()
    const id = await web3.eth.getChainId()
    const account = wallet_address

    // 2.
    // getBalance

    const from_account = wallet_address
    const [balanceWei, err2] = await eth.getBalance(web3, from_account)

    if (err2) {
        let msg = `ERROR:${METHOD}: Could not get getBalance`
        res.status(400)
        json({
            err: 2,
            msg: msg,
        })
        return
    }

    let balanceGwei = web3.utils.fromWei(balanceWei, CURRENCY.symbol)

    res.json({
        err: 0,
        msg: {
            balanceGwei: balanceGwei,
            accountAddress: account,
            networkType: type,
            chainId: id,
        },
    })

    return
})

/*
 * 4.
 * [ Make Paymant]
 * getCurrentBalanceOfBuyer
 */
router.get('/getCurrentBalanceOfBuyer', async function (req, res) {
    const METHOD = '/getCurrentBalanceOfBuyer'

    const { document_uuid } = req.query
    const { member_did, wallet_address } = req.session.data

    // 1.
    // getSellerDid
    //
    const [seller_did, err1] = await sub.getSellerDid(
        BUYER_STATUS,
        document_uuid,
        member_did
    )
    if (err1) {
        let msg = `ERROR:${METHOD}: Could not get did`

        res.status(400).json({
            err: 1,
            msg: msg,
        })
        return
    }

    // 2.
    // getSellerHost
    //
    const [seller_host, err2] = await sub.getSellerHost(
        CONTACTS,
        seller_did,
        member_did
    )
    if (err2) {
        let msg = `ERROR:${METHOD}: Could not get host`

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    // 3.
    // getDocument
    //
    const [document, err3] = await sub.getDocument(
        BUYER_DOCUMENT,
        document_uuid
    )

    if (err3) {
        let msg = `ERROR:${METHOD}: Could not get document`

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    // 4.
    //
    let doc
    try {
        doc = JSON.parse(document.document_json)
    } catch (err4) {
        let msg = `ERROR:${METHOD}: Could not get document_json`

        res.status(400).json({
            err: 4,
            msg: msg,
        })
        return
    }

    // 5.
    // from_accoun
    //

    const from_account = wallet_address

    // 6.
    // code
    //
    const [code, _6] = await eth.getCode(web3, from_account)

    if (code == null) {
        let msg = `ERROR:${METHOD}: Could not get code`

        res.status(400).json({
            err: 6,
            msg: msg,
        })
        return
    }

    // 7.
    // Get seller account
    //
    const [ethAddr, err7] = await to_seller.getAccountOfSellerWallet(
        seller_host,
        seller_did,
        member_did
    )

    if (err7) {
        return res.status(400).json({
            err: 7,
            msg: `ERROR:${METHOD}: Could not get account`,
        })
    }

    const to_account = ethAddr

    // 8.
    // callObject
    //

    let callObject = {
        to: to_account,
        code: code,
    }

    // 9.
    // getBalance

    console.log(from_account)
    const [balanceWei, err9] = await eth.getBalance(web3, from_account)

    if (err9) {
        let msg = `ERROR:${METHOD}: Could not get balance`

        res.status(400).json({
            err: 9,
            msg: msg,
        })
        return
    }

    // 10.
    // getGasPrice
    //
    const [gasPrice, err10] = await eth.getGasPrice(web3)

    if (err10) {
        let msg = `ERROR:${METHOD}: Could not get gasPrice`

        res.status(400).json({
            err: 10,
            msg: msg,
        })
        return
    }

    // 11.
    // estimateGas
    //

    const [estimateGas, err11] = await eth.estimateGas(web3, callObject)
    if (err11) {
        let msg = `ERROR:${METHOD}: Could not get estimateGas`

        res.status(400).json({
            err: 10,
            msg: msg,
        })
        return
    }

    // 12.
    // Add the integer part and the decimal point separatelya.
    //
    let balanceGwei = web3.utils.fromWei(balanceWei, CURRENCY.symbol)
    let gasPriceGwei = web3.utils.fromWei(gasPrice, CURRENCY.symbol)
    let gasGwei = estimateGas * gasPriceGwei

    let payment = doc.credentialSubject.totalPaymentDue.price.replace(/,/g, '')

    let makePaymantTo = parseFloat(payment)
    let transferCost = 0

    let endBalance = await _calc_decimalPart(
        balanceGwei,
        makePaymantTo,
        transferCost,
        gasGwei
    )

    // 13.
    // create transaction_result
    //
    const transaction_result = {
        balanceGwei: currency(balanceGwei, config.CURRENCY).format(true),
        makePaymantTo: currency(makePaymantTo, config.CURRENCY).format(true),
        transferCost: currency(transferCost, config.CURRENCY).format(true),
        gas: currency(gasGwei, config.CURRENCY).format(true),
        endBalance: currency(endBalance, config.CURRENCY).format(true),
    }

    res.json({
        err: 0,
        msg: transaction_result,
    })

    return

    function _calc_decimalPart(
        balanceGwei,
        makePaymantTo,
        transferCost,
        gasGwei
    ) {
        let integerPart =
            parseInt(balanceGwei) -
            parseInt(gasGwei) -
            parseInt(makePaymantTo) -
            parseInt(transferCost)

        let decimalPart =
            _decimalPart(balanceGwei) -
            _decimalPart(gasGwei) -
            _decimalPart(makePaymantTo) -
            _decimalPart(transferCost)

        if (decimalPart == 0) {
            return integerPart
        } else if (decimalPart < 0) {
            decimalPart = -1 * decimalPart
            decimalPart = web3.utils.fromWei(
                decimalPart.toString(),
                CURRENCY.symbol
            )

            return integerPart - 1 + (1 - decimalPart).toString().substr(1)
        } else {
            decimalPart = web3.utils.fromWei(
                decimalPart.toString(),
                CURRENCY.symbol
            )

            return integerPart + decimalPart.toString().substr(1)
        }
    }

    function _decimalPart(num) {
        if (num == 0 || num == null || num == '') {
            return 0
        }
        let numStr = num + ''
        let dotIdx = numStr.indexOf('.')
        let result = '0.' + (dotIdx > -1 ? numStr.substring(dotIdx + 1) : '0')

        if (num == '0.0') {
            return 0
        }

        let res
        try {
            res = web3.utils.toWei(result, CURRENCY.symbol)
        } catch (e) {
            res = 0
        }

        return res
    }
})

/*
 * 5.
 * [ View Transaction Receipt ]
 */
router.get('/getTransactionReceipt', async function (req, res) {
    const METHOD = '/getTransactionReceipt'

    const { document_uuid, role, archive } = req.query

    let table

    // 1.
    //

    switch (role) {
        case 'buyer':
            switch (archive) {
                case 0:
                case '0':
                    table = BUYER_DOCUMENT
                    break
                case 1:
                case '1':
                    table = BUYER_DOCUMENT_ARCHIVE
                    break
                default:
                    res.staus(400).json({
                        err: 1,
                        msg: 'Invalid argument.',
                    })
                    return
            }
            break
        case 'seller':
            switch (archive) {
                case 0:
                case '0':
                    table = SELLER_DOCUMENT
                    break
                case 1:
                case '1':
                    table = SELLER_DOCUMENT_ARCHIVE
                    break
                default:
                    res.staus(400).json({
                        err: 2,
                        msg: 'Invalid argument.',
                    })
                    return
            }
            break
        default:
            res.staus(400).json({
                err: 3,
                msg: 'Invalid argument.',
            })
            return
    }

    // 2.
    //
    const [document, err2] = await sub.getDocument(table, document_uuid)

    if (err2) {
        let msg = `Error:${METHOD}: Could not get document`

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    // 3.
    if (document == null) {
        let msg = `Error:${METHOD}: This Document is null`

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    const hash = document.settlement_hash

    // 4.
    //
    const [receipt, err4] = await eth.getTransactionReceipt(web3, hash)

    if (err4) {
        let msg = `Error:${METHOD}: Could not get transaction receipt`

        res.sttaus.json({
            err: 4,
            msg: msg,
        })
        return
    }

    // 5.
    res.json({
        err: 0,
        msg: {
            receipt: receipt,
        },
    })

    return
})

/*
 * 6.
 * [ JSON DATA ]
 * getIPFScidByTransactionHash
 */
router.get('/getIPFScidByTransactionHash', async function (req, res) {
    const METHOD = '/getIPFScidByTransactionHash'

    const { transactionHash } = req.query

    // 1.
    // getTransaction
    //
    const [result, err1] = await eth.getTransaction(web3, transactionHash)

    if (err1) {
        let msg = `ERROR:${METHOD}: Could not get Transaction`

        res.status(400).json({
            err: 1,
            msg: msg,
        })
        return
    }

    // 2.
    // hexToAscii
    //
    const ipfs_cid = web3.utils.hexToAscii(result.input)

    // 3.
    // ipfs_address
    //
    const ipfs_address = process.env.IPFS_ADDRESS

    res.json({
        err: 0,
        msg: {
            ipfs_cid: ipfs_cid,
            ipfs_address: ipfs_address,
        },
    })

    return
})
