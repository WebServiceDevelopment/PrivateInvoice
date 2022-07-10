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
 
 Author: Kousei Ogawa (kogawa@wsd.co.jp)

**/

"use strict";

const fs = require('fs');
const http = require('http');
const redis = require('redis');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = redis.createClient();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// API Spec


// Load Config

require('dotenv').config()
const config = require('./config.json');
const db = require('./database.js');

const netUtil = require('./routes/netUtil.js');
// Create server

const app = express();
app.use(bodyParser.json());
const session_opts = config.SESSION;
session_opts.store = new RedisStore({ client: redisClient });

app.use(session(session_opts));

//const swaggerDocument = YAML.load('./swagger.yaml');
const swaggerDocument = YAML.load('./openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware

app.get("*", function (req, res, next) {

	let parts = req.url.split('/');
	
	switch(parts[1]) {
	case 'lib':
	case 'app':
	case 'api':
	case 'invite':
	case 'signup':

		break;
	default:
		req.url = '/login' + req.url;
		break;
	}
	
	next();

});

app.all("*", function (req, res, next) {

    // First we check to see if user is logged in
    const isLoggedIn = req.session.data ? true : false;

    // If they are logged in, then we dont need to check anything
    if(isLoggedIn) {
        return next();
    }

    // Allow access to message
    if(req.url.startsWith('/api/message')) {
        return next();
    }

    // Allow access to session
    if(req.url.startsWith('/api/session')) {
        return next();
    }

    // Allow access to presentations
    if(req.url.startsWith('/api/presentations')) {
        return next();
    }

    // And the login screen too
    if(req.url.startsWith('/login')) {
        return next();
    }

    // And the signup screen too
    if(req.url.startsWith('/signup')) {
        return next();
    }

    // If someone is trying to access app without logging in, then we
    // redirect back to login page
    if(req.url.startsWith('/app')) {
        return res.redirect('/');
    }

    // For anything else we send a 400 error to say, what ever you're trying
    // to do, you're not authorized to do it
    return res.status(400).end('Not Authorized by Private Invoice Middleware');

});

// Routes

app.use('/api/session', require('./routes/session.js'));
app.use('/api/invite', require('./routes/invite.js'));
app.use('/api/contacts', require('./routes/contacts.js'));

app.use('/api/invoice', require('./routes/buyer_invoice.js'));
app.use('/api/invoice', require('./routes/buyer_invoice_document.js'));
app.use('/api/message', require('./routes/buyer_invoice_archive.js'));
app.use('/api/message', require('./routes/buyer_invoice_trash.js'));
app.use('/api/message', require('./routes/buyer_message.js'));

app.use('/api/invoice', require('./routes/seller_invoice.js'));
app.use('/api/invoice', require('./routes/seller_invoice_document.js'));
app.use('/api/invoice', require('./routes/seller_invoice_archive.js'));
app.use('/api/invoice', require('./routes/seller_invoice_trash.js'));
app.use('/api/message', require('./routes/seller_message.js'));

app.use('/api/tray', require('./routes/tray.js'));
app.use('/api/trayDrafts', require('./routes/seller_tray_drafts.js'));
app.use('/api/trayArchive', require('./routes/tray_archive.js'));

app.use('/api/invoice', require('./routes/softDelete.js'));

app.use('/api/settings', require('./routes/settings.js'));
app.use('/api/message', require('./routes/contact_message.js'));

app.use('/api/wallet', require('./routes/wallet.js'));
app.use('/api/test', require('./routes/test.js'));
app.use('/api/presentations', require('./routes/presentations.js'));


// Public Directory and listen

app.use(express.static('public'))

app.listen(parseInt(process.env.SERVER_PORT), function() {
	
	console.log('--- Starting HTTP Server ---')
	console.log('Private Invoice is using database: %s', process.env.DATABASE_NAME);
	console.log('Private Invoice is listening on IP: %s', process.env.SERVER_IP_ADDRESS||netUtil.getLocalIp());
	console.log('Private Invoice is listening on Port: %d', process.env.SERVER_PORT);
	const MY_IP = process.env.SERVER_IP_ADDRESS||netUtil.getLocalIp();
    console.log(`API Documentaion: http://${MY_IP}:${process.env.SERVER_PORT}/api-docs`)

});
