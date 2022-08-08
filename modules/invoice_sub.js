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
const db					= require('../database.js');

// Exports 
module.exports = {
	exist_check				: _exist_check,
	notexist_check			: _notexist_check,
	checkForExistingDocument : _checkForExistingDocument,
	checkForNotExistingDocument : _checkForNotExistingDocument,

	getDraftDocumentForSend	: _getDraftDocumentForSend,
	getDraftDocument 		: _getDraftDocument,
	getDocument				: _getDocument,
	getStatus				: _getStatus,

	getBuyerDid 			: _getBuyerDid,
	getBuyerDidForDraft 	: _getBuyerDidForDraft,
	getBuyerHost 			: _getBuyerHost,

	getSellerDid    		: _getSellerDid,
	getSellerHost			: _getSellerHost,

	insertStatus			: _insertStatus,
	insertArchiveStatus		: _insertArchiveStatus,
	insertDocument			: _insertDocument,
	insertArchiveDocument	: _insertArchiveDocument,
	insertDraftDocument		: _insertDraftDocument,

	deleteStatus			: _deleteStatus,
	deleteDocument			: _deleteDocument,

	setConfirm 				: _setConfirm,
	setUnconfirm 			: _setUnconfirm,
	setPaymentReservation 	: _setPaymentReservation,
	resetPaymentReservation	: _resetPaymentReservation,
	setMakePayment_status 	: _setMakePayment_status,
	setMakePayment_document	: _setMakePayment_document,
	setWithdrawBuyer		: _setWithdrawBuyer,
	setWithdrawSeller		: _setWithdrawSeller,
	setReturn 				: _setReturn,

	rollbackReturnToSent	: _rollbackReturnToSent.bind(this),
	rollbackConfirmToSent	: _rollbackConfirmToSent.bind(this),
	rollbackSentToConfirm	: _rollbackSentToConfirm.bind(this),
	rollbackPaidToConfirm	: _rollbackPaidToConfirm.bind(this),

	check_ipadder			: _check_ipadder,
}

//------------------------------- export modules ------------------------------

/*
 * exist_check
 */
async function _exist_check( table, uuid) {

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
		result = await db.selectOne(sql, args);
	} catch(err) {
		console.log(err);

		let msg = "Select error";
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
 * notexist_check
 */
async function _notexist_check( table, uuid) {

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
		result = await db.selectOne(sql, args);
	} catch(err) {
		console.log(err);

		let msg = "Select error";
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
async function _checkForExistingDocument (table, document_uuid ) {

	let msg;

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
		const result = await db.selectOne(sql, args);

		if(result.num) {
			msg = 'Document Uuid already exists in database';
			return [false, msg];
		}

	} catch(err) {
		console.log(err);

		msg = "Select error";
		return [false, msg];
	}

	return [true, null];
}

/*
 * checkForNotExistingDocument
 */
async function _checkForNotExistingDocument (table, document_uuid ) {

	let msg;

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
		const { num } = await db.selectOne(sql, args);

		if(num == 0) {

			msg = 'Document Uuid not exists in database yet';
			return [false, msg];
		}


	} catch (err) {
		console.log(err);

		msg = "Select error";
		return [false, msg];
	}

	return [true, null];
}


/*
 * getDraftDocumentForSend
 */
async function _getDraftDocumentForSend(table, uuid) {

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
		document = await db.selectOne(sql, args);
	} catch(err) {
		console.log(err);

		let msg = "Select error";
		return [false, msg];
	}
	//console.log(document)

	return [document, null];

}

/*
 * getDraftDocument
 */
async function _getDraftDocument(table, uuid) {

	let document, msg;

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
		document = await db.selectOne(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Select error";
		return [false, msg];
	}
	//console.log(document)

	return [document, null];

}

/*
 * getDocument
 */
async function _getDocument(table, uuid) {

	let result, msg;

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
		result = await db.selectOne(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Select error";
		return [false, msg];
	}

	if(result == null) {
		msg = "Not found.";
		return [null, msg];
	}

	return [result, null];

}
	
/*
 * getStatus
 */
async function _getStatus(table, uuid) {

	let status, msg;

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
		status = await db.selectOne(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Select error";
		return [false, msg];
	}

	return [status , null];
}

/*
 * getBuyerDid
 */
async function _getBuyerDid (table, document_uuid, seller_did) {

	let result, msg;

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
        result = await db.selectOne(sql, args);
        if(!result) {

            msg = 'buyer_did not found for document_uuid';
            return [ null, msg ];
        }
        const { buyer_did } = result;
        return [ buyer_did, null ];

    } catch(err) {
		console.log(err);

		let msg = "Select error";
		return [false, msg];
    }

}


/*
 * getBuyerDidForDraft
 */
async function _getBuyerDidForDraft (table, document_uuid, seller_did) {

	let result, msg;

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
        result = await db.selectOne(sql, args);
        if(!result) {

            msg =  'buyer_did not found for document_uuid';
            return [ null, msg];
        }
        const { buyer_did } = result;
        return [ buyer_did, null ];

    } catch(err) {
		console.log(err);

		let msg = "Select error";
		return [false, msg];
    }

}


/*
 * getSellerDid
 */
async function _getSellerDid (table, document_uuid, buyer_did) {

	let result, msg;

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
        result = await db.selectOne(sql, args);
    } catch(err) {
		console.log(err);

		let msg = "Select error";
		return [false, msg];
    }

	if(!result) {

		msg = 'seller_did not found for document_uuid';
		return [ null, msg];
    }
    const { seller_did } = result;
    return [ seller_did, null ];

}

/*
 * getSellerHost
 */
async function _getSellerHost (table,  seller_did, buyer_did) {
	//console.log("getSellerHost");

	let result, msg;

    const sql = `
        SELECT
            remote_origin AS seller_host
        FROM
            ${table}
        WHERE
            remote_member_did = ?
        AND
            local_member_did = ?
    `;

    const args = [
        seller_did,
        buyer_did
    ];

    try {
		result = await db.selectOne(sql, args);

    } catch(err) {
		console.log(err);

		msg = "Select error";
		return [false, msg];
	}

    if(!result) {
		msg = 'seller_host not found for seller_did:';
        return [ null, msg];
    }

    const { seller_host } = result;
    return [ seller_host, null ];

}


/*
 * getBuyerHost
 */
async function _getBuyerHost (table,  seller_did, buyer_did) {
	//console.log("getBuyerHost");

	let result, msg;

    const sql = `
        SELECT
            remote_origin AS buyer_host
        FROM
            ${table}
        WHERE
            local_member_did = ?
        AND
            remote_member_did = ?
    `;

    const args = [
        seller_did,
        buyer_did
    ];

	try {
		result = await db.selectOne(sql, args);

	} catch(err) {
		console.log(err);

		let msg = "Select error";
		return [false, msg];
	}
	if(!result) {
		msg = 'buyer_host not found for buyer_did:';
		return [ null, msg ];
	}

	const { buyer_host } = result;
	return [ buyer_host, null ];

}

/*
 * insertDraftDocument
 */
async function _insertDraftDocument(table, document) {

	let result, msg;

	const sql = `
		INSERT INTO ${table} (

			document_uuid,
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
			?
		)
	`;

	const args = [
		document.document_uuid,
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
		result = await db.insert(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Insert error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		msg  = "insertDraftDocument:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}

/*
 * insertDocument
 */
async function _insertDocument(table, status, document_json) {

	let result, msg;

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
		result = await db.insert(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Insert error";
		return [false, msg];
	}
	if(result.affectedRows != 1) {

		msg  = "insertDocument:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}
	
/*
 * insertArchiveDocument
 */
async function _insertArchiveDocument(table, status, document) {

	let result, msg;

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
		status.document_uuid,
		document.document_json,
		document.settlement_currency,
		document.settlement_hash,
		document.settlement_time
	];

	try {
		result = await db.insert(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Insert error";
		return [false, msg];
	}
	if(result.affectedRows != 1) {

		msg  = "insertArchiveDocument:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}
	
	
/*
 * insertStatus
 */
async function _insertStatus(table, status) {

	let result, msg;

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


	try {
		result = await db.insert(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Insert error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		msg  = "insertStatus:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}

/*
 * insertArchiveStatus
 */
async function _insertArchiveStatus(table, status) {

	let result, msg;

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


	try {
		result = await db.insert(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Insert error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		msg  = "insertArchiveStatus:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}


/*
 * deleteStatus
 */
async function _deleteStatus(table, status) {

	let result, msg;

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
		result = await db.delete(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Delete error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		msg  = "deleteStatus:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}

/*
 * deleteDocument
 */
async function _deleteDocument(table, status) {

	let result, msg;

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
		result = await db.delete(sql, args);
	} catch(err) {
		console.log(err);

		msg = "Delete error";
		return [false, msg];
	}

	if(result.affectedRows != 1) {
		msg  = "deleteDocument:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}


/*
* sent to confirm
*/
async function _setConfirm (table, document_uuid , buyer_did) {

    let result, msg;

    const sql = `
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

    const args = [
        buyer_did,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		msg  = "setConfirm:result.affectedRows != 1";
		return [false, msg];
	}

    return [result, null];
}


/*
 * setUnconfirm
 */
async function _setUnconfirm (table, document_uuid , buyer_did) {

    let result, msg;

    const sql = `
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

    const args = [
        buyer_did,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		msg  = "setUnconfirm:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}

/*
 * setPaymentReservation
 */
async function _setPaymentReservation (table, document_uuid , buyer_did) {

	const RESERVATION = 8;
	const RESERVATION_1 = 0;
	const RESERVATION_2 = 1;


    let result, msg;

    const sql = `
        UPDATE
            ${table}
        SET
            opened = opened + ${RESERVATION} 
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
			document_folder = 'confirmed'
        AND
            document_type = 'invoice'
		AND
			opened in (${RESERVATION_1} , ${RESERVATION_2})
    `;

    const args = [
        buyer_did,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {

		msg  = "setPaymentReservation:result.affectedRows != 1";
		return [false, msg];
	}

    return [result, null];
}

/*
 * resetPaymentReservation
 */
async function _resetPaymentReservation (table, document_uuid , buyer_did) {

	const RESERVATION = 8;
	const RESERVATION_1 = 8;
	const RESERVATION_2 = 9;


    let result, msg;

    const sql = `
        UPDATE
            ${table}
        SET
            opened = opened - ${RESERVATION} 
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
			document_folder = 'confirmed'
        AND
            document_type = 'invoice'
		AND
			opened in (${RESERVATION_1} , ${RESERVATION_2})
    `;

    const args = [
        buyer_did,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {

		msg  = "resetPaymentReservation:result.affectedRows != 1";
		return [false, msg];
	}

    return [result, null];
}

/*
 * setMakePayment_status
 */
async function _setMakePayment_status (table, document_uuid , buyer_did) {

	const RESERVATION = 0;
	const RESERVATION_1 = 8;
	const RESERVATION_2 = 9;

    let result, msg;

    const sql = `
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
		AND
			opened in (${RESERVATION_1} , ${RESERVATION_2})
    `;

    const args = [
        buyer_did,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		msg  = "setMakePayment_status:result.affectedRows != 1";
		return [false, msg];
	}

    return [result, null];
}

/*
 * setMakePayment_document
 */
async function _setMakePayment_document (table, document_uuid , hash) {

    let result, msg;

    const sql = `
        UPDATE
            ${table}
        SET
            settlement_hash = ?,
            settlement_time = NOW()
        WHERE
            document_uuid = ?
    `;

    const args = [
		hash,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		msg  = "setMakePayment_document:result.affectedRows != 1";
		return [false, msg];
	}

    return [result, null];
}

/*
 * setWithdrawSeller
 */
async function _setWithdrawSeller (table, document_uuid , seller_did) {

    let result, msg;

    const sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'returned'
        WHERE
            seller_did = ?
        AND
            document_uuid = ?
        AND
            document_type = 'invoice'
    `;

    const args = [
        seller_did,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		msg  = "setWithdrawSeller:result.affectedRows != 1";
		return [false, msg];
	}


	return [result, null];
}

/*
 * setWithdrawBuyer
 */
async function _setWithdrawBuyer (table, document_uuid , buyer_did) {

    let result, msg;

    const sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'returned'
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
            document_type = 'invoice'
    `;

    const args = [
        buyer_did,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {

		msg  = "setWithdrawBuyer:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}

/*
 * setReturn
 */
async function _setReturn (table, document_uuid , buyer_did) {

    let result, msg;

    const sql = `
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

    const args = [
        buyer_did,
        document_uuid
    ];

    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {

		msg  = "setReturn:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}

/*
* rollbanck returnd to sent
*/
async function _rollbackReturnToSent (table, document_uuid , buyer_did) {

    let result, msg;

    const sql = `
        UPDATE
            ${table}
        SET
            document_folder = 'sent'
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
            document_folder = 'returned'
        AND
            document_type = 'invoice'
    `;

    const args = [
        buyer_did,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {
		msg  = "rollbackReturnToSent:result.affectedRows != 1";
		return [false, msg];
	}

	return [result, null];
}

/*
* rollbanck confirm to sent
*/
async function _rollbackConfirmToSent (table, document_uuid , buyer_did) {

	return this.setUnconfirm (table, document_uuid , buyer_did);
	
}

/*
* rollbanck sent to confirm 
*/
async function _rollbackSentToConfirm (table, document_uuid , buyer_did) {

	return this.setConfirm (table, document_uuid , buyer_did);
	
}

/*
* rollbanck paid to confirm 
*/
async function _rollbackPaidToConfirm (table, document_uuid , buyer_did) {

    let result,msg;

    const sql = `
        UPDATE
            ${table}
        SET
			document_folder = 'confirmed'
        WHERE
            buyer_did = ?
        AND
            document_uuid = ?
        AND
            document_folder = 'paid'
        AND
            document_type = 'invoice'
    `;

    const args = [
        buyer_did,
        document_uuid
    ];


    try {
        result = await db.update(sql, args);
    } catch(err) {
		console.log(err);

		msg = "Update error";
		return [false, msg];
    }

	if(result.affectedRows != 1) {

		msg  = "rollbackPaidToConfirm:result.affectedRows != 1";
		return [false, msg];
	}

    return [result, null];
	
}

/*
 * check_ipadder
 */
function _check_ipadder (req_ip , seller_host) {

    let ip = req_ip.split(":")[3];

    if(seller_host.indexOf(ip) != -1) {
                return true;
    }
    return false;

}
