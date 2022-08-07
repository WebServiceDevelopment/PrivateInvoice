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

// Libraries

// Database

const db 							= require('../database.js');

// Exports
module.exports = {
	getRecentActivityBySeller_did	: _getRecentActivityBySeller_did,
	getRecentActivityByBuyer_did	: _getRecentActivityByBuyer_did,
	getRecentActivity_seller		: _getRecentActivity_seller,
	getRecentActivity_buyer			: _getRecentActivity_buyer,
}

//------------------------------- export modules ------------------------------

/*
 * getRecentActivityBySeller_did
 */
async function _getRecentActivityBySeller_did(table, times, member_did) {

	let sql = `
		SELECT
			document_uuid
		FROM
			${table}
		WHERE
			seller_did = ?
		LIMIT
			${times}
	`;

	let args = [
		`${member_did}`
	];

	let rows;
	try {
		rows = await db.selectAll(sql, args);
	} catch(err) {
		console.log(err);
		return [];
	}

	return rows;
}

/*
 * getRecentActivityByBuyer_did
 */
async function _getRecentActivityByBuyer_did(table, times, member_did) {

	let sql = `
		SELECT
			document_uuid
		FROM
			${table}
		WHERE
			buyer_did = ?
		LIMIT
			${times}
	`;

	let args = [
		`${member_did}`
	];

	let rows;
	try {
		rows = await db.selectAll(sql, args);
	} catch(err) {
		console.log(err);
		return [];
	}

	return rows;
}


async function _getRecentActivity_seller(table, times, document_uuids) {

	if( document_uuids== "" ) {
		return [];
	}

	let sql = `
		SELECT
			document_uuid,
			document_json,
			settlement_hash,
			settlement_time
		FROM
			${table}
		WHERE
			settlement_time is not null
		AND
			document_uuid in (${document_uuids})
		ORDER BY
			settlement_time DESC
		LIMIT
			${times}
	`;

	let args = [
	];

	let rows;
	try {
		rows = await db.selectAll(sql, args);
	} catch(err) {
		console.log(err);
		return [];
	}

	return rows;
}


async function _getRecentActivity_buyer(table, times, document_uuids) {

	if( document_uuids== "" ) {
		return [];
	}
	
	let sql = `
		SELECT
			document_uuid,
			document_json,
			settlement_hash,
			settlement_time
		FROM
			${table}
		WHERE
			settlement_time is not null
		AND
			document_uuid in (${document_uuids})
		ORDER BY
			settlement_time DESC
		LIMIT
			${times}
	`;

	let args = [
	];

	let rows;
	try {
		rows = await db.selectAll(sql, args);
	} catch(err) {
		console.log(err);
		return [];
	}

	return rows;
}


