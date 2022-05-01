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

// Database

const db = require('../database.js');

// Exports
module.exports = {
	getCount	: api_getCount,
	count		: api_count,
	getFolder	: api_getFolder,
	getTotal	: api_getTotal,
}

// getTotal
async function api_getTotal (req, res, table) {

	let user_uuid, archive;

	if(req.body.archive == null) {
		res.json({ err : 8, msg : null });
		return;
	}
	if(req.body.role == null) {
		res.json({ err : 7, msg : null });
		return;
	}
	if(req.body.folder == null) {
		res.json({ err : 6, msg : null });
		return;
	}
	if(req.body.type == null) {
		res.json({ err : 5, msg : null });
		return;
	}

	switch(req.body.role) {
	case 'supplier':

		user_uuid = "supplier_uuid";
		archive = "supplier_archived";

		break;
	case 'client':

		user_uuid = "client_uuid";
		archive = "client_archived";

		break;
	default:
		res.json({
		err : 11, msg : null });
		return;
	}

	let sql = `
		SELECT
			amount_due
		FROM
			${table}
		WHERE
			${user_uuid} = ?
		AND
			document_type = ?
		AND
			document_folder = ?
		AND
			${archive} = ?
		AND
			removed_on IS NULL
	`;

	let args = [
		req.session.data.user_uuid,
		req.body.type,
		req.body.folder,
		req.body.archive
	];

	let rows;
	try {
		rows = await db.selectAll(sql, args);
	} catch(err) {
		res.json({
			err : err,
			msg : {total: 0}
		});

	}

	let max = rows.length;
	let total = 0;

	let v;

	for(let i=0; i<max;i++) {
		v = rows[i].amount_due;

		if(v.len < 1) {
			continue;
		}

		if(v.charAt(0) == '$' ) {
			v = v.substr(1);
		}

		if(v === "0" || v === "0.0" || v === "0.00" || v === "0.000" || v === ".0" || v === ".00" || v === ".000" || v === ".") {
			continue;
		}

		v = v.replace(/,/g, '');
		total += parseFloat(v)*100;

	}

	total = total/100;

	res.json({
		err : 0,
		msg : {total: total}
	});

}

// getCount

async function api_getCount(req, res, table) {
	let counts = new Array(req.body.length);

	for(let i = 0; i < req.body.length; i++) {

		let user_uuid, archive;

		switch(req.body[i].role) {
		case 'supplier':

			user_uuid = "supplier_uuid";
			archive = "supplier_archived";

			break;
		case 'client':

			user_uuid = "client_uuid";
			archive = "client_archived";

			break;
		default:
			continue;

		}

		let sql = `
			SELECT
				COUNT(*) AS num
			FROM
				${table}
			WHERE
				${user_uuid} = ?
			AND
				document_type = ?
			AND
				document_folder = ?
			AND
				${archive} = ?
			AND
				removed_on IS NULL
		`;

		if(req.session.data == null) {
			res.json({
				err : 9,
				msg : null
			});
		}

		if(req.session.data == null) {
			res.json({
				err : 9,
				msg : null
			});

		}

		if(req.session.data.hasOwnProperty('user_uuid')) {
			try {
				user_uuid = req.session.data.user_uuid|| null;
		} catch(e) {
				user_uuid = null;
			}
		} else {
				user_uuid = null;
		}
	
		let args = [
			user_uuid,
			req.body[i].type,
			req.body[i].folder,
			req.body[i].archive
		];

		try {
			let row = await db.selectOne(sql, args);
			counts[i] = row.num;
		} catch(err) {
			res.json({
				err : err,
				msg : []
			});

			return;
		}

	}

	res.json({
		err : 0,
		msg : counts
	});

}


// count

async function api_count (req, res, table) {

	const data = {};

	for(let key in req.body) {

		data[key] = {};

		for(let i = 0; i < req.body[key].folders.length; i++) {

			// Here is where we query the database

			let user_uuid, archive;
			switch(req.body[key].type) {
			case "supplier":
				user_uuid = "supplier_uuid";
				archive = "supplier_archived";
				break;
			case "client":
				user_uuid = "client_uuid";
				archive = "client_archived";
				break;
			default:
				return res.json({
					err : 1,
					msg : "INVALID USER ROLE"
				});
			}

			let sql = `
				SELECT
					COUNT(*) AS num
				FROM
					${table}
				WHERE
					${user_uuid} = ?
				AND
					document_type = ?
				AND
					document_folder = ?
				AND
					${archive} = 0
				AND
					removed_on IS NULL
			`;

			let args = [
				req.session.data.user_uuid,
				key,
				req.body[key].folders[i]
			];

			let folder = req.body[key].folders[i];

			try {
				let row = await db.selectOne(sql, args);
				data[key][folder] = row.num;
			} catch(err) {
				res.json({
					err : err,
					msg : {} 
				});

			}
		}
	}

	res.json({
		err : 0,
		msg : data
	});

}

// getFolder

async function api_getFolder(req, res, table) {
	let user_uuid, archive, sort_rule;

	switch(req.body.role) {
	case "supplier":

		user_uuid = "supplier_uuid";
		archive = "supplier_archived";
		sort_rule = " supplier_last_action DESC ";

		break;
	case "client":

		user_uuid = "client_uuid";
		archive = "client_archived";
		sort_rule = " supplier_last_action DESC ";

		break;
	default:

		return res.json({
			err : 1,
			msg : "INVALID USER ROLE"
		});

	}

	let limit = parseInt(req.body.limit) || 25;
	if(limit > 200) {
		limit = 200;
	} else if(limit <= 0) {
		limit = 1;
	}

	let offset = parseInt(req.body.offset) || 0;

	let sql = `
		SELECT
			document_uuid,
			document_type,
			document_number,
			document_folder,
			supplier_uuid,
			supplier_username,
			supplier_company,
			supplier_archived,
			DATE_FORMAT(supplier_last_action,'%Y-%m-%d %H:%i:%s') AS supplier_last_action,
			client_uuid,
			client_username,
			client_company,
			client_archived,
			client_last_action,
			created_from,
			root_document,
			DATE_FORMAT(created_on,'%Y-%m-%d %H:%i:%s') AS created_on,
			opened,
			subject_line,
			DATE_FORMAT(due_by,'%Y-%m-%d %H:%i:%s') AS due_by,
			amount_due
		FROM
			${table}
		WHERE
			${user_uuid} = ?
		AND
			document_type = ?
		AND
			document_folder = ?
		AND
			${archive} = ?
		AND
			removed_on IS NULL
		ORDER BY
			${sort_rule}
		LIMIT
			${limit}
		OFFSET
			${offset}
		
	`;

	let args = [
		req.session.data.user_uuid,
		req.body.type,
		req.body.folder,
		req.body.archive
	];

	let rows;

	try {
		rows = await db.selectAll(sql, args);
	} catch(err) {
			res.json({
			err : err,
			msg : []
		});
	
	}

	res.json({
		err : 0,
		msg : rows
	});

}

