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

// Libraries

// Import Modules
const sub = require('../../modules/invoice_sub.js')
const tran = require('../../modules/invoice_sub_transaction.js')
const to_seller = require('../../modules/buyer_to_seller.js')
const eth = require('../../modules/web3_eth.js')

const util = require('../../modules/util.js')

const {
    createConfirmMessage,
    createReturnMessage,
    createPaymentMessage,
} = require('../../modules/update_status.js')

const { getPrivateKeys } = require('../../modules/verify_utils.js')

const {
    makePresentation,
    getWalletPrivateKey,
    getSellerWalletAddress,
} = require('../../modules/presentations_out.js')

//  web3.js

const web3 = eth.getWeb3()
web3.eth.transactionConfirmationBlocks = 2


// Database

const BUYER_STATUS = 'buyer_status'
const BUYER_DOCUMENT = 'buyer_document'
const CONTACTS = 'contacts'

// ------------------------------- End Points -------------------------------

/*
 * 1.
 * [ Return to Sender ]
 * returnToSender
 */
router.post('/returnToSender', async function (req, res) {
    const METHOD = '/returnToSender'

    let start = Date.now()

    const { document_uuid } = req.body
    const { member_did } = req.session.data

    let errno, code

    // 1.
    //
    const [seller_did, err1] = await sub.getSellerDid(
        BUYER_STATUS,
        document_uuid,
        member_did
    )
    if (err1) {
        console.error(`Error 1: ${METHOD} err=` + err1)

        let msg = `${METHOD}:This request is incorrect.`

        return res.status(400).json({
            err: 1,
            msg: msg,
        })
    }

    // 2.
    //
    const [seller_host, err2] = await sub.getSellerHost(
        CONTACTS,
        seller_did,
        member_did
    )
    if (err2) {
        console.error(`Error 2: ${METHOD} err=` + err2)

        let msg = `${METHOD}:This request is incorrect.`

        return res.status(400).json({
            err: 2,
            msg: msg,
        })
    }

    // 3. buyer connect check
    //
    // 20221102  undo

    const [code3, err3] = await to_seller.connect(
        seller_host,
        member_did,
        seller_did
    )

    if (code3 !== 200) {
        console.error(`Error 3: ${METHOD} err=` + err3)

        let msg
        switch (code3) {
            case 500:
                msg = `${METHOD}:The destination node cannot be found.`
                break
            case 400:
            default:
                msg = `${METHOD}:This request is incorrect.`
                break
        }

        return res.status(400).json({
            err: 3,
            msg: msg,
        })
    }

    // 4.
    // begin Transaction
    //
    const [conn, _4] = await tran.connection()
    await tran.beginTransaction(conn)

    // 5.
    // Set BUYER_STATUS to 'return' with document_uuid as the key.
    //
    const [_5, err5] = await tran.setReturn(
        conn,
        BUYER_STATUS,
        document_uuid,
        member_did
    )

    if (err5) {
        errno = 5
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err5, errno, METHOD)
        )
        return
    }

    // 6.
    // Send a 'return' request to seller.
    //
    // Get private keys to sign credential

    const [keyPair, err6] = await getPrivateKeys(member_did)
    if (err6) {
        errno = 6
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err6, errno, METHOD)
        )
        return
    }

    // 7.
    //  createReturnMessage
    //

    const url = `${seller_host}/api/presentations/available`
    console.log(url)
    const [credential, err7] = await createReturnMessage(
        document_uuid,
        member_did,
        keyPair
    )
    if (err7) {
        errno = 7
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err7, errno, METHOD)
        )
        return
    }

    // 8.
    // makePresentation
    //
    const [sent, err8] = await makePresentation(url, keyPair, credential)
    if (err8) {
        errno = 8
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err8, errno, METHOD)
        )
        return
    }

    // 9.
    // commit
    //

    const [_9, err9] = await tran.commit(conn)

    if (err9) {
        errno = 9
        code = 400
        let rt = tran.rollbackAndReturn(conn, code, err9, errno, METHOD)

        // 10.
        //
        const [code10, err10] = await to_seller.rollbackReturnToSent(
            seller_host,
            member_did,
            seller_did
        )

        if (code10 !== 200) {
            console.log('Error 10 code=' + code10 + ':err=' + err10)
            if (code10 == 500) {
                rt = { err: 10, msg: 'seller connect check:ECONNRESET' }
            } else {
                rt = { err: 10, msg: err10 }
            }
        }
        res.status(400).json(rt)
        return
    }

    // 11.
    //
    conn.end()

    res.json({
        err: 0,
        msg: 'okay',
    })

    let end = Date.now()
    console.log('/return Time: %d ms', end - start)
})


/*
 * 3.
 * [ Unconfirm ]
 * unconfirm
 */
router.post('/unconfirm', async function (req, res) {
    const METHOD = '/unconfirm'

    let start = Date.now()

    const { document_uuid } = req.body
    const { member_did } = req.session.data

    let errno, code

    // 1.
    //
    const [seller_did, err1] = await sub.getSellerDid(
        BUYER_STATUS,
        document_uuid,
        member_did
    )

    if (err1) {
        let msg = `${METHOD}: This request is incorrect.`

        return res.json({
            err: 1,
            msg: msg,
        })
    }

    // 2.
    //
    const [seller_host, err2] = await sub.getSellerHost(
        CONTACTS,
        seller_did,
        member_did
    )

    if (err2) {
        let msg = `${METHOD}:This request is incorrect.`

        return res.status(400).json({
            err: 2,
            msg: msg,
        })
    }

    // 3. buyer connect check
    //
    const [code3, err3] = await to_seller.connect(
        seller_host,
        member_did,
        seller_did
    )

    if (code3 !== 200) {
        let msg
        if (code3 == 500) {
            msg = `${METHOD}: The destination node cannot be found`
        } else {
            msg = `${METHOD}: Imvalid request`
        }
        return res.status(400).json({
            err: 3,
            msg: msg,
        })
    }

    // 4
    // begin Transaction
    //
    const [conn, _4] = await tran.connection()
    await tran.beginTransaction(conn)

    // 5.
    //
    const [_5, err5] = await tran.setUnconfirm(
        conn,
        BUYER_STATUS,
        document_uuid,
        member_did
    )

    if (err5) {
        errno = 54
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err5, errno, METHOD)
        )
        return
    }

    // 6.
    //
    const [code6, err6] = await to_seller.unconfirm(
        seller_host,
        document_uuid,
        member_did
    )

    if (code6 !== 200) {
        errno = 6
        res.status(400).json(
            tran.rollbackAndReturn(conn, code6, err6, errno, METHOD)
        )
        return
    }

    // 7.
    // commit
    //
    const [_7, err7] = await tran.commit(conn)

    if (err7) {
        errno = 7
        code = 400
        let rt = tran.rollbackAndReturn(conn, code, err7, errno, METHOD)

        // 8.
        //
        const [code8, err8] = await to_seller.rollbackSentToConfirm(
            seller_host,
            member_did,
            seller_did
        )

        let msg
        msg = `Error:${METHOD}: Commit failed`

        if (code8 !== 200) {
            if (code8 == 500) {
                msg = `Error:${METHOD}: seller connect check:ECONNRESET`
            } else {
                msg = `Error:${METHOD}: Invalid argument`
            }

            return res.status(400).json({
                err: 8,
                msg: msg,
            })
        }

        return res.status(400).json({
            err: 7,
            msg: msg,
        })
    }

    // 9.
    //
    conn.end()

    // 10.
    //
    res.json({
        err: 0,
        msg: 'okay',
    })

    let end = Date.now()
    console.log('/unconfirm Time: %d ms', end - start)
})

/*
 * 4.
 * [ Make Payment ]
 * makePayment
 */

router.post('/makePayment', async function (req, res) {
    const METHOD = '/makePayment'

    let start = Date.now()
    const USE_PRESENTATION = true

    const { document_uuid, gasLimit } = req.body
    const { member_did } = req.session.data

    let errno, code

    console.log('Make payment 1')

    // 1.
    // getSellerDid
    //
    const [seller_did, err1] = await sub.getSellerDid(
        BUYER_STATUS,
        document_uuid,
        member_did
    )

    if (err1) {
        let msg = `Error:${METHOD}: This request is incorrect`

        return res.json({
            err: 1,
            msg: msg,
        })
    }

    console.log('Make payment 2')

    // 2.
    // getSellerHost
    //
    const [seller_host, err2] = await sub.getSellerHost(
        CONTACTS,
        seller_did,
        member_did
    )

    if (err2) {
        let msg = `Error:${METHOD}: This request is incorrect`

        return res.json({
            err: 2,
            msg: msg,
        })
    }

    // 3.
    // connect
    // 20221102 undo

    console.log('Make payment 3')

    const [code3, err3] = await to_seller.connect(
        seller_host,
        member_did,
        seller_did
    )

    if (code3 !== 200) {
        let msg
        if (code3 == 500) {
            msg = `Error:${METHOD}: The destination node cannot be found`
        } else {
            msg = `Error:${METHOD}: This request is incorrect`
        }

        return res.status(400).json({
            err: 3,
            msg: msg,
        })
    }

    // 4.
    // Ask for remittance amount from document.
    //

    console.log('Make payment 4')

    // 5.
    // paymentReservation

    // console.log('Make payment 5')
    // const [code5, err5] = await to_seller.paymentReservation(
    //     seller_host,
    //     document_uuid,
    //     member_did
    // )

    // if (code5 !== 200) {
    //     let msg
    //     if (code5 == 500) {
    //         msg = `Error:${METHOD}:seller connect check:ECONNRESET`
    //     } else {
    //         msg = `Error:${METHOD}: This request is incorrect`
    //     }

    //     return res.status(400).json({
    //         err: 5,
    //         msg: msg,
    //     })
    // }

    // 6.
    // get value from Document
    //

    console.log('Make payment 6')
    const [document, err6] = await sub.getDocument(
        BUYER_DOCUMENT,
        document_uuid
    )

    if (err6) {
        await util.cancelPaymentReservation(
            seller_host,
            document_uuid,
            member_did
        )

        let msg = `Error:${METHOD}: This request is incorrect`

        return res.status(400).json({
            err: 6,
            msg: msg,
        })
    }

    // 7.

    console.log('Make payment 7')
    let doc
    try {
        doc = JSON.parse(document.document_json)
    } catch (err7) {
        await util.cancelPaymentReservation(
            seller_host,
            document_uuid,
            member_did
        )

        let msg = `Error:${METHOD}: This request is incorrect`

        return res.status(400).json({
            err: 7,
            msg: msg,
        })
    }

    // 8.
    // contract_address
    //

    console.log('Make payment 8')
    const { wallet_address } = req.session.data
    const contract_address = wallet_address

    //console.log("contract_address ="+contract_address)

    // 9.
    // Balance before the start of payment
    // Ask for the balance of ETH

    console.log('Make payment 8')
    const [balanceWei_1, err9] = await eth.getBalance(web3, contract_address)

    if (err9) {
        await util.cancelPaymentReservation(
            seller_host,
            document_uuid,
            member_did
        )
        let msg = `Error:${METHOD}: Could not get balance`

        return res.json({
            err: 9,
            msg: msg,
        })
    }

    // 10.
    // Get seller account

    console.log('Make payment 10')
    const to_address = await getSellerWalletAddress(seller_did, member_did)

    //console.log("to_address="+to_address);

    // 11.
    // Ask for payment from document.
    // And Convert payment to hex.

    console.log('Make payment 11')
    let payment = doc.credentialSubject.totalPaymentDue.price.replace(/,/g, '')

    if (payment.indexOf(' ')) {
        payment = payment.split(' ')[0]
    }

    if (payment.indexOf('$')) {
        payment = payment.replace(/$/g, '')
    }

    //console.log("payment="+payment)

    const makePaymantTo = web3.utils.toHex(payment * 1000000000)

    // 12.
    // Register document in ipfs and ask for cid.
    // And Convert ipfs cid to hex.
    //

    // console.log('Make payment 12')
    // const ipfs_result = await Ipfs_Http_Client.add(document.document_json)
    // const ipfs_cid = ipfs_result.cid.toString()
    // const ipfs_cid_hex = web3.utils.toHex(ipfs_cid)

    // console.log('cid=' + ipfs_cid + ':ipfs_cid_hex =' + ipfs_cid_hex)

    // 13.
    // privateKey.

    console.log('Make payment 13')

    // const PrivateKey = process.env.PRIVATE_KEY;
    const PrivateKey = await getWalletPrivateKey(member_did)

    // 14.
    // sendTransaction
    //

    const [receipt14, err14] = await util.sendSignedTransaction(
        web3,
        contract_address,
        PrivateKey,
        to_address,
        gasLimit,
        makePaymantTo,
        // ipfs_cid_hex
    )

    if (err14) {
        await util.cancelPaymentReservation(
            seller_host,
            document_uuid,
            member_did
        )

        let msg = `Error:${METHOD}: sendSignedTransaction failed`

        return res.status(400).json({
            err: 14,
            msg: msg,
        })
    }

    const hash = receipt14.transactionHash
    console.log('14 a :' + hash)

    // 15.
    // begin Transaction

    console.log('Make payment 15')
    const [conn, _15] = await tran.connection()
    await tran.beginTransaction(conn)

    // 16.
    // setMakePayment_status

    console.log('Make payment 16')
    const [_16, err16] = await tran.setMakePayment_status(
        conn,
        BUYER_STATUS,
        document_uuid,
        member_did
    )

    if (err16) {
        await util.cancelPaymentReservation(
            seller_host,
            document_uuid,
            member_did
        )

        errno = 16
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err16, errno, METHOD)
        )
        return
    }

    // 17.
    // setMakePayment_document

    console.log('Make payment 17')
    const [_17, err17] = await tran.setMakePayment_document(
        conn,
        BUYER_DOCUMENT,
        document_uuid,
        hash
    )

    if (err17) {
        await util.cancelPaymentReservation(
            seller_host,
            document_uuid,
            member_did
        )

        errno = 17
        code = 400
        res.status(400).json(
            tran.rollbackAndReturn(conn, code, err17, errno, METHOD)
        )
        return
    }

    // 18.
    // makePayment
    //
    // Get private keys to sign credential

    console.log('Make payment 18')
    const [keyPair, err18] = await getPrivateKeys(member_did)
    if (err18) {
        errno = 18
        res.status(400).json(
            tran.rollbackAndReturn(conn, 'code18', err18, errno, METHOD)
        )
        return
    }

    // 19.  createPaymentMessage
    //
    const url = `${seller_host}/api/presentations/available`
    console.log(url)
    const [credential, err19] = await createPaymentMessage(
        document_uuid,
        member_did,
        keyPair,
        hash
    )

    if (err19) {
        errno = 19
        res.status(400).json(
            tran.rollbackAndReturn(conn, 'code19', err19, errno, METHOD)
        )
        return
    }

    // 20. makePresentation
    //
    const [sent, err20] = await makePresentation(url, keyPair, credential)
    if (err20) {
        errno = 20
        res.status(400).json(
            tran.rollbackAndReturn(conn, 'code20', err20, errno, METHOD)
        )
        return
    }

    // 21.
    // commit

    console.log('Make payment 21')
    const [_21, err21] = await tran.commit(conn)

    if (err21) {
        errno = 21
        code = 400
        let result = tran.rollbackAndReturn(conn, code, err21, errno, METHOD)

        let msg = `Error:${METHOD}: Commit failed`

        // 22.
        // rollback

        console.log('Make payment 22')
        const [code22, err22] = await to_seller.rollbackPaidToConfirm(
            seller_host,
            member_did,
            seller_did
        )

        if (code22 !== 200) {
            if (code22 == 500) {
                msg = `Error:${METHOD}:seller connect check:ECONNRESET`
            } else {
                msg = `Error:${METHOD}:rollbackPaidToConfirm `
            }
            return res.json({
                err: 22,
                msg: msg,
            })
        }

        return res.json({
            err: 21,
            msg: msg,
        })
    }

    // 23.
    //
    conn.end()

    // 24.
    // ETH balance Confirmation
    //
    const [balanceWei_2, _24] = await eth.getBalance(web3, contract_address)

    let balanceETH_1 = web3.utils.fromWei(balanceWei_1, 'ether')
    let balanceETH_2 = web3.utils.fromWei(balanceWei_2, 'ether')
    let balanceETH_3 = web3.utils.fromWei(
        (BigInt(balanceWei_1) - BigInt(balanceWei_2)).toString(),
        'ether'
    )

    // 25.
    // ETH transaction result
    //
    const [transaction_result, err25] = await eth.getTransaction(web3, hash)

    if (err25) {
        console.log('err25' + err25)
    }
    //console.log(transaction_result);

    // 26.
    // IP ADDRESS OF IPFS SERVER
    const ipfs_address = process.env.IPFS_ADDRESS

    console.log('Make payment 26')
    //console.log("/makePayment accepted");

    let end = Date.now()
    console.log('/makePayment Time: %d ms', end - start)

    res.json({
        err: 0,
        msg: {
            consumed: balanceETH_3 + ' ETH',
            transaction_result: transaction_result,
            // ipfs_cid: ipfs_cid,
            // ipfs_address: ipfs_address,
        },
    })

    return
})
