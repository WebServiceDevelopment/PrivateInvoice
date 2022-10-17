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

'use strict'

// Libraries
const currency = require('currency.js')

// Database

const config = require('../../config.json')
const db = require('../../database.js')

//------------------------------- modules ------------------------------

/*
 * getCount
 */
const getCount = async (
    member_did, // did:key:123
    role, // enum 'buyer', 'seller'
    archiveStatus, // 0, 1
    folder // enum 'draft', 'sent', ...
) => {
    const table_did = role === 'seller' ? 'seller_did' : 'buyer_did'
    const archive = role === 'seller' ? 'seller_archived' : 'buyer_archived'
    const table = role === 'seller' ? 'seller_status' : 'buyer_status'
    const counts = new Array()
    const query = new Array()

    if (folder) {
        query.push({
            folder,
            archiveStatus,
        })
    } else if (role === 'buyer') {
        query.push(
            {
                folder: 'sent',
                archiveStatus,
            },
            {
                folder: 'returned',
                archiveStatus,
            },
            {
                folder: 'confirmed',
                archiveStatus,
            },
            {
                folder: 'paid',
                archiveStatus,
            }
        )
    } else {
        query.push(
            {
                folder: 'sent',
                archiveStatus,
            },
            {
                folder: 'returned',
                archiveStatus,
            },
            {
                folder: 'confirmed',
                archiveStatus,
            },
            {
                folder: 'paid',
                archiveStatus,
            }
        )
    }

    for (let i = 0; i < query.length; i++) {
        const q = query[i]

        const sql = `
			SELECT
				COUNT(*) AS num
			FROM
				${table}
			WHERE
				${table_did} = ?
			AND
				document_type = 'invoice'
			AND
				document_folder = ?
			AND
				${archive} = ?
			AND
				removed_on IS NULL
		`

        const args = [member_did, q.folder, q.archiveStatus]
        try {
            const row = await db.selectOne(sql, args)
            counts.push(row.num)
        } catch (err) {
            return [1, err.toString()]
        }
    }

    return [0, counts]
}

/*
 * getFolder
 */
const getFolder = async (
    member_did, // did:key:123
    role, // enum 'buyer', 'seller'
    folder, // enum 'draft', 'sent', ...
    archiveStatus, // 0, 1
    limit, // number
    offset // number
) => {
    const table_did = role === 'seller' ? 'seller_did' : 'buyer_did'
    const archive = role === 'seller' ? 'seller_archived' : 'buyer_archived'
    const table = role === 'seller' ? 'seller_status' : 'buyer_status'
    const sort_rule = 'seller_last_action DESC'

    limit = limit > 200 ? 200 : limit
    limit = limit < 1 ? 1 : limit

    const sql = `
		SELECT
			document_uuid,
			document_type,
			document_number,
			document_folder,
			seller_did,
			seller_membername,
			seller_organization,
			seller_archived,
			DATE_FORMAT(seller_last_action,'%Y-%m-%d %H:%i:%s') AS seller_last_action,
			buyer_did,
			buyer_membername,
			buyer_organization,
			buyer_archived,
			buyer_last_action,
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
			${table_did} = ?
		AND
			document_type = 'invoice'
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
	`

    const args = [member_did, folder, archiveStatus]

    let rows
    try {
        rows = await db.selectAll(sql, args)
    } catch (err) {
        return [[], 1]
    }

    return [rows, 0]
}

/*
 * getTotal
 */
const getTotal = async (
    member_did, // did:key:123
    role, // enum 'buyer', 'seller'
    folder, // enum 'draft', 'sent', ...
    archiveStatus // 0, 1
) => {
    const table_did = role === 'seller' ? 'seller_did' : 'buyer_did'
    const archive = role === 'seller' ? 'seller_archived' : 'buyer_archived'
    const table = role === 'seller' ? 'seller_status' : 'buyer_status'

    const sql = `
		SELECT
			amount_due
		FROM
			${table}
		WHERE
			${table_did} = ?
		AND
			document_type = 'invoice'
		AND
			document_folder = ?
		AND
			${archive} = ?
		AND
			removed_on IS NULL
	`

    const args = [member_did, folder, archiveStatus]

    let rows
    try {
        rows = await db.selectAll(sql, args)
    } catch (err) {
        return [0, 1]
    }

    let total = BigInt(0)

    let v

    for (let i = 0; i < rows.length; i++) {
        v = rows[i].amount_due

        if (v.len < 1) {
            continue
        }

        if (v.charAt(0) == '$') {
            v = v.substr(1)
        }

        // To get rid of Gwei
        if (v != null) {
            if (v.indexOf(' ') !== -1) {
                v = v.split(' ')[0]
            }
        }

        if (
            v === '0' ||
            v === '0.0' ||
            v === '0.00' ||
            v === '0.000' ||
            v === '0.0000' ||
            v === '0.00000' ||
            v === '.0' ||
            v === '.00' ||
            v === '.000' ||
            v === '.'
        ) {
            continue
        }

        v = v.replace(/,/g, '')
        total += BigInt(parseInt(v))
    }

    const t = currency(t.toString(), config.CURRENCY).format(true)
    return [{ total: t }, 0]
}

//------------------------------- export modules ------------------------------

module.exports = {
    getCount,
    getFolder,
    getTotal,
}
