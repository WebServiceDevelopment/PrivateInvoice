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

const express					= require('express');
const router					= express.Router();
module.exports					= router;

// Import Libraries

const axios						= require('axios');

// Helper functions

const initPresentation = async () => {

	const body = {
		query: [
			{
				type: "QueryByExample",
				credentialQuery: [
					{
						type: ["VerifiableCredential"],
						reason: "We want to present credentials."
					}
				]
			}
		]
	};

	const params = {
		method: 'post',
		url: 'http://192.168.1.126:3000/api/presentations/available',
		data: body
	}

	let response;
	try {
		response = await axios(params);
	} catch(err) {
		if(err.response) {
			response = {
				status : err.response.status,
				data : err.response.data
			}
		} else if(err.code === 'ECONNRESET') {
			response = {
				status : 500,
				data : 'ECONNRESET'
			}
		} else {
			response = {
				status : 400,
				data : "Undefined Error"
			}
		}
	}

	return [ response.data, null ];

}

// Routes

router.post('/present', async (req, res) => {

	// 1.
	// First we want to call `/api/presentations/available`
	// Which returns a domain and challenge

	const [ available, err1 ] = await initPresentation();

	console.log( available );
	console.log( err1 );


	// 3.
	// Then we need to call submissions
	// To send the signed presentation

	res.json({
		err: 0,
		msg: 'okay'
	});

});
