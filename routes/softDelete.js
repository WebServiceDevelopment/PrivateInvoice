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

// Import Router

const express                   = require('express');
const router                    = express.Router();
module.exports                  = router;

// Libraries

// Import Modules
const {
    softDeleteSeller,
    softDeleteBuyer,
}                               = require('../modules/softDelete_sub.js');


// ------------------------------- End Points -------------------------------

/*
 * 1.
 * softDeleteSeller
 */
router.post('/softDeleteSeller', async function(req, res) {

	const [result , err] = await softDeleteSeller (
							req.session.data.member_did, 
							req.body.document_uuid
						);
	if (err) {
		res.status(400)
			.json({
				err : 1,
				msg : "Error : SQL execution failed"
			});
		return;
	}

	if(result.affectedRows != 1) {
		res.status(400)
			.json({
				err : 2,
				msg : "Incorrect request"
			});
		return;
	}

	return res.json({
		err : 0,
		msg : "okay"
	});

});

/*
 * softDeleteBuyer
 */
router.post('/softDeleteBuyer', async function(req, res) {

	const [result , err] = await softDeleteBuyer (
							req.session.data.member_did, 
							req.body.document_uuid
						);
	if (err) {
		res.status(400)
			.json({
				err : 1,
				msg : "Error : SQL execution failed"
			});
		return;
	}

	if(result.affectedRows != 1) {
		res.status(400)
			.json({
				err : 2,
				msg : "Incorrect request"
			});
		return;
	}

	return res.json({
		err : 0,
		msg : "okay"
	});

});
