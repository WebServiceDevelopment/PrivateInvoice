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

const sub = require('../invoice_sub.js')
const tran = require('../invoice_sub_transaction.js')
const to_seller = require('../buyer_to_seller.js')
const eth = require('../web3_eth.js')

const {
    createReturnMessage,
} = require('../update_status.js')

const { getPrivateKeys } = require('../verify_utils.js')

const {
    makePresentation,
} = require('../presentations_out.js')

//  web3.js

const web3 = eth.getWeb3()
web3.eth.transactionConfirmationBlocks = 2

// Database

const BUYER_STATUS = 'buyer_status'
const CONTACTS = 'contacts'

const returnInvoice = async (
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
        throw new Error('Error (return):This request is incorrect')
    }

    // 2.
    //
    const [seller_host, err2] = await sub.getSellerHost(
        CONTACTS,
        seller_did,
        member_did
    )
    if (err2) {
        throw new Error('Error (return):This request is incorrect')
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
        switch (code3) {
            case 500:
                throw new Error('Error (return):The destination node cannot be found')
            case 400:
            default:
                throw new Error('Error (return):This request is incorrect')
        }
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
    const [credential, err7] = await createReturnMessage(
        document_uuid,
        member_did,
        keyPair
    )

    if (err7) {
        errno = 7
        code = 400
        tran.rollbackAndReturn(conn, code, err7, errno, METHOD)
        throw new Error(err7)
    }

    // 8.
    // makePresentation
    //
    const [sent, err8] = await makePresentation(url, keyPair, credential)
    if (err8) {
        errno = 8
        code = 400
        tran.rollbackAndReturn(conn, code, err8, errno, METHOD)
        throw new Error(err8)
    }

    // 9.
    // commit
    //

    const [_9, err9] = await tran.commit(conn)

    if (err9) {
        errno = 9
        code = 400
        tran.rollbackAndReturn(conn, code, err9, errno, METHOD)

        // 10.
        //
        const [code10, err10] = await to_seller.rollbackReturnToSent(
            seller_host,
            member_did,
            seller_did
        )

        if (code10 !== 200) {
            if (code10 == 500) {
                throw new Error('seller connect check:ECONNRESET')
            } else {
                throw new Error('seller connect other')
            }
        }

        throw new Error(`err 10: ${err10}`)
    }

    // 11.
    //
    conn.end()

    const end = Date.now()
    console.log('/return Time: %d ms', end - start)
}

module.exports = {
    returnInvoice
}