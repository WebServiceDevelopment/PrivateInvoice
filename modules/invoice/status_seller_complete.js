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

const { getPrivateKeys } = require('../verify_utils.js')

// Libraries

// Import Modules
const sub = require('../invoice_sub.js')
const tran = require('../invoice_sub_transaction.js')
const to_buyer = require('../seller_to_buyer.js')

//const sign_your_credentials = require('../sign_your_credentials.js')
const { makePresentation } = require('../presentations_out.js')
const { createArchiveMessage } = require('../update_status.js')

// Database

// Table Name
const SELLER_DOCUMENT = 'seller_document'
const SELLER_STATUS = 'seller_status'

const SELLER_ARCHIVE_DOCUMENT = 'seller_document_archive'
const SELLER_ARCHIVE_STATUS = 'seller_status_archive'

const CONTACTS = 'contacts'

const completeInvoice = async (
    member_did, // string did:key:123
    document_uuid // string
) => {
    const METHOD = '/sellerArchive'

    let start = Date.now()
    const FOLDER = 'paid'
    let err, errno, code

    // 1.
    //
    const [buyer_did, err1] = await sub.getBuyerDid(
        SELLER_STATUS,
        document_uuid,
        member_did
    )

    if (err1) {
        let msg = `ERROR:${METHOD}: buyer_did is not found`

        return {
            err: 1,
            msg: msg,
        }
    }

    // 2.
    //
    const [buyer_host, err2] = await sub.getBuyerHost(
        CONTACTS,
        member_did,
        buyer_did
    )

    if (err2) {
        let msg = `ERROR:${METHOD}: buyer_did is not found`

        return {
            err: 2,
            msg: msg,
        }
    }

    // 3.
    // buyer connect check
    // 20221102 undo

    const [code3, err3] = await to_buyer.connect(
        buyer_host,
        member_did,
        buyer_did
    )

    if (code3 !== 200) {
        let msg
        if (code == 500) {
            msg = `ERROR:${METHOD}:buyer connect check:ECONNRESET`
        } else {
            switch (err3) {
                case 'Not found.':
                    msg = `ERROR:${METHOD}:The destination node cannot be found`
                    break
                default:
                    msg = `ERROR:${METHOD}: Invalid request`
                    break
            }
        }

        return {
            err: 3,
            msg: msg,
        }
    }

    // 4.
    // STATUS
    // First we go ahead and get the status.
    //
    const [old_status, _4] = await sub.getStatus(SELLER_STATUS, document_uuid)

    if (old_status == undefined) {
        let msg = `ERROR:${METHOD}:Record is not exist`

        return {
            err: 4,
            msg: msg,
        }
    }

    // 5. Second we go ahead and get the document
    //
    const [old_document, _5] = await sub.getDocument(
        SELLER_DOCUMENT,
        document_uuid
    )

    if (old_document == undefined) {
        let msg = `ERROR:${METHOD}:Record is not exist`

        return {
            err: 4,
            msg: msg,
        }
    }

    // 6.
    // Does document_uuid already exist in the archive status table?
    //
    const [_6, err6] = await sub.notexist_check(
        SELLER_ARCHIVE_STATUS,
        document_uuid
    )

    if (err6) {
        let msg = `ERROR:${METHOD}:document_uuid is not exist`

        return {
            err: 6,
            msg: msg,
        }
    }

    // 7.
    // Does document_uuid already exist in the archive document table?
    //
    const [_7, err7] = await sub.notexist_check(
        SELLER_ARCHIVE_DOCUMENT,
        document_uuid
    )

    if (err7) {
        let msg = `ERROR:${METHOD}:document_uuid is not exist`

        return {
            err: 6,
            msg: msg,
        }
    }

    // 8.
    // begin Transaction
    //
    const [conn, _8] = await tran.connection()
    await tran.beginTransaction(conn)

    // 9.
    // Then we go ahead and insert into the archive status
    //

    old_status.document_folder = FOLDER

    old_status.seller_archived = 1
    old_status.buyer_archived = 1

    const [_9, err9] = await tran.insertArchiveStatus(
        conn,
        SELLER_ARCHIVE_STATUS,
        old_status
    )
    if (err) {
        errno = 9
        code = 400
        return tran.rollbackAndReturn(conn, code, err9, errno, METHOD)
    }

    // 10.
    // And then we need to insert into the archive document
    //
    const [_10, err10] = await tran.insertArchiveDocument(
        conn,
        SELLER_ARCHIVE_DOCUMENT,
        old_document
    )
    if (err10) {
        //console.log("ERR insertArchiveDocument seller_invoice_archive.js err="+err10)
        //console.log(old_document)
        errno = 10
        code = 400
        return tran.rollbackAndReturn(conn, code, err10, errno, METHOD)
    }

    // 11.
    // Remove recoiored from SELLER_STATUS with docunent_uuid key
    //
    const [_11, err11] = await tran.deleteStatus(
        conn,
        SELLER_STATUS,
        old_status
    )
    if (err11) {
        errno = 11
        code = 400
        return tran.rollbackAndReturn(conn, code, err11, errno, METHOD)
    }

    // 12.
    // Remove recoiored from SELLER_DOCUMENT with docunent_uuid key
    //
    const [_12, err12] = await tran.deleteDocument(
        conn,
        SELLER_DOCUMENT,
        old_status
    )
    if (err12) {
        errno = 12
        code = 400
        return tran.rollbackAndReturn(conn, code, err12, errno, METHOD)
    }

    // 13.
    // getPrivateKeys
    //
    const [keyPair, err13] = await getPrivateKeys(member_did)
    if (err13) {
        errno = 13
        code = 400
        return tran.rollbackAndReturn(conn, code, err13, errno, METHOD)
    }

    // 14.
    // createArchiveMessage
    //
    const url = `${buyer_host}/api/presentations/available`
    const [credential, err14] = await createArchiveMessage(
        document_uuid,
        member_did,
        keyPair
    )
    if (err14) {
        errno = 14
        code = 400
        return tran.rollbackAndReturn(conn, code, err14, errno, METHOD)
    }

    // 15.
    // makePresentation
    //
    const [sent, err15] = await makePresentation(url, keyPair, credential)
    if (err15) {
        errno = 15
        code = 400
        return tran.rollbackAndReturn(conn, code, err15, errno, METHOD)
    }

    // 16.
    // commit
    //
    const [_16, err16] = await tran.commit(conn)

    if (err16) {
        errno = 16
        code = 400
        return tran.rollbackAndReturn(conn, code, err16, errno, METHOD)
    }

    // 17.
    //
    conn.end()
    const end = Date.now()
    console.log('/sellerArchive Time: %d ms', end - start)
    // 18.
    //
    return {
        err: 0,
        msg: old_status.document_uuid,
    }
}

module.exports = {
    completeInvoice,
}
