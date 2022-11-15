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

const tran = require('../invoice_sub_transaction.js')
const db = require('../../transaction.js');

// Database

const updateDraftDocument = async (conn, doc) => {

    let result, msg;

    const sql = `
		UPDATE
			seller_document_draft
		SET
			document_body = ?,
			document_totals = ?,
			document_meta = ?,
			subject_line = ?,
			buyer_did = ?,
			buyer_membername = ?,
			buyer_details = ?,
			document_json = ?
		WHERE
			document_uuid = ?
	`;

    const args = [
        JSON.stringify(doc.document_body),
        JSON.stringify(doc.document_totals),
        JSON.stringify(doc.document_meta),
        doc.subject_line
    ];


    if (doc.buyer_details) {
        args.push(doc.buyer_details.member_did);
        args.push(doc.buyer_details.membername);
        args.push(JSON.stringify(doc.buyer_details));
    } else {
        args.push(null);
        args.push(null);
        args.push(null);
    }

    args.push(JSON.stringify(doc.document_json));
    args.push(doc.document_uuid);

    try {
        result = await db.update(conn, sql, args);
    } catch (err) {

        console.log('----- HERE -----')
        console.log(conn);
        console.log(sql);
        console.log(args);
        console.error(err);
        msg = "Update error";
        return [false, msg];
    }

    if (result.affectedRows != 1) {
        msg = { msg: "insertArchiveStatus:result.affectedRows != 1" };
        return [false, msg];
    }

    return [result, null];
}


/*
 * updateDraftStatus
 */
const updateDraftStatus = async (conn, doc) => {

    let result, msg;

    const sql = `
		UPDATE
			seller_status_draft
		SET
			subject_line = ?,
			amount_due = ?,
			due_by = ?,
			buyer_did = ?,
			buyer_membername = ?,
			buyer_organization = ?
		WHERE
			document_uuid = ?
	`;

    const args = [
        doc.subject_line,
        doc.document_totals.total,
        doc.document_meta.due_by
    ];

    if (doc.buyer_details) {
        args.push(doc.buyer_details.member_did);
        args.push(doc.buyer_details.membername);
        args.push(doc.buyer_details.organization_name);
    } else {
        args.push(null);
        args.push(null);
        args.push(null);
    }

    args.push(doc.document_uuid);

    try {
        result = await db.update(conn, sql, args);
    } catch (err) {
        console.error(err);

        msg = "Update error";
        return [false, msg];
    }

    if (result.affectedRows != 1) {
        msg = { msg: "insertArchiveStatus:result.affectedRows != 1" };
        return [false, msg];
    }

    return [result, null];
}

const updateDraft = async (
    member_did, // string did:key:123
    invoiceDraft // obj
) => {

    const METHOD = '/update'

    let start = Date.now()
    let errno, code

    // 1.
    // begin Transaction
    //
    const [conn, _err] = await tran.connection()
    await tran.beginTransaction(conn)

    // 2.
    // Second we update the document

    const [_a, err2] = await updateDraftDocument(
        conn,
        invoiceDraft
    )

    if (err2) {
        console.log(err2)
        errno = 2
        code = 400
        await tran.rollbackAndReturn(conn, code, err2, errno, METHOD)
        throw new Error(err2)
    }

    // 3.
    // And then we update the status

    const [_b, err3] = await updateDraftStatus(
        conn,
        invoiceDraft
    )

    if (err3) {
        console.log(err3)
        errno = 3
        code = 400
        await tran.rollbackAndReturn(conn, code, err3, errno, METHOD)
        throw new Error(err3)
    }

    // 4.
    // commit
    //
    const [_4, err4] = await tran.commit(conn)

    if (err4) {
        errno = 4
        code = 400
        let msg = await tran.rollbackAndReturn(conn, code, err4, errno, METHOD)

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
    }

    // 5.
    //
    conn.end()

    let end = Date.now()
    console.log('update Time: %d ms', end - start)
}

module.exports = {
    updateDraft
}