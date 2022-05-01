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

// Import sub
const sub						= require("./invoice_sub.js");
const to_supplier				= require("./client_to_supplier.js");
const tran                      = require("./invoice_sub_transaction.js");

// Import Router

const express = require('express');
const router = express.Router();
module.exports = router;

// Libraries

// Database

const CLIENT_STATUS				= "client_status";

const CONTACTS					= "contacts";


// End Points


router.post('/return', async function(req, res) {
	const METHOD = '/return';

	let start = Date.now();

	const { document_uuid } = req.body;
	const { user_uuid } = req.session.data;

	let errno, code;

    // 1.
	//
    const [ supplier_uuid, err1 ] = await sub.getSupplierUuid(CLIENT_STATUS, document_uuid, user_uuid);
    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).end(err1);
    }

    // 2.
	//
    const [ supplier_host, err2 ] = await sub.getSupplierHost(CONTACTS, supplier_uuid, user_uuid);
    if(err2) {
        console.log("Error 2 status = 400 err="+err2);
        return res.status(400).end(err2);
    }

    // 3. client connect check
	//
    const [ code3, err3 ] = await to_supplier.connect(supplier_host, user_uuid, supplier_uuid);

    if(code3 !== 200) {
        console.log("Error 3 code="+code3+":err="+err3);
        let msg;
        if(code3 == 500) {
            msg = {"err":"supplier connect check:ECONNRESET"};
        } else {
            msg = {"err":err3};
        }
        return res.status(400).json(msg);
    }

    // 4.
    // begin Transaction
    //
    const [ conn , _4 ]  = await tran.connection ();
    await tran.beginTransaction(conn);

	// 5.
	// Set CLIENT_STATUS to 'return' with document_uuid as the key.
	//
	const [_5 , err5 ] = await tran.setReturn (conn, CLIENT_STATUS, document_uuid , user_uuid);

    if (err5 ) {
		errno = 5;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err5, errno));
    }
	
	// 6.
	// Send a 'return' request to supplier.
	//
    const [ code6, err6 ] = await to_supplier.return(supplier_host, document_uuid, user_uuid);

    if(code6 !== 200) {

		errno = 6;
		return res.status(400).json(tran.rollbackAndReturn(conn, code6, err6, errno));
    }
	
    // 7.
    // commit
    //

   	const [ _7, err7 ] = await tran.commit(conn);

	if (err7) {

		errno = 7;
		code = 400;
		let msg = tran.rollbackAndReturn(conn, code, err7, errno);

	// 8.
	//
		const [ code8, err8 ] = await to_supplier.rollbackReturnToSent(supplier_host, user_uuid, supplier_uuid);

		if(code8 !== 200) {
			console.log("Error 8 code="+code8+":err="+err8);
			if(code8 == 500) {
				msg = {"err":"supplier connect check:ECONNRESET"};
			} else {
				msg = {"err":err8};
			}
		}
		return res.status(400).json(msg);

	}

	// 9.
	//
   	conn.end();

	//console.log("/return accepted");

	res.json({
		err : 0,
		msg : "okay"
	});

	let end = Date.now();
	console.log("/return Time: %d ms", end - start);

});


router.post('/confirm', async function(req, res) {

	const METHOD = '/confirm';

	let start = Date.now();

	const { document_uuid } = req.body;
	const { user_uuid } = req.session.data;

	let errno, code;

    // 1.
	//
    const [ supplier_uuid, err1 ] = await sub.getSupplierUuid(CLIENT_STATUS, document_uuid, user_uuid);
    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).end(err1);
    }

    // 2.
	//
    const [ supplier_host, err2 ] = await sub.getSupplierHost(CONTACTS, supplier_uuid, user_uuid);

    if(err2) {
        console.log("Error 2 status = 400 err="+err2);
        return res.status(400).end(err2);
    }

    //3. client connect check
	//
    const [ code3, err3 ] = await to_supplier.connect(supplier_host, user_uuid, supplier_uuid);

    if(code3 !== 200) {
        console.log("Error 3 code="+code3+":err="+err3);
        let msg;
        if(code3 == 500) {
            msg = {"err":"supplier connect check:ECONNRESET"};
        } else {
            msg = {"err":err3};
        }
        return res.status(400).json(msg);
    }


    // 4.
    // begin Transaction
    //
    const [ conn , _4 ]= await tran.connection ();
    await tran.beginTransaction(conn);

	// 5.
	//
	const [ _5, err5 ] = await tran.setConfirm (conn, CLIENT_STATUS, document_uuid , user_uuid);

    if (err5 ) {
		errno = 5;
		code = 400;

		return res.status(400).json(tran.rollbackAndReturn(conn, code, err5, errno));
    }

	// 6.
	//
    const [ code6, err6 ] = await to_supplier.confirm(supplier_host, document_uuid, user_uuid);

    if(code6 !== 200) {
		console.log("supplier_host="+supplier_host+":"+document_uuid+":"+user_uuid);
		errno = 6;
		return res.status(400).json(tran.rollbackAndReturn(conn, code6, err6, errno));
    }
	
    // 7.
    // commit
    //
	const [ _7, err7 ] = await tran.commit(conn);

	if (err7) {

		errno = 7;
        code = 400;
        let msg = tran.rollbackAndReturn(conn, code, err7, errno);

	// 8.
	//
		const [ code8, err8 ] = await to_supplier.rollbackConfirmToSent(supplier_host, user_uuid, supplier_uuid);

		if(code8 !== 200) {
			console.log("Error 8 code="+code8+":err="+err8);
			if(code8 == 500) {
				msg = {"err":"supplier connect check:ECONNRESET"};
			} else {
				msg = {"err":err8};
			}
		}

        return res.status(400).json(msg);
	}

	// 9.
	//
	conn.end();

	//console.log("/confirm accepted");

	res.json({
		err : 0,
		msg : "okay"
	});

	let end = Date.now();
    console.log("/confirm Time: %d ms", end - start);

});

router.post('/unconfirm', async function(req, res) {

	const METHOD = '/unconfirm';

	let start = Date.now();

	const { document_uuid } = req.body;
	const { user_uuid } = req.session.data;

	let errno, code;

    // 1.
	//
    const [ supplier_uuid, err1 ] = await sub.getSupplierUuid( CLIENT_STATUS, document_uuid, user_uuid);

    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).end(err1);
    }

    // 2.
	//
    const [ supplier_host, err2 ] = await sub.getSupplierHost( CONTACTS, supplier_uuid, user_uuid);

    if(err2) {
        console.log("Error 2 status = 400 err="+err2);

        return res.status(400).end(err2);
    }

    // 3. client connect check
	//
    const [ code3 , err3 ] = await to_supplier.connect( supplier_host, user_uuid, supplier_uuid);

    if( code3 !== 200) {
        console.log("Error 3 code="+code3+":err="+err3);
        let msg;
        if(code3 == 500) {
            msg = {"err":"supplier connect check:ECONNRESET"};
        } else {
            msg = {"err":err3};
        }
        return res.status(400).json(msg);
    }

    // 4
    // begin Transaction
    //
    const [ conn , _4 ] = await tran.connection ();
    await tran.beginTransaction(conn);

	// 5.
	//
	const [ _5, err5] = await tran.setUnconfirm (conn, CLIENT_STATUS, document_uuid , user_uuid);

    if (err5 ) {
        errno = 54
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err5, errno));
    }

	// 6.
	//
    const [ code6, err6 ] = await to_supplier.unconfirm(supplier_host, document_uuid, user_uuid);

    if(code6 !== 200) {
		errno = 6;
		return res.status(400).json(tran.rollbackAndReturn(conn, code6, err6, errno));
    }

    // 7.
    // commit
    //
    const [ _7, err7 ] = await tran.commit(conn);

	if (err7) {
        errno = 7;
        code = 400;
        let msg = tran.rollbackAndReturn(conn, code, err7, errno);

	// 8.
	//
		const [ code8, err8 ] = await to_supplier.rollbackSentToConfirm(supplier_host, user_uuid, supplier_uuid);

		if(code8 !== 200) {
			console.log("Error 8 code="+code8+":err="+err8);
			if(code8 == 500) {
				msg = {"err":"supplier connect check:ECONNRESET"};
			} else {
				msg = {"err":err8};
			}
		}
		return res.status(400).json(msg);

	}

	// 9.
	//
   	conn.end();

	//console.log("/unconfirm accepted");

	res.json({
		err : 0,
		msg : "okay"
	});

	let end = Date.now();
    console.log("/unconfirm Time: %d ms", end - start);

});

router.post('/makePayment', async function(req, res) {

	const METHOD = '/makePayment'

	let start = Date.now();

	const { document_uuid } = req.body;
	const { user_uuid } = req.session.data;

	let errno, code;

    // 1.
	// getSupplierUuid
	//
    const [ supplier_uuid, err1 ] = await sub.getSupplierUuid(CLIENT_STATUS, document_uuid, user_uuid);

    if(err1) {
        console.log("Error 1 status = 400 err="+err1);

        return res.status(400).end(err1);
    }

    // 2.
	// getSupplierHost
	//
    const [ supplier_host, err2 ] = await sub.getSupplierHost(CONTACTS, supplier_uuid, user_uuid);

    if(err2) {
        console.log("Error 2 status = 400 err="+err2);
        return res.status(400).end(err2);
    }

    // 3.
	// connect
	//
    const [ code3, err3 ] = await to_supplier.connect(supplier_host, user_uuid, supplier_uuid);

    if(code3 !== 200) {
        console.log("Error 3 code="+code3+":err="+err3);
        let msg;
        if(code3 == 500) {
            msg = {"err":"supplier connect check:ECONNRESET"};
        } else {
            msg = {"err":err3};
        }
        return res.status(400).json(msg);
    }

	// 4.
	// paymentReservation
	//
    const [ code4, err4 ] = await to_supplier.paymentReservation(supplier_host, document_uuid, user_uuid);

    if(code4 !== 200) {
        console.log("Error 4 code="+code4+":err="+err4);
        let msg;
        if(code4 == 500) {
            msg = {"err":"supplier connect check:ECONNRESET"};
        } else {
            msg = {"err":err4};
        }
        return res.status(400).json(msg);
    }

    // 5.
    // begin Transaction
    //
    const [ conn , _5 ] = await tran.connection ();
    await tran.beginTransaction(conn);


	// 6.
	// setMakePayment
	//
	const [ _6, err6 ] = await tran.setMakePayment (conn, CLIENT_STATUS, document_uuid , user_uuid);

    if (err6 ) {
        errno = 6;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err6, errno));
    }

	// 7.
	// ethereum
	//

	const [ _7, err7 ] = [null, null];

    if (err7) {
        errno = 7;
		code = 400;
		return res.status(400).json(tran.rollbackAndReturn(conn, code, err7, errno));
    }


	// 8.
	// makePayment
	//
    const [ code8, err8 ] = await to_supplier.makePayment(supplier_host, document_uuid, user_uuid);

    if(code8 !== 200) {
		errno = 8;
		return res.status(400).json(tran.rollbackAndReturn(conn, code8, err8, errno));
    }

    // 9.
    // commit
    //
   	const [ _9, err9 ] = await tran.commit(conn);

	if (err9) {
        errno = 9;
        code = 400;
        let msg = tran.rollbackAndReturn(conn, code, err9, errno);

	// 10.
	//
		const [ code10, err10 ] = await to_supplier.rollbackPaidToConfirm(supplier_host, user_uuid, supplier_uuid);

		if(code10 !== 200) {
			console.log("Error 10 code="+code10+":err="+err10);
			if(code10 == 500) {
				msg = {"err":"supplier connect check:ECONNRESET"};
			} else {
				msg = {"err":err10};
			}
		}

        return res.status(400).json(msg);
	}

	// 10.
	//
   	conn.end();
	
	//console.log("/makePayment accepted");

	res.json({
		err : 0,
		msg : "okay"
	});

	let end = Date.now();
    console.log("/makePayment Time: %d ms", end - start);

});

