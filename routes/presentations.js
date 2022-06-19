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

const uuidv4					= require('uuid').v4;
const { createClient } 			= require('redis');
const redisClient 				= createClient();

// Define 

router.post('/available', async (req, res) => {

	console.log(req.body);

	// Create a challenge
	const challenge = uuidv4();

	// Store it in Redis with a expiration timer of 100 seconds
	await redisClient.set(challenge, 'pending', 'EX', '100');
	
	// Return the domain and challenge
	res.json({
		...req.body,
		domain: process.env.DOMAIN,
		challenge
	});

});

router.post('/submissions', async (req, res) => {

	res.json({
		code : 0,
		message: 'got the thing'
	});


});
