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
//const config					= require('../config.json');

const db						= require('../database.js');

const BUYER_DOCUMENT			= "buyer_document";
const BUYER_ARCHIVE_DOCUMENT	= "buyer_document_archive";

const SELLER_DOCUMENT 			= "seller_document";
const SELLER_ARCHIVE_DOCUMENT	= "seller_document_archive";
const SELLER_DRAFT_DOCUMENT		= "seller_document_draft";

// Exports 
module.exports = {
	getDocumentBuyer			: _getDocumentBuyer,
	getDocumentSeller			: _getDocumentSeller,
	getArchiveDocumentBuyer		: _getArchiveDocumentBuyer,
	getArchiveDocumentSeller	: _getArchiveDocumentSeller,
	getDraftDocument			: _getDraftDocument,
}

//------------------------------- export modules ------------------------------

/*
 * 1.
 * getDocumentBuyer
 */
async function _getDocumentBuyer (document_uuid) {

    const sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${BUYER_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    const args = [
        document_uuid
    ];

	let result;
	try {
		result = await db.selectOne(sql, args);
	} catch(err) {
		[ null, err];
	}

	return [ result, null];

}

/*
 * 2.
 * getDocumentSeller
 */
async function _getDocumentSeller (document_uuid) {

    const sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${SELLER_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    const args = [
        document_uuid
    ];

	let result;
	try {
		result = await db.selectOne(sql, args);
	} catch(err) {
		[ null, err];
	}

	return [ result, null];

}

/*
 * 3.
 * getArchiveDocumentBuyer
 */
async function _getArchiveDocumentBuyer (document_uuid) {

    const sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${BUYER_ARCHIVE_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    const args = [
        document_uuid
    ];

	let result;
	try {
		result = await db.selectOne(sql, args);
	} catch(err) {
		[ null, err];
	}

	return [ result, null];

}

/*
 * 4.
 * getArchiveDocumentSeller
 */
async function _getArchiveDocumentSeller (document_uuid) {

    const sql = `
        SELECT
            document_uuid,
            document_json
        FROM
            ${SELLER_ARCHIVE_DOCUMENT}
        WHERE
            document_uuid = ?
    `;

    const args = [
        document_uuid
    ];

	let result;
	try {
		result = await db.selectOne(sql, args);
	} catch(err) {
		[ null, err];
	}

	return [ result, null];

}

/*
 * 5.
 * getDraftDocument
 */
async function _getDraftDocument (member_did, document_uuid) {


	const sql = `
		SELECT
			document_uuid,
			document_json,
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
			${SELLER_DRAFT_DOCUMENT}
		WHERE
			(seller_did = ? OR buyer_did = ?)
		AND
			document_uuid = ?
	`;

	const args = [
		member_did,
		member_did,
		document_uuid
	];

	let doc;
	try {
		doc = await db.selectOne(sql, args);
	} catch(err) {
		return [ null,  err];
	}

	return [doc , null];

}
