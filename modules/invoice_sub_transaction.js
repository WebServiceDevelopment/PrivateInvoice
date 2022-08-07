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

// Database Libraries
const db					= require('../transaction.js');

// Exports 
module.exports = {
	exist_check				: _exist_check,
	notexist_check			: _notexist_check,
	checkForExistingDocument : _checkForExistingDocument,
	checkForNotExistingDocument : _checkForNotExistingDocument,

	getDraftDocument 		: _getDraftDocument,
	getDocument				: _getDocument,
	getStatus				: _getStatus,

	getBuyerDid 			: _getBuyerDid,
	getBuyerDidForDraft 	: _getBuyerDidForDraft,
	getBuyerHost 			: _getBuyerHost,

	getSellerDid 			: _getSellerDid,
	getSellerHost			: _getSellerHost,

	insertStatus			: _insertStatus,
	insertArchiveStatus		: _insertArchiveStatus,
	insertDocument			: _insertDocument,
	insertArchiveDocument	: _insertArchiveDocument,
	insertDraftDocument		: _insertDraftDocument,

	updateDraftDocument		: _updateDraftDocument,
	updateDraftStatus		: _updateDraftStatus,

	deleteStatus			: _deleteStatus,
	deleteDocument			: _deleteDocument,

	setConfirm 				: _setConfirm,
	setUnconfirm 			: _setUnconfirm,
	setMakePayment_status 	: _setMakePayment_status,
	setMakePayment_document	: _setMakePayment_document,
	setReturn 				: _setReturn,
	setWithdrawBuyer		: _setWithdrawBuyer,
	setWithdrawSeller		: _setWithdrawSeller,

	rollbackAndReturn		: _rollbackAndReturn,

	beginTransaction		: _beginTransaction,
	commit					: _commit,
	connection				: _connection,
	insert					: _insert,
	update					: _update,
	rollback				: _rollback,
	quety					: _query,
}

//------------------------------- export modules ------------------------------

/*
 * beginTransaction
 */
async function _beginTransaction (conn) {

	try  {
		await db.beginTransaction(conn);
		return [true, null];
	} catch (err) {
		return [false, err];
	}
}

/*
 * commit
 */
async function _commit (conn) {

	try  {
		await db.commit(conn);
		return [true, null];
	} catch (err) {
		return [false, err];
	}
}

/*
 * connection
 */
async function _connection () {

	try  {
		const conn = await db.connection();
		return [conn, null];
	} catch (err) {
		return [false, err];
	}
}

/*
 * insert
 */
async function _insert(conn, sql, args) {

	try {
    	const result = await db.insert(conn, sql, args);
		return [result, null];
	} catch(err) {
    	return [false, err];
	}
}

/*
 * update
 */
async function _update(conn, sql, args) {

	try {
    	const result = await db.update(conn, sql, args);
		return [result, null];
	} catch(err) {
    	return [false, err];
	}
}

/*
 * rollback
 */
async function _rollback(conn, err) {

	try {
    	await db.rollback(conn, err);
		return [true, err];
	} catch(err) {
    	return [false, err];
	}
}

/*
 * query
 */
async function _query(conn, sql, args) {

	try {
    	const result = await db.query(conn, sql, args);
		return [result, null];
	} catch(err) {
    	return [false, err];
	}
}

/*
 * exist_cehck
 */
async function _exist_check(conn, table, uuid) {

	let result, err;

	const sql = `
		SELECT
			count(*) AS num
		FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	const args = [
		uuid,
	];

	try {
		result = await db.selectOne(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
	}

	//console.log("result.num ="+result.num);

	if ( result.num == 1 ) {
		return [true, null];
	} else {
		return [false, err];
	}

}

/*
 * nonexist_cehck
 */
async function _notexist_check(conn, table, uuid) {

	let result, err;

	const sql = `
		SELECT
			count(*) AS num
		FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	const args = [
		uuid,
	];

	try {
		result = await db.selectOne(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
	}

	//console.log("result.num ="+result.num);

	if ( result.num == 0 ) {
		return [true, null];
	} else {
		return [false, err];
	}

}

/*
 * checkForExistingDocument
 */
async function _checkForExistingDocument (conn, table, document_uuid ) {

	let result, err;

    const sql = `
        SELECT
            COUNT(*) AS num
        FROM
            ${table}
        WHERE
            document_uuid = ?
    `;

    const args = [ document_uuid ];

	try {
    	result = await db.selectOne(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
	}

    if(result.num) {
        err = {msg:'Document Uuid already exists in database'};
		return [false, err];
    }

	return [true, null];
}

/*
 * checkForNonexistingDocument
 */
async function _checkForNotExistingDocument (conn, table, document_uuid ) {

    const sql = `
        SELECT
            COUNT(*) AS num
        FROM
            ${table}
        WHERE
            document_uuid = ?
    `;

    const args = [ document_uuid ];

    const { num } = await db.selectOne(sql, args);

    if(num == 0) {
		return new Error('DOcument Uuid not exists in database yet');
    }

    return null;
}

/*
 * getDraftDocument
 */
async function _getDraftDocument(conn, table, uuid) {

	let document;

	const sql = `
		SELECT 
			document_uuid,
			document_type,
			subject_line,
			currency_options,
			seller_did,
			seller_membername,
			seller_details,
			buyer_did,
			buyer_membername,
			buyer_details,
			created_on,
			document_meta,
			document_body,
			document_totals,
			document_logo
		FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	const args = [
		uuid
	];

	try {
		document = await db.selectOne(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
	}
	//console.log(document)

	return [document, null];

}

/*
 * getDocument
 */
async function _getDocument(conn, table, uuid) {

	let result;

	const sql = `
		SELECT 
			document_uuid,
			document_json,
            settlement_currency,
            settlement_hash,
            settlement_time
		FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	const args = [
		uuid
	];

	try {
		result = await db.selectOne(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
	}

	return [result, null];

}
	
/*
 * getStatus
 */
async function _getStatus(conn, table, uuid) {

	let status;

	const sql = `
		SELECT 
			document_uuid,
			document_type,
			document_number,
			seller_did,
			seller_membername,
			seller_organization,
			seller_archived,
			seller_last_action,
			buyer_did,
			buyer_membername,
			buyer_organization,
			buyer_archived,
			buyer_last_action,
			created_from,
			root_document,
			created_on,
			removed_on,
			opened,
			subject_line,
			due_by,
			amount_due
		FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	const args = [
		uuid
	];

	try {
		status = await db.selectOne(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
	}

	return [status , null];
}

/*
 * getBuyerDid
 */
async function _getBuyerDid (conn, table, document_uuid, seller_did) {

	let result;

    const sql = `
        SELECT
            buyer_did
        FROM
            ${table}
        WHERE
            document_uuid = ?
        AND
            seller_did = ?
    `;

    const args = [
        document_uuid,
        seller_did
    ];

    try {
        result = await db.selectOne(conn, sql, args);
        if(!result) {
            return [ null, new Error('buyer_did not found for document_uuid') ];
        }
        const { buyer_did } = result;
        return [ buyer_did, null ];

    } catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
    }

}

/*
 * getBuyerDidForDraft
 */
async function _getBuyerDidForDraft (conn, table, document_uuid, seller_did) {

	let result;

    const sql = `
        SELECT
            buyer_did
        FROM
			${table}
        WHERE
            document_uuid = ?
		AND
			seller_did = ?
    `;

    const args = [
        document_uuid,
		seller_did
    ];

    try {
        result = await db.selectOne(conn, sql, args);
        if(!result) {
            return [ null, new Error('buyer_did not found for document_uuid') ];
        }
        const { buyer_did } = result;
        return [ buyer_did, null ];

    } catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
    }

}

/*
 * getSellerDid
 */
async function _getSellerDid (conn, table, document_uuid, buyer_did) {

	let result;

    const sql = `
        SELECT
            seller_did
        FROM
            ${table}
        WHERE
            document_uuid = ?
        AND
            buyer_did = ?
    `;

    const args = [
        document_uuid,
        buyer_did
    ];

    try {
        result = await db.selectOne(conn, sql, args);
    } catch(err) {
        return [ null, err ];
    }

	if(!result) {
		return [ null, new Error('seller_did not found for document_uuid') ];
    }
    const { seller_did } = result;
    return [ seller_did, null ];

}

/*
 * getSellerHost
 */
async function _getSellerHost (conn, table,  seller_did, buyer_did) {

	let result, err;

    const sql = `
        SELECT
            seller_host
        FROM
            ${table}
        WHERE
            seller_did = ?
        AND
            buyer_did = ?
    `;

    const args = [
        seller_did,
        buyer_did
    ];

    try {
    	result = await db.selectOne(conn, sql, args);
    	//console.log(result);
    } catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
	}

    if(!result) {
        err = {msg:'No contact information was found for this invoice'};
        return [ null, err ];
    }

    const { seller_host } = result;
    return [ seller_host, null ];

}

/*
 * getBuyerHost
 */
async function _getBuyerHost (conn, table,  seller_did, buyer_did) {

	let result, err;

    const sql = `
        SELECT
            buyer_host
        FROM
            ${table}
        WHERE
            seller_did = ?
        AND
            buyer_did = ?
    `;

    const args = [
        seller_did,
        buyer_did
    ];

	try {
	    result = await db.selectOne(conn, sql, args);
		//console.log(result);
	} catch(err) {
		console.error(err);

		let mag = "Select error";
		return [false, msg];
	}
	if(!result) {
     	err = {msg:'buyer_host not found for buyer_did'};
      	return [ null, err ];
   	}

   	const { buyer_host } = result;
   	return [ buyer_host, null ];

}

/*
 * insertDraftDocument
 */
async function _insertDraftDocument(conn, table, document) {

	let result, err;

	const sql = `
		INSERT INTO ${table} (

			document_uuid,
			document_json,
			document_type,

			subject_line,
			currency_options,

			seller_did,
			seller_membername,
			seller_details,

			document_meta,
			document_body,
			document_totals,

			buyer_did,
			buyer_membername,
			buyer_details

		) VALUES (
			?,
			?,
			?,

			?,
			?,

			?,
			?,
			?,

			?,
			?,
			?,

			?,
			?,
			?
		)
	`;

	const args = [
		document.document_uuid,
		document.document_json,
		document.document_type,

		document.subject_line,
		document.currency_options,

		document.seller_did,
		document.seller_membername,
		document.seller_details,

		document.document_meta,
		document.document_body,
		document.document_totals,

		document.buyer_did,
		document.buyer_membername,
		document.buyer_details
	];

	try {
		result = await db.insert(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Insert error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"insertDraftDocument:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
 * insertDocument
 */
async function _insertDocument(conn, table, status, document_json) {

	let result, err;

	const sql = `
		INSERT INTO ${table} (
			document_uuid,
			document_json
		) VALUES (
			?,
			?
		)
	`;

	const args = [
		status.document_uuid,
		document_json
	];

	try {
		result = await db.insert(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Insert error";
		return [false, msg];
	}
	if(result.affectedRows != 1) {
		err  = {msg:"insertDocument:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
 * insertArchiveDocument
 */
async function _insertArchiveDocument(conn, table, document) {

	let result, err;

	const sql = `
		INSERT INTO ${table} (
			document_uuid,
			document_json,
			settlement_currency,
            settlement_hash,
            settlement_time
		) VALUES (
			?,
			?,
			?,
			?,
			?
		)
	`;

	const args = [
		document.document_uuid,
		document.document_json,
        document.settlement_currency,
        document.settlement_hash,
        document.settlement_time
	];

	try {
		result = await db.insert(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Insert error";
		return [false, msg];
	}
	if(result.affectedRows != 1) {
		err  = {msg:"insertArchiveDocument:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}
	
/*
 * insertStatust
 */
async function _insertStatus(conn, table, status) {

	let result, err;

	const sql = `
		INSERT INTO ${table} (
			document_uuid,
			document_type,
			document_number,
			document_folder,

			seller_did,
			seller_membername,
			seller_organization,
			seller_last_action,

			buyer_did,
			buyer_membername,
			buyer_organization,

			subject_line,
			due_by,
			amount_due,
			created_from
		) VALUES (
			?,
			?,
			?,
			?,

			?,
			?,
			?,
			NOW(),

			?,
			?,
			?,
			?,
			?,
			?,
			?
		)
	`;

	const args = [
		status.document_uuid,
		status.document_type,
		status.document_number,
		status.document_folder,
		status.seller_did,
		status.seller_membername,
		status.seller_organization,
		status.buyer_did,
		status.buyer_membername,
		status.buyer_organization,
		status.subject_line,
		status.due_by,
		status.amount_due,
		status.created_from
	];

	//console.log("created_from="+created_from)
	//console.log("row.document_uuid="+row.document_uuid)

	try {
		result = await db.insert(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Insert error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"insertStatust:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
 * insertArchiveStatus
 */
async function _insertArchiveStatus(conn, table, status) {

	let result, err;

	const sql = `
		INSERT INTO ${table} (
			document_uuid,
			document_type,
			document_number,
			document_folder,

			seller_did,
			seller_membername,
			seller_organization,

			seller_archived,
			seller_last_action,

			buyer_did,
			buyer_membername,
			buyer_organization,

			buyer_archived,
			subject_line,
			due_by,
			amount_due,
			created_from
		) VALUES (
			?,
			?,
			?,
			?,

			?,
			?,
			?,
			?,
			NOW(),

			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?
		)
	`;

	const args = [
		status.document_uuid,
		status.document_type,
		status.document_number,
		status.document_folder,
		status.seller_did,
		status.seller_membername,
		status.seller_organization,
		status.seller_archived,
		status.buyer_did,
		status.buyer_membername,
		status.buyer_organization,
		status.buyer_archived,
		status.subject_line,
		status.due_by,
		status.amount_due,
		status.created_from
	];

	//console.log("created_from="+created_from)
	//console.log("row.document_uuid="+row.document_uuid)

	try {
		result = await db.insert(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Insert error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"insertArchiveStatus:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
 * updateDraftDocument
 */
async function _updateDraftDocument(conn, table, req) {

	let result, err;

	let sql = `
		UPDATE
			${table}
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

	let args = [
		JSON.stringify(req.body.document_body),
		JSON.stringify(req.body.document_totals),
		JSON.stringify(req.body.document_meta),
		req.body.subject_line
	];


	if(req.body.buyer_details) {
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
	} catch(err) {
		console.error(err);

		let mag = "Update error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"insertArchiveStatus:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null ];
}

/*
 * updateDraftStatus
 */
async function _updateDraftStatus(conn, table, req) {

	let sql, args;

	sql = `
		UPDATE
			${table}
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

	args = [
		req.body.subject_line,
		req.body.document_totals.total,
		req.body.document_meta.due_by
	];

	if(req.body.buyer_details) {
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
	} catch(err) {
		console.error(err);

		let mag = "Update error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"insertArchiveStatus:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null ];
}

/*
 * deleteStatus
 */
async function _deleteStatus(conn, table, status) {

	let result, err;

	const sql = `
		DELETE FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	const args = [
		status.document_uuid
	];

	try {
		result = await db.delete(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Delete error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		err  = "deleteStatus:result.affectedRows != 1";
		return [false, err];
	}

	return [result, null];
}

/*
 * deleteDocument
 */
async function _deleteDocument(conn, table, status) {

	let result, err;

	const sql = `
		DELETE FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	const args = [
		status.document_uuid
	];

	try {
		result = await db.delete(conn, sql, args);
	} catch(err) {
		console.error(err);

		let mag = "Delete error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"deleteDocument:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
 * setConfirm
 */
async function _setConfirm (conn, table, document_uuid , buyer_did) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'confirmed'
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
            document_folder = 'sent'
        AND
            document_type = 'invoice'
    `;

    let args = [
        buyer_did,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		console.error(err);

		let mag = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"setConfirm:result.affectedRows != 1"};
		return [false, err];
	}

    return [result, null];
}

/*
 * setUnconfirm
 */
async function _setUnconfirm (conn, table, document_uuid , buyer_did) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'sent'
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
            document_folder = 'confirmed'
        AND
            document_type = 'invoice'
    `;

    let args = [
        buyer_did,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		console.error(err);

		let mag = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"setUnconfirm:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
 * setMakePayment_status
 */
async function _setMakePayment_status (conn, table, document_uuid , buyer_did) {

	const RESERVATION = 0;

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'paid',
			opened = ${RESERVATION}
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
			document_folder = 'confirmed'
        AND
            document_type = 'invoice'
    `;

    let args = [
        buyer_did,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		console.error(err);

		let mag = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"setMakePayment_status:result.affectedRows != 1"};
		return [false, err];
	}

    return [result, null];
}

/*
 * setMakePayment_document
 */
async function _setMakePayment_document (conn, table, document_uuid , hash) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
			settlement_hash = ?,
			settlement_time = NOW()
        WHERE
            document_uuid = ?
    `;

    let args = [
        hash,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		console.error(err);

		let mag = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"setMakePayment_document:result.affectedRows != 1"};
		return [false, err];
	}

    return [result, null];
}

/*
 * setWithdrawSeller
 */
async function _setWithdrawSeller (conn, table, document_uuid , seller_did, document_folder) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'returned'
        WHERE
            seller_did = ?
        AND
            document_uuid = ?
        AND
            document_folder = ?
        AND
            document_type = 'invoice'
    `;

    let args = [
        seller_did,
        document_uuid,
        document_folder
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		console.error(err);

		let mag = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"setWithdrawSeller:result.affectedRows != 1"};
		return [false, err];
	}


	return [result, null];
}

/*
 * setWithdrawBuyer
 */
async function _setWithdrawBuyer (conn, table, document_uuid , buyer_did, document_folder) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'returned'
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
            document_folder = ?
        AND
            document_type = 'invoice'
    `;

    let args = [
        buyer_did,
        document_uuid,
        document_folder
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		console.error(err);

		let mag = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"setWithdrawBuyer:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
 * setReturn
 */
async function _setReturn (conn, table, document_uuid , buyer_did) {

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'returned'
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
            document_folder = 'sent'
        AND
            document_type = 'invoice'
    `;

    let args = [
        buyer_did,
        document_uuid
    ];

    let result, err;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		console.error(err);

		let mag = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"setReturn:result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
 * rollbackAndReturn
 */
async function _rollbackAndReturn(conn, code, err, errno, method) {

	try {
    	await db.rollback(conn, err);
	} catch(err) {
    	conn.end();
    	return {"err":errno, msg:`${method}:Rollback error`};
	}
    conn.end();

    console.log("Error errno="+errno+" :code="+code);

    let rt;

    if(code == 500) {
        rt = {"err":code, msg:"buyer connect check:ECONNRESET"};
    } else {
   		let msg;

		if(typeof err === 'string') {
			msg =err;
		} else if(typeof err == "object"){
			try {
				msg = err.toString()
			} catch(e) {
				try {
					JSON.parse(err) ;
					if(err.sqlMessage != null) {
						msg = err.sqlMessage;
					} else {
						console.error(err);
						msg = "unknown cause"
					}
				} catch(e) {
					msg = "unknown cause"
				}
			}
		} else {
			msg = err;
		}

        rt = {"err":errno, msg:`${methos}:${msg}`};
    }
    return rt;
}

