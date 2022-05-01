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
const db = require('../database.js');

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
	setPaymentReservation 	: api_setPaymentReservation,
	setMakePayment 			: api_setMakePayment,
	setWithdrawClient		: api_setWithdrawClient,
	setWithdrawSupplier		: api_setWithdrawSupplier,
	setReturn 				: api_setReturn,

	rollbackReturnToSent	: api_rollbackReturnToSent.bind(this),
	rollbackConfirmToSent	: api_rollbackConfirmToSent.bind(this),
	rollbackSentToConfirm	: api_rollbackSentToConfirm.bind(this),
	rollbackPaidToConfirm	: api_rollbackPaidToConfirm.bind(this),
}

//api modules

async function api_exist_check( table, uuid) {

	let sql, args, result, err;

	sql = `
		SELECT
			count(*) AS num
		FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	args = [
		uuid,
	];

	try {
		result = await db.selectOne(sql, args);
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

async function api_notexist_check( table, uuid) {

	let sql, args, result, err;

	sql = `
		SELECT
			count(*) AS num
		FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	args = [
		uuid,
	];

	try {
		result = await db.selectOne(sql, args);
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

async function api_checkForExistingDocument (table, document_uuid ) {

	let sql, args, result, err;

    sql = `
        SELECT
            COUNT(*) AS num
        FROM
            ${table}
        WHERE
            document_uuid = ?
    `;

    args = [ document_uuid ];

	try {
    	result = await db.selectOne(sql, args);
	} catch(err) {
		return [false, err];
	}

    if(result.num) {
        err = {msg:'Document Uuid already exists in database'};
		return [false, err];
    }

	return [true, null];
}

async function api_checkForNotExistingDocument (table, document_uuid ) {

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


async function api_getDraftDocument(table, uuid) {

	let sql, args, document;

	sql = `
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

	args = [
		uuid
	];

	try {
		document = await db.selectOne(sql, args);
	} catch(err) {
		return [null, err];
	}
	//console.log(document)

	return [document, null];

}

async function api_getDocument(table, uuid) {

	let sql, args, document;

	sql = `
		SELECT 
			document_uuid,
			document_json
		FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	args = [
		uuid
	];

	try {
		document = await db.selectOne(sql, args);
	} catch(err) {
		return [null, err];
	}

	return [document, null];

}
	
async function api_getStatus(table, uuid) {

	let sql, args, status;

	sql = `
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

	args = [
		uuid
	];

	try {
		status = await db.selectOne(sql, args);
	} catch(err) {
		return [null , err];
	}
	//console.log(status)

	return [status , null];
}

async function api_getClientUuid (table, document_uuid, supplier_uuid) {

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
        result = await db.selectOne(sql, args);
        if(!result) {
            return [ null, new Error('client_uuid not found for document_uuid') ];
        }
        const { client_uuid } = result;
        return [ client_uuid, null ];

    } catch(err) {
        return [ null, err ];
    }

}


async function api_getClientUuidForDraft (table, document_uuid, supplier_uuid) {

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
        result = await db.selectOne(sql, args);
        if(!result) {
            return [ null, new Error('client_uuid not found for document_uuid') ];
        }
        const { client_uuid } = result;
        return [ client_uuid, null ];

    } catch(err) {
        return [ null, err ];
    }

}


async function api_getSupplierUuid (table, document_uuid, client_uuid) {

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
        result = await db.selectOne(sql, args);
    } catch(err) {
        return [ null, err ];
    }

	if(!result) {
		return [ null, new Error('supplier_uuid not found for document_uuid') ];
    }
    const { supplier_uuid } = result;
    return [ supplier_uuid, null ];

}

async function api_getSupplierHost (table,  supplier_uuid, client_uuid) {
	//console.log("getSupplierHost");

	let result, err;

    const sql = `
        SELECT
            remote_origin AS supplier_host
        FROM
            ${table}
        WHERE
            remote_user_uuid = ?
        AND
            local_user_uuid = ?
		AND
			remote_to_local = 1
    `;

    const args = [
        supplier_uuid,
        client_uuid
    ];

    try {
    	result = await db.selectOne(sql, args);
    	//console.log(result);
    } catch(err) {
        return [ null, err ];
	}

    if(!result) {
     	err = {msg:'supplier_host not found for supplier_uuid:'+supplier_uuid+":"+client_uuid};
        return [ null, err ];
    }

    const { supplier_host } = result;
    return [ supplier_host, null ];

}

async function api_getClientHost (table,  supplier_uuid, client_uuid) {
	//console.log("getClientHost");

	let result, err;

    const sql = `
        SELECT
            remote_origin AS client_host
        FROM
            ${table}
        WHERE
            local_user_uuid = ?
        AND
            remote_user_uuid = ?
		AND
			local_to_remote = 1
    `;

    const args = [
        supplier_uuid,
        client_uuid
    ];

	try {
	    result = await db.selectOne(sql, args);
		//console.log(result);
	} catch(err) {
		return [ null, err ];
	}
	if(!result) {
     	err = {msg:'client_host not found for client_uuid:'+supplier_uuid+":"+client_uuid};
      	return [ null, err ];
   	}

   	const { client_host } = result;
   	return [ client_host, null ];

}

async function api_insertDraftDocument(table, document) {

	let sql, args , result, err;

	sql = `
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

	args = [
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
		result = await db.insert(sql, args);
	} catch(err) {
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

async function api_insertDocument(table, status, document_json) {

	let sql, args, result, err;

	sql = `
		INSERT INTO ${table} (
			document_uuid,
			document_json
		) VALUES (
			?,
			?
		)
	`;

	args = [
		status.document_uuid,
		document_json
	];

	try {
		result = await db.insert(sql, args);
	} catch(err) {
		return [false, err];
	}
	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}
	
	
async function api_insertStatus(table, status) {

	let sql, args, result, err;

	sql = `
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

	args = [
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
		result = await db.insert(sql, args);
	} catch(err) {
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

async function api_insertArchiveStatus(table, status) {

	let sql, args, result, err;

	sql = `
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

	args = [
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
		result = await db.insert(sql, args);
	} catch(err) {
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}


async function api_deleteStatus(table, status) {

	let sql, args, result, err;

	sql = `
		DELETE FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	args = [
		status.document_uuid
	];

	try {
		result = await db.delete(sql, args);
	} catch(err) {
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = "result.affectedRows != 1";
		return [false, err];
	}

	return [result, null];
}

async function api_deleteDocument(table, status) {

	let sql, args, result, err;

	sql = `
		DELETE FROM
			${table}
		WHERE
			document_uuid = ?
	`;

	args = [
		status.document_uuid
	];

	try {
		result = await db.delete(sql, args);
	} catch(err) {
		return [false, err];
	}

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}


/*
* sent to confirm
*/
async function api_setConfirm (table, document_uuid , client_uuid) {

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
        result = await db.update(sql, args);
    } catch(err) {
        return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

    return [result, null];
}


async function api_setUnconfirm (table, document_uuid , client_uuid) {

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
        result = await db.update(sql, args);
    } catch(err) {
		return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

async function api_setPaymentReservation (table, document_uuid , client_uuid) {

	const RESERVATION = 8;
	const RESERVATION_1 = 0;
	const RESERVATION_2 = 1;


	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            opened = opened + ${RESERVATION} 
        WHERE
            client_uuid = ?
        AND
            document_uuid = ?
        AND
			document_folder = 'confirmed'
        AND
            document_type = 'invoice'
		AND
			opened in (${RESERVATION_1} , ${RESERVATION_2})
    `;

    let args = [
        client_uuid,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(sql, args);
    } catch(err) {
        return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

    return [result, null];
}

async function api_setMakePayment (table, document_uuid , client_uuid) {

	const RESERVATION = 0;
	const RESERVATION_1 = 8;
	const RESERVATION_2 = 9;

	let err;

    let sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'paid',
			opened = ${RESERVATION}
        WHERE
            client_uuid = ?
        AND
            document_uuid = ?
        AND
			document_folder = 'confirmed'
        AND
            document_type = 'invoice'
		AND
			opened in (${RESERVATION_1} , ${RESERVATION_2})
    `;

    let args = [
        client_uuid,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(sql, args);
    } catch(err) {
        return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}


    return [result, null];
}

async function api_setWithdrawSupplier (table, document_uuid , supplier_uuid, document_folder) {

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
        result = await db.update(sql, args);
    } catch(err) {
		return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}


	return [result, null];
}

async function api_setWithdrawClient (table, document_uuid , client_uuid, document_folder) {

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
        result = await db.update(sql, args);
    } catch(err) {
		return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

async function api_setReturn (table, document_uuid , client_uuid) {

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
        result = await db.update(sql, args);
    } catch(err) {
		return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
* rollbanck returnd to sent
*/
async function api_rollbackReturnToSent (table, document_uuid , client_uuid) {

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
            document_folder = 'returned'
        AND
            document_type = 'invoice'
    `;

    let args = [
        client_uuid,
        document_uuid
    ];

    let result, err;

    try {
        result = await db.update(sql, args);
    } catch(err) {
		return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

	return [result, null];
}

/*
* rollbanck confirm to sent
*/
async function api_rollbackConfirmToSent (table, document_uuid , client_uuid) {

	return this.setUnconfirm (table, document_uuid , client_uuid);
	
}

/*
* rollbanck sent to confirm 
*/
async function api_rollbackSentToConfirm (table, document_uuid , client_uuid) {

	return this.setConfirm (table, document_uuid , client_uuid);
	
}

/*
* rollbanck paid to confirm 
*/
async function api_rollbackPaidToConfirm (table, document_uuid , client_uuid) {

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
            document_folder = 'paid'
        AND
            document_type = 'invoice'
    `;

    let args = [
        client_uuid,
        document_uuid
    ];

    let result;

    try {
        result = await db.update(sql, args);
    } catch(err) {
        return [false, err];
    }

	if(result.affectedRows != 1) {
		err  = {msg:"result.affectedRows != 1"};
		return [false, err];
	}

    return [result, null];
	
}

