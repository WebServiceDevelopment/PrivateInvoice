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
const db = require('../database.js');

// Database

const updateDraftDocument = async (conn, req) => {

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
        JSON.stringify(req.body.document_body),
        JSON.stringify(req.body.document_totals),
        JSON.stringify(req.body.document_meta),
        req.body.subject_line
    ];


    if (req.body.buyer_details) {
        args.push(req.body.buyer_details.member_did);
        args.push(req.body.buyer_details.membername);
        args.push(JSON.stringify(req.body.buyer_details));
    } else {
        args.push(null);
        args.push(null);
        args.push(null);
    }

    args.push(JSON.stringify(req.body.document_json));
    args.push(req.body.document_uuid);

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


/*
 * updateDraftStatus
 */
const updateDraftStatus = async (conn, table, req) => {

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
        req.body.subject_line,
        req.body.document_totals.total,
        req.body.document_meta.due_by
    ];

    if (req.body.buyer_details) {
        args.push(req.body.buyer_details.member_did);
        args.push(req.body.buyer_details.membername);
        args.push(req.body.buyer_details.organization_name);
    } else {
        args.push(null);
        args.push(null);
        args.push(null);
    }

    args.push(req.body.document_uuid);

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

const updateDraft = async () => {

    const METHOD = '/update'

    let start = Date.now()

    let errno, code

    // 1.
    // begin Transaction
    //
    const [conn, _1] = await tran.connection()
    await tran.beginTransaction(conn)

    // 2.
    // Second we update the document

    const [result2, err2] = await updateDraftDocument(
        conn,
        req
    )

    if (err2) {
        console.log(err2)
        errno = 2
        code = 400
        let msg = await tran.rollbackAndReturn(conn, code, err2, errno, METHOD)

        res.status(400).json({
            err: 2,
            msg: msg,
        })
        return
    }

    // 3.
    // And then we update the status

    const [result3, err3] = await updateDraftStatus(
        conn,
        req
    )

    if (err3) {
        console.log(err3)
        errno = 3
        code = 400
        let msg = await tran.rollbackAndReturn(conn, code, err3, errno, METHOD)

        res.status(400).json({
            err: 3,
            msg: msg,
        })
        return
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