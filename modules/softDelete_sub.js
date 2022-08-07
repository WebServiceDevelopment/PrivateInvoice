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

"use strict";

// Exports
module.exports = {
	softDeleteSeller			: _softDeleteSeller,
	softDeleteBuyer				: _softDeleteBuyer,
}

// Libraries

// Database

const db						= require('../database.js');

const BUYER__ARCHIVE_STATUS		= "buyer_status_archive";
const SELLER_ARCHIVE_STATUS		= "seller_status_archive";



// ------------------------------- End Points -------------------------------

/*
 * 1.
 * softDeleteSeller
 */
async function _softDeleteSeller (member_did, document_uuid) {

	const table					= SELLER_ARCHIVE_STATUS;
	const archive				= "seller_archived";
	const member_did_column		= "seller_did";

	const sql = `
		UPDATE
			${table}
		SET
			${archive} = 1
		WHERE
			${member_did_column} = ?
		AND
			document_uuid = ?
		AND
			document_folder = 'trash'
		AND
			document_type = 'invoice'
	`;

	const args = [
		member_did,
		document_uuid
	];

	let result;

	try {
		result = await db.update(sql, args);
	} catch(err) {
		return [null, err]

	}

	return [result, null];

};

/*
 * softDeleteBuyer
 */
async function _softDeleteBuyer (member_did, document_uuid) {

	const table				= BUYER__ARCHIVE_STATUS;
	const archive			= "buyer_archived";
	const member_did_column	= "buyer_did";

	const sql = `
		UPDATE
			${table}
		SET
			${archive} = 1
		WHERE
			${member_did_column} = ?
		AND
			document_uuid = ?
		AND
			document_folder = 'trash'
		AND
			document_type = 'invoice'
	`;

	const args = [
		member_did,
		document_uuid
	];

	let result;

	try {
		result = await db.update(sql, args);
	} catch(err) {
		return [null, err]
	}

	return [result, null];

};
