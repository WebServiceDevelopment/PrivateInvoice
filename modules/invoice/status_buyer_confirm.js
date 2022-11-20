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

const confirmInvoice = async (
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
        throw new Error('Error (confirm):This request is incorrect')
    }

    // 2.
    //
    const [seller_host, err2] = await sub.getSellerHost(
        CONTACTS,
        seller_did,
        member_did
    )

    if (err2) {
        throw new Error('Error (confirm):This request is incorrect')
    }

    //3. buyer connect check
    //

    console.log(seller_host + ' : ' + member_did + ' : ' + seller_did)

    const [code3, err3] = await to_seller.connect(
        seller_host,
        member_did,
        seller_did
    )

    if (code3 !== 200) {
        throw new Error('Error (confirm):The destination node cannot be found')
    } else if (code3 !== 200) {
        throw new Error(`Error (confirm): ${err3}`)
    }

    // 4.
    // begin Transaction
    //
    const [conn, _4] = await tran.connection()
    await tran.beginTransaction(conn)

    // 5.
    //
    const [_5, err5] = await tran.setConfirm(
        conn,
        BUYER_STATUS,
        document_uuid,
        member_did
    )

    if (err5) {
        errno = 5
        code = 400

        return res.status(400).json(
            tran.rollbackAndReturn(conn, code, err5, errno, METHOD)
        )
    }

    // 6.
    //
    // Get private keys to sign credential

    const [keyPair, err6] = await getPrivateKeys(member_did)
    if (err6) {
        errno = 6
        code = 400

        return res.status(400).json(
            tran.rollbackAndReturn(conn, code, err6, errno, METHOD)
        )
    }

    // 7. createConfirmMessage
    //
    const url = `${seller_host}/api/presentations/available`
    const [credential, err7] = await createConfirmMessage(
        document_uuid,
        member_did,
        keyPair
    )
    if (err7) {
        errno = 7
        code = 400

        return res.status(400).json(
            tran.rollbackAndReturn(conn, code, err7, errno, METHOD)
        )
    }

    // 8. makePresentation
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
        let roll = tran.rollbackAndReturn(conn, code, err9, errno, METHOD)

        // 10.
        //
        const [code10, err10] = await to_seller.rollbackConfirmToSent(
            seller_host,
            member_did,
            seller_did
        )

        if (code10 !== 200) {
            if (code10 === 500) {
                throw new Error('Error (confirm): seller connect check:ECONNRESET')
            } else {
                throw new Error('Error (confirm): Invalid argument')
            }
        }
    }

    conn.end()

    const end = Date.now()
    console.log('/confirm Time: %d ms', end - start)
}

module.exports = {
    confirmInvoice
}