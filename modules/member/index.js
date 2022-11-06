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
        return err
    }
}

// Exports

module.exports = {
    updateProfile,
}
