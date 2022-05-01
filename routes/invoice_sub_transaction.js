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
const db = require('../transaction.js');

// Exports 
module.exports = {
	exist_check				: api_exist_check,
	notexist_check			: api_notexist_check,
	checkForExistingDocument : api_checkForExistingDocument,
	checkForNotExistingDocument : api_checkForNotExistingDocument,

	getDraftDocument 		: api_getDraftDocument,
	getDocument				: api_getDocument,
	getStatus				: api_getStatus,

	getClientUuid 			: api_getClientUuid,
	getClientUuidForDraft 	: api_getClientUuidForDraft,
	getClientHost 			: api_getClientHost,

	getSupplierUuid 		: api_getSupplierUuid,
	getSupplierHost			: api_getSupplierHost,

	insertStatus			: api_insertStatus,
	insertArchiveStatus		: api_insertArchiveStatus,
	insertDocument			: api_insertDocument,
	insertDraftDocument		: api_insertDraftDocument,

	deleteStatus			: api_deleteStatus,
	deleteDocument			: api_deleteDocument,

	setConfirm 				: api_setConfirm,
	setUnconfirm 			: api_setUnconfirm,
	setMakePayment 			: api_setMakePayment,
	setReturn 				: api_setReturn,
	setWithdrawClient		: api_setWithdrawClient,
	setWithdrawSupplier		: api_setWithdrawSupplier,

	rollbackAndReturn		: api_rollbackAndReturn,

	beginTransaction		: api_beginTransaction,
	commit					: api_commit,
	connection				: api_connection,
	insert					: api_insert,
	update					: api_update,
	rollback				: api_rollback,
	quety					: api_query,
}

//api modules
async function api_beginTransaction (conn) {

	try  {
		await db.beginTransaction(conn);
		return [true, null];
	} catch (err) {
		return [false, err];
	}
}

async function api_commit (conn) {

	try  {
		await db.commit(conn);
		return [true, null];
	} catch (err) {
		return [false, err];
	}
}

async function api_connection () {

	try  {
		const conn = await db.connection();
		return [conn, null];
	} catch (err) {
		return [false, err];
	}
}

async function api_insert(conn, sql, args) {

	try {
    	const result = await db.insert(conn, sql, args);
		return [result, null];
	} catch(err) {
    	return [false, err];
	}
}

async function api_update(conn, sql, args) {

	try {
    	const result = await db.update(conn, sql, args);
		return [result, null];
	} catch(err) {
    	return [false, err];
	}
}

async function api_rollback(conn, err) {

	try {
    	await db.rollback(conn, err);
		return [true, err];
	} catch(err) {
    	return [false, err];
	}
}

async function api_query(conn, sql, args) {

	try {
    	const result = await db.query(conn, sql, args);
		return [result, null];
	} catch(err) {
    	return [false, err];
	}
}

async function api_exist_check(conn, table, uuid) {

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
		return [false, err];
	}

	//console.log("result.num ="+result.num);

	if ( result.num == 1 ) {
		return [true, null];
	} else {
		return [false, err];
	}

}

async function api_notexist_check(conn, table, uuid) {

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
		return [false, err];
	}

	//console.log("result.num ="+result.num);

	if ( result.num == 0 ) {
		return [true, null];
	} else {
		return [false, err];
	}

}

async function api_checkForExistingDocument (conn, table, document_uuid ) {

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
		return [false, err];
	}

    if(result.num) {
        err = {msg:'Document Uuid already exists in database'};
		return [false, err];
    }

	return [true, null];
}

async function api_checkForNotExistingDocument (conn, table, document_uuid ) {

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


async function api_getDraftDocument(conn, table, uuid) {

	let document;

	const sql = `
		SELECT 
			document_uuid,
			document_type,
			subject_line,
			currency_options,
			supplier_uuid,
			supplier_username,
			supplier_details,
			client_uuid,
			client_username,
			client_details,
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
		return [null, err];
	}
	//console.log(document)

	return [document, null];

}

async function api_getDocument(conn, table, uuid) {

	let document;

	const sql = `
		SELECT 
			document_uuid,
			document_json
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
		return [null, err];
	}

	return [document, null];

}
	
async function api_getStatus(conn, table, uuid) {

	let status;

	const sql = `
		SELECT 
			document_uuid,
			document_type,
			document_number,
			supplier_uuid,
			supplier_username,
			supplier_company,
			supplier_archived,
			supplier_last_action,
			client_uuid,
			client_username,
			client_company,
			client_archived,
			client_last_action,
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
		return [null , err];
	}
	//console.log(status)

	return [status , null];
}

async function api_getClientUuid (conn,table, document_uuid, supplier_uuid) {

	let result;

    const sql = `
        SELECT
            client_uuid
        FROM
            ${table}
        WHERE
            document_uuid = ?
        AND
            supplier_uuid = ?
    `;

    const args = [
        document_uuid,
        supplier_uuid
    ];

    try {
        result = await db.selectOne(conn, sql, args);
        if(!result) {
            return [ null, new Error('client_uuid not found for document_uuid') ];
        }
        const { client_uuid } = result;
        return [ client_uuid, null ];

    } catch(err) {
        return [ null, err ];
    }

}


async function api_getClientUuidForDraft (conn,table, document_uuid, supplier_uuid) {

	let result;

    const sql = `
        SELECT
            client_uuid
        FROM
			${table}
        WHERE
            document_uuid = ?
		AND
			supplier_uuid = ?
    `;

    const args = [
        document_uuid,
		supplier_uuid
    ];

    try {
        result = await db.selectOne(conn, sql, args);
        if(!result) {
            return [ null, new Error('client_uuid not found for document_uuid') ];
        }
        const { client_uuid } = result;
        return [ client_uuid, null ];

    } catch(err) {
        return [ null, err ];
    }

}


async function api_getSupplierUuid (conn,table, document_uuid, client_uuid) {

	let result;

    const sql = `
        SELECT
            supplier_uuid
        FROM
            ${table}
        WHERE
            document_uuid = ?
        AND
            client_uuid = ?
    `;

    const args = [
        document_uuid,
        client_uuid
    ];

    try {
        result = await db.selectOne(conn, sql, args);
    } catch(err) {
        return [ null, err ];
    }

	if(!result) {
		return [ null, new Error('supplier_uuid not found for document_uuid') ];
    }
    const { supplier_uuid } = result;
    return [ supplier_uuid, null ];

}

async function api_getSupplierHost (conn,table,  supplier_uuid, client_uuid) {

	let result, err;

    const sql = `
        SELECT
            supplier_host
        FROM
            ${table}
        WHERE
            supplier_uuid = ?
        AND
            client_uuid = ?
    `;

    const args = [
        supplier_uuid,
        client_uuid
    ];

    try {
    	result = await db.selectOne(conn, sql, args);
    	//console.log(result);
    } catch(err) {
        return [ null, err ];
	}

    if(!result) {
        err = {msg:'No contact information was found for this invoice'};
        return [ null, err ];
    }

    const { supplier_host } = result;
    return [ supplier_host, null ];

}

async function api_getClientHost (conn,table,  supplier_uuid, client_uuid) {

	let result, err;

    const sql = `
        SELECT
            client_host
        FROM
            ${table}
        WHERE
            supplier_uuid = ?
        AND
            client_uuid = ?
    `;

    const args = [
        supplier_uuid,
        client_uuid
    ];

	try {
	    result = await db.selectOne(conn, sql, args);
		//console.log(result);
	} catch(err) {
		return [ null, err ];
	}
	if(!result) {
     	err = {msg:'client_host not found for client_uuid'};
      	return [ null, err ];
   	}

   	const { client_host } = result;
   	return [ client_host, null ];

}

async function api_insertDraftDocument(conn,table, document) {

	let result, err;

	const sql = `
		INSERT INTO ${table} (

			document_uuid,
			document_type,

			subject_line,
			currency_options,

			supplier_uuid,
			supplier_username,
			supplier_details,

			document_meta,
			document_body,
			document_totals,

			client_uuid,
			client_username,
			client_details

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
			?
		)
	`;

	const args = [
		document.document_uuid,
		document.document_type,

		document.subject_line,
		document.currency_options,

		document.supplier_uuid,
		document.supplier_username,
		document.supplier_details,

		document.document_meta,
		document.document_body,
		document.document_totals,

		document.client_uuid,
		document.client_username,
		document.client_details
	];

	try {
		result = await db.insert(conn, sql, args);
	} catch(err) {
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

async function api_insertDocument(conn,table, status, document_json) {

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
		return [false, err];
	}
	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}
	
	
async function api_insertStatus(conn,table, status) {

	let result, err;

	const sql = `
		INSERT INTO ${table} (
			document_uuid,
			document_type,
			document_number,
			document_folder,

			supplier_uuid,
			supplier_username,
			supplier_company,
			supplier_last_action,

			client_uuid,
			client_username,
			client_company,

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
		status.supplier_uuid,
		status.supplier_username,
		status.supplier_company,
		status.client_uuid,
		status.client_username,
		status.client_company,
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
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

async function api_insertArchiveStatus(conn,table, status) {

	let result, err;

	const sql = `
		INSERT INTO ${table} (
			document_uuid,
			document_type,
			document_number,
			document_folder,

			supplier_uuid,
			supplier_username,
			supplier_company,

			supplier_archived,
			supplier_last_action,

			client_uuid,
			client_username,
			client_company,

			client_archived,
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
		status.supplier_uuid,
		status.supplier_username,
		status.supplier_company,
		status.supplier_archived,
		status.client_uuid,
		status.client_username,
		status.client_company,
		status.client_archived,
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
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}


async function api_deleteStatus(conn,table, status) {

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
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = "result.affectedRows != 1";
		return [false, err];
	}

	return [result, null];
}

async function api_deleteDocument(conn,table, status) {

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
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}



async function api_setConfirm (conn,table, document_uuid , client_uuid) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'confirmed'
        WHERE
            client_uuid = ?
        AND
            document_uuid = ?
        AND
            document_folder = 'sent'
        AND
            document_type = 'invoice'
    `;

    let args = [
        client_uuid,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
        return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

    return [result, null];
}

async function api_setUnconfirm (conn,table, document_uuid , client_uuid) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'sent'
        WHERE
            client_uuid = ?
        AND
            document_uuid = ?
        AND
            document_folder = 'confirmed'
        AND
            document_type = 'invoice'
    `;

    let args = [
        client_uuid,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

async function api_setMakePayment (conn,table, document_uuid , client_uuid) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'paid'
        WHERE
            client_uuid = ?
        AND
            document_uuid = ?
        AND
			document_folder = 'confirmed'
        AND
            document_type = 'invoice'
    `;

    let args = [
        client_uuid,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
        return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

    return [result, null];
}

async function api_setWithdrawSupplier (conn,table, document_uuid , supplier_uuid, document_folder) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'returned'
        WHERE
            supplier_uuid = ?
        AND
            document_uuid = ?
        AND
            document_folder = ?
        AND
            document_type = 'invoice'
    `;

    let args = [
        supplier_uuid,
        document_uuid,
        document_folder
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}


	return [result, null];
}

async function api_setWithdrawClient (conn,table, document_uuid , client_uuid, document_folder) {

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'returned'
        WHERE
            client_uuid = ?
        AND
            document_uuid = ?
        AND
            document_folder = ?
        AND
            document_type = 'invoice'
    `;

    let args = [
        client_uuid,
        document_uuid,
        document_folder
    ];

    let result;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

async function api_setReturn (conn,table, document_uuid , client_uuid) {

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'returned'
        WHERE
            client_uuid = ?
        AND
            document_uuid = ?
        AND
            document_folder = 'sent'
        AND
            document_type = 'invoice'
    `;

    let args = [
        client_uuid,
        document_uuid
    ];

    let result, err;

    try {
        result = await db.update(conn, sql, args);
    } catch(err) {
		return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

async function api_rollbackAndReturn(conn, code, err, errno) {

	try {
    	await db.rollback(conn, err);
	} catch(err) {
    	conn.end();
    	return {"err":err};
	}
    conn.end();

    console.log("Error errno="+errno+" :code="+code);

    let msg;
    if(code == 500) {
        msg = {"err":"client connect check:ECONNRESET"};
    } else {
        msg = {"err":err};
    }
    return msg;
}

