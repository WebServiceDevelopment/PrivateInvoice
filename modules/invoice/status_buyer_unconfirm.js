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

// Import Modules
const sub = require('../invoice_sub.js')
const tran = require('../invoice_sub_transaction.js')
const to_seller = require('../buyer_to_seller.js')
const eth = require('../web3_eth.js')

const {
    createConfirmMessage,
    createReturnMessage,
    createPaymentMessage,
} = require('../update_status.js')

const { getPrivateKeys } = require('../verify_utils.js')

const {
    makePresentation,
    getWalletPrivateKey,
    getSellerWalletAddress,
} = require('../presentations_out.js')

//  web3.js

const web3 = eth.getWeb3()
web3.eth.transactionConfirmationBlocks = 2

// Database

const BUYER_STATUS = 'buyer_status'
const BUYER_DOCUMENT = 'buyer_document'
const CONTACTS = 'contacts'

const unconfirmInvoice = async (
    member_did, // string did:key:123
    document_uuid // string
) => {
    const start = Date.now()

    // 1.
    //
    const [seller_did, err1] = await sub.getSellerDid(
        BUYER_STATUS,
        document_uuid,
        member_did
    )

    if (err1) {
        throw new Error('Error (unconfirm): This request is incorrect')
    }

    // 2.
    //
    const [seller_host, err2] = await sub.getSellerHost(
        CONTACTS,
        seller_did,
        member_did
    )

    if (err2) {
        throw new Error('Error (unconfirm):This request is incorrect')
    }

    // 3. buyer connect check
    //
    const [code3, err3] = await to_seller.connect(
        seller_host,
        member_did,
        seller_did
    )

    if (code3 !== 200) {
        if (code3 == 500) {
            throw new Error(
                'Error (unconfirm): The destination node cannot be found'
            )
        }
        throw new Error('Error (unconfirm): Imvalid request')
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
        return res
            .status(400)
            .json(tran.rollbackAndReturn(conn, code, err5, errno, METHOD))
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
        return res
            .status(400)
            .json(tran.rollbackAndReturn(conn, code6, err6, errno, METHOD))
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

        if (code8 !== 200) {
            if (code8 == 500) {
                throw new Error(
                    'Error (unconfirm): seller connect check:ECONNRESET'
                )
            } else {
                throw new Error('Error (unconfirm): Invalid argument')
            }
        }
        throw new Error('Error (unconfirm): Commit failed')
    }

    // 9.
    //
    conn.end()

    const end = Date.now()
    console.log('/unconfirm Time: %d ms', end - start)
}

module.exports = {
    unconfirmInvoice,
}
