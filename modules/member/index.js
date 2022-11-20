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

// Database

const db = require('../../database.js')

const insertMember = async (
    organizationUuid, // string
    memberDid, // string did:key:123
    memberDetails, // object
    eth_address, // string
    privatekey // string
) => {
    // First Create Password Hash
    const password_hash = await db.hash(memberDetails.password)

    // Then insert into members table
    const sql = `
		INSERT INTO members (
			member_did,
			membername,
			job_title,
			work_email,
			password_hash,
			organization_did,
			wallet_address,
			wallet_private_key
		) VALUES (
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			?
		)
	`

    // Construct arguments

    const args = [
        memberDid,
        memberDetails.membername,
        memberDetails.job_title,
        memberDetails.contact_email,
        password_hash,
        organizationUuid,
        eth_address,
        privatekey,
    ]

    try {
        await db.insert(sql, args)
    } catch (err) {
        throw err
    }
}

const insertPrivateKeys = async (
    member_did, // string did:key:123
    privateKey // object
) => {
    const sql = `
		INSERT INTO privatekeys (
			member_did,
			public_key,
            update_key,
            recovery_key
		) VALUES (
			?,
			?,
            'null',
            'null'
		)
	`

    const args = [member_did, JSON.stringify(privateKey)]

    try {
        await db.insert(sql, args)
    } catch (err) {
        throw err
    }
}

const updateProfile = async (
    member_did, // string, did:key:123
    memberDetails // object MemberDetails
) => {
    const sql = `
		UPDATE
			members
		SET
			membername = ?,
			job_title = ?,
			work_email = ?
		WHERE
			member_did = ?
	`

    const args = [
        memberDetails.membername,
        memberDetails.job_title,
        memberDetails.work_email,
        member_did,
    ]

    // Step 2 : Write Changes to log database

    try {
        await db.update(sql, args)
    } catch (err) {
        throw err
    }
}

const getMemberInfo = async (
    member_did // string: did:key:123
) => {

    const sql = `
        SELECT
            member_did as member_did,
            membername,
			organization_did,
            wallet_address
        FROM
            members
        WHERE
            member_did = ?
    `;

    const args = [member_did];

    let row;
    try {
        row = await db.selectOne(sql, args);
    } catch (err) {
        const msg = "This member_did is not found."
        return [null, msg];

    }

    return [row, null];
}

// Exports

module.exports = {
    updateProfile,
    insertMember,
    insertPrivateKeys,
    getMemberInfo
}
