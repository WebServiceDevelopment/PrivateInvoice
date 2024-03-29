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

// Import sub
const sub = require('../../modules/invoice_sub.js')
const tran = require('../../modules/invoice_sub_transaction.js')
const to_buyer = require('../../modules/seller_to_buyer.js')

// Libraries

const { makePresentation } = require('../../modules/presentations_out.js')
const { createTrashMessage } = require('../../modules/update_status.js')
const { getPrivateKeys } = require('../../modules//verify_utils.js')

// Database

const SELLER_DOCUMENT = 'seller_document'
const SELLER_STATUS = 'seller_status'

const SELLER_ARCHIVE_DOCUMENT = 'seller_document_archive'
const SELLER_ARCHIVE_STATUS = 'seller_status_archive'
const CONTACTS = 'contacts'

const trashInvoice = async (
    member_did, // string did:key:123
    document_uuid // string
) => {
    const METHOD = '/trash'

    //console.log("trash");
    let start = Date.now()

    const USE_PRESENTATION = true
    let err, errno, code

    // 1.
    const [buyer_did, err1] = await sub.getBuyerDid(
        SELLER_STATUS,
        document_uuid,
        member_did
    )
    if (err1) {
        let msg = `Error:${METHOD}: Could not get buyer did.`

        return {
            err: 1,
            msg: msg,
        }
    }

    // 2
    const [buyer_host, err2] = await sub.getBuyerHost(
        CONTACTS,
        member_did,
        buyer_did
    )
    if (err2) {
        let msg = `Error:${METHOD}: Could not get buyer Host.`

        return {
            err: 2,
            msg: msg,
        }
    }

    //3. buyer connect check

    /*
     *	if(!USE_PRESENTATION) {
     */
    const [code3, err3] = await to_buyer.connect(
        buyer_host,
        member_did,
        buyer_did
    )
    if (code3 !== 200) {
        let msg
        if (code == 500) {
            msg = { err: 'buyer connect check:ECONNRESET' }
        } else {
            switch (err3) {
                case 'Not found.':
                    msg = { err: 'The destination node cannot be found.' }
                    break
                default:
                    msg = `Error:${METHOD}: Invalid request`
                    break
            }
        }
        return {
            err: 3,
            msg: msg,
        }
    }
    /*
     *	}
     */

    // 4.
    // STATUS
    // First we go ahead and get the status.
    //
    const [old_status, _4] = await sub.getStatus(SELLER_STATUS, document_uuid)

    if (old_status === undefined) {
        let msg = 'Error:${METHOD}: Record is not exist.'

        return {
            err: 4,
            msg: msg,
        }
    }

    // 5.
    // Second we go ahead and get the document
    //
    const [old_document, _5] = await sub.getDocument(
        SELLER_DOCUMENT,
        document_uuid
    )

    if (old_document === undefined) {
        let msg = 'Error:${METHOD}: Record is not exist.'

        return {
            err: 5,
            msg: msg,
        }
    }

    // 6.
    // Does document_uuid not exist in the archive status table yet?
    //
    const [_6, err6] = await sub.notexist_check(
        SELLER_ARCHIVE_STATUS,
        document_uuid
    )
    if (err6) {
        let msg = 'Error:${METHOD}: Record is not exist.'

        return {
            err: 6,
            msg: err6,
        }
    }

    // 7.
    // Does document_uuid not exist in the archive document table yet?
    //
    const [_7, err7] = await sub.notexist_check(
        SELLER_ARCHIVE_DOCUMENT,
        document_uuid
    )
    if (err7) {
        let msg = 'Error:${METHOD}: Record is not exist.'

        return {
            err: 7,
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

    old_status.document_folder = 'trash'

    //old_status.seller_archived  = 1;
    //old_status.buyer_archived  = 1;

    // 10.
    const [_10, err10] = await tran.insertArchiveStatus(
        conn,
        SELLER_ARCHIVE_STATUS,
        old_status
    )

    if (err10) {
        errno = 10
        code = 400
        return tran.rollbackAndReturn(conn, code, err10, errno, METHOD)
    }

    // 11.
    // And then we need to insert into the archive document
    //
    const [_11, err11] = await tran.insertDocument(
        conn,
        SELLER_ARCHIVE_DOCUMENT,
        old_status,
        old_document.document_json
    )

    if (err11) {
        errno = 11
        code = 400
        return tran.rollbackAndReturn(conn, code, err11, errno, METHOD)
    }

    // 12.
    // Remove recoiored from SELLER_STATUS with docunent_uuid key
    //
    const [_12, err12] = await tran.deleteStatus(
        conn,
        SELLER_STATUS,
        old_status
    )
    if (err) {
        errno = 12
        code = 400
        return tran.rollbackAndReturn(conn, code, err12, errno, METHOD)
    }

    // 13.
    // Remove recoiored from SELLER_DOCUMENT with docunent_uuid key
    //
    const [_13, err13] = await tran.deleteDocument(
        conn,
        SELLER_DOCUMENT,
        old_status
    )
    if (err13) {
        errno = 13
        code = 400
        return tran.rollbackAndReturn(conn, code, err13, errno, METHOD)
    }

    if (!USE_PRESENTATION) {
        // 14.
        //

        const [code14, err14] = await to_buyer.trash(
            buyer_host,
            old_status.document_uuid,
            old_status.seller_did
        )

        if (code14 !== 200) {
            errno = 14
            res.status(400).json(
                tran.rollbackAndReturn(conn, code14, err14, errno, METHOD)
            )
            return
        }
    } else {
        // 15.
        //

        const [keyPair, err15] = await getPrivateKeys(member_did)
        if (err15) {
            errno = 15
            res.status(400).json(
                tran.rollbackAndReturn(conn, 'code15', err15, errno, METHOD)
            )
            return
        }
        // 16. createTrashMessage
        //

        const url = `${buyer_host}/api/presentations/available`
        const [credential, err16] = await createTrashMessage(
            document_uuid,
            member_did,
            keyPair
        )
        if (err16) {
            errno = 16
            res.status(400).json(
                tran.rollbackAndReturn(conn, 'code16', err16, errno, METHOD)
            )
            return
        }

        // 17.
        //
        const [sent, err17] = await makePresentation(url, keyPair, credential)
        if (err17) {
            errno = 17
            res.status(400).json(
                tran.rollbackAndReturn(conn, 'code17', err17, errno, METHOD)
            )
            return
        }
    }

    // 18.
    // commit
    //
    const [_18, err18] = await tran.commit(conn)

    if (err18) {
        errno = 18
        code = 400
        return tran.rollbackAndReturn(conn, code, err18, errno, METHOD)
    }

    // 19.
    //
    conn.end()
    const end = Date.now()
    console.log('/Trash Time: %d ms', end - start)
    //console.log("/trash accepted");

    return {
        err: 0,
        msg: old_status.document_uuid,
    }
}

module.exports = {
    trashInvoice,
}
