
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
const tran						= require("./invoice_sub_transaction.js");
const eth						= require("./web3_eth.js");

//  web3.js
const web3						= eth.getWeb3();

// Table Name
const SELLER_STATUS			    = "seller_status";
const SELLER_DOCUMENT		    = "seller_document";


const BUYER_DOCUMENT            = "buyer_document";
const BUYER_STATUS              = "buyer_status";

const BUYER_ARCHIVE_DOCUMENT    = "buyer_document_archive";
const BUYER_ARCHIVE_STATUS      = "buyer_status_archive";

const CONTACTS                  = "contacts";

// Export
module.exports = {
}
module.exports = {
	moveToPaid					: _moveToPaid,
	moveToArchive               : _moveToArchive,
	moveToTrash                 : _moveToTrash,
}

// Import Router
/*
const express                   = require('express');
const router                    = express.Router();
module.exports                  = router;
*/

// ---------------------------- Export Module -------------------------------

async function _moveToPaid (document_uuid, buyer_did, hash) {

	let msg;

	// 1.
	//
	const [ _, err1] = await sub.setPaymentReservation(SELLER_STATUS, document_uuid, buyer_did);

	// 1.
	// Check the transaction receipt.
	// Happy path just okay.
	// getTransactionReciept
	//
	const [ receipt, err2 ] = await eth.getTransactionReceipt(web3, hash) ;

	if(err2) {

		msg = "No transaction reciept was found."
		return [msg, 2];
	}

	console.log(receipt);

	// 3.
	//
	const [ result, err3 ] = await eth.getTransaction(web3, hash) ;

	if(err3) {

		msg = "No transaction was found."
		return [msg, 3];
	}

	// 4.
	// getDocument
	// And get total from document_json.
	// And convert units to wei.
	//
	const [ document, _4 ] = await sub.getDocument(SELLER_DOCUMENT, document_uuid);
	const document_json = JSON.parse(document.document_json);
	const totalPaymentDue = document_json.credentialSubject.totalPaymentDue;

	console.log("moveToPaid : totalPaymentDue="+totalPaymentDue.price);

	// 5.
	let wk = '0';
	if( totalPaymentDue != null && totalPaymentDue.price != null) {
		wk = totalPaymentDue.price;
		wk = wk.replace(/,/g, "");
	}

	let total;
	try {
		total = web3.utils.toWei(wk , 'Gwei');
	} catch (err5) {

		msg = "Could not change to Wei"
		return [msg, 5];
	}

	// 6.
	// Does transaction value and invoice total match?
	//

	if( result != null) {
		console.log(result.value +":"+total);

		if( result.value !=  total) {

			msg = "Transaction value and invoice total do not match."
			return [msg, 6];
		}
	} else {
		console.log("5:"+result)
	}

	// 7.
	// begin Transaction
	//
	const [ conn , _7 ] = await tran.connection ();
	await tran.beginTransaction(conn);

	// 8.
	//
	const [ _8, err8] = await tran.setMakePayment_status(conn, SELLER_STATUS, document_uuid, buyer_did);

	if(err8) {
		console.log(err8);

		return [tran.rollback(conn,err8), 8];
	}

	// 9.
	//
	const [_9, err9] = await tran.setMakePayment_document(conn, SELLER_DOCUMENT, document_uuid, hash);

	if(err9) {
		console.log(err9);

		return [tran.rollback(conn,err9), 9];
	}

	// 10.
	// commit
	//
	const [ _10, err10 ] = await tran.commit(conn);

	if (err10) {
		console.log(err10);

		return [tran.rollback(conn,err10), 10];
	}

	// 11.
	//
	conn.end();

	return [msg, null];

}



async function _moveToArchive (document_uuid) {

    const FOLDER  = 'paid';

	let msg;

    // 1.
    // getStatus
    // First we go ahead and get the status.
    // Does record exist?
    //
    const [ old_status , _1] = await sub.getStatus( BUYER_STATUS, document_uuid) ;

    if(old_status == undefined) {

		msg = 'Record is not exist.'
		return [msg, 1];
    }

    // 2.
    // Second we go ahead and get the document
    // Does record exist?
    //
    const [ old_document, _2 ] = await sub.getDocument( BUYER_DOCUMENT, document_uuid) ;

    if(old_document == undefined) {

		msg = 'Record is not exist.'
        return [ msg, 2];
    }


    // 3.
    // seller_did in old_status.
    // member_did in old_status.
    //
    const seller_did = old_status.seller_did;
    const member_did = old_status.buyer_did;

    //console.log(" seller_did="+ seller_did+":member_did="+ member_did);

    // 4.
    // getSellerHost
    //
    const [ seller_host, err4 ] = await sub.getSellerHost(CONTACTS, seller_did, member_did);
    if(err4) {

		msg = 'Host is not exist.'
		return [msg, 4];
    }

    // 5.
    // Compare Host address and req.ip.
    // Are the two ips the same?
    //
	
	/*
    if(!check_ipadder(req.ip , seller_host)) {

		msg = 'the two ips are the same.'
		return [msg ,5];
    }
	*/

    // 6.
    // Does document_uuid already notexist in the archive status table?
    //
    const [ bool6, err6 ] = await sub.notexist_check( BUYER_ARCHIVE_STATUS, document_uuid)
    if ( bool6 == false) {

		msg = 'document_uuid is not exist.'
		return [msg ,6];
    }

    // 7.
    // Does document_uuid already notexist in the archive document table?
    //
    const [ bool7, err7 ] = await sub.notexist_check( BUYER_ARCHIVE_DOCUMENT, document_uuid)
    if ( bool7 == false) {

		msg = 'document_uuid is not exist.'
		return [msg ,7];
    }


    // 8.
    // begin Transaction
    //
    const [ conn, _8 ] = await tran.connection ();
    await tran.beginTransaction(conn);

    // 9.
    //

    old_status.document_folder  = FOLDER;
    old_status.seller_archived  = 1;
    old_status.buyer_archived  = 1;

    // 10.
    // Then we go ahead and insert into the archive status
    //
    const [ _10, err10 ] = await tran.insertArchiveStatus(conn, BUYER_ARCHIVE_STATUS, old_status);

    if(err10) {

		msg = 'Could not inseret record.'
		return [tran.rollback(conn,  msg), 10];
    }

    // 11.
    // And then we need to insert into the archive document
    //
    const [ _11, err11 ] = await tran.insertArchiveDocument(conn, BUYER_ARCHIVE_DOCUMENT, old_document);

    if(err11) {

		msg = 'Could not inseret record.'
		return [tran.rollback(conn,  msg), 11];
    }

    // 12.
    // Remove recoiored from BUYER_STATUS with docunent_uuid key
    //
    const [ _12, err12 ] = await tran.deleteStatus(conn, BUYER_STATUS, old_status) ;

    if(err11) {

		msg = 'Could not inseret record.'
		return [tran.rollback(conn,  msg), 12];
    }

    // 13.
    // Remove recoiored from BUYER_DOCUMENT with docunent_uuid key
    //
    const [ _13, err13] = await tran.deleteDocument(conn, BUYER_DOCUMENT, old_status) ;

    if(err13) {

		msg = 'Could not delete record.'
		return [tran.rollback(conn,  msg), 13];
    }


    // 14.
    // commit
    //
    const [ _14, err14] = await tran.commit(conn);

    if (err14) {

		msg = 'Could not commit.'
		return [tran.rollback(conn,  msg), 14];
    }

    // 15.
	conn.end();

	return [null, 0]

}


/*
 * Execution of'Move to Trash'when folder is draft.
*/

async function _moveToTrash (status, document_uuid, seller_did) {

    // 1.
    // STATUS
    // First we go ahead and get the status.
    //
	let msg;

    const [ old_status , _1 ] = await sub.getStatus( status, document_uuid) ;

    if(old_status == undefined) {

		msg = 'Record is not exist.'
		return [msg , 1];
    }

    // 2.
    // Second we go ahead and get the document
    //
    const [ old_document , _2 ] = await sub.getDocument( BUYER_DOCUMENT, document_uuid) ;

    if(old_document == undefined) {

		// status からrecordを削除する

		msg = 'Record is not exist.'
		return [msg , 2];
    }

    // 3.
    // Does document_uuid already notexist in the archive status table?
    //
    const [ _3, err3 ] = await sub.notexist_check( BUYER_ARCHIVE_STATUS, document_uuid)

    if (err3 ) {

		msg = 'document_uuid is not exist.'
		return [msg , 3];
    }

    // 4.
    // Does document_uuid already notexist in the archive document table?
    //
    const [ _4, err4] = await sub.notexist_check( BUYER_ARCHIVE_DOCUMENT, document_uuid)
    if (err4 ) {

		msg = 'document_uuid is not exist.'
		return [msg , 4];
    }

    // 5.
    // begin Transaction
    //
    const [ conn , _5 ] = await tran.connection ();
    await tran.beginTransaction(conn);

    // 6.
    // Then we go ahead and insert into the archive status
    //

    old_status.document_folder  = 'trash';

    //old_status.buyer_archived  = 1;

    // 7.
    const [ _7, err7 ] = await tran.insertArchiveStatus(conn, BUYER_ARCHIVE_STATUS, old_status);
    if (err7 ) {

		msg = 'Could not inseret record.'
        return [tran.rollback(conn,  msg), 7];
    }

    // 8.
    // And then we need to insert into the archive document
    //
    const [ _8, err8 ] = await tran.insertDocument(conn, BUYER_ARCHIVE_DOCUMENT, old_status, old_document.document_json);
    if(err8) {

		msg = 'Could not inseret record.'
        return [tran.rollback(conn,  msg), 8];
    }

    // 9.
    // Remove recoiored from BUYER_STATUS with docunent_uuid key
    //
    const [ _9, err9 ] = await tran.deleteStatus(conn, BUYER_STATUS, old_status) ;
    if(err9) {

		msg = 'Could not delete record.'
        return [tran.rollback(conn,  msg), 9];
    }

    // 10
    // Remove recoiored from BUYER_DOCUMENT with docunent_uuid key
    //
    const [ _10, err10 ] = await tran.deleteDocument(conn, BUYER_DOCUMENT, old_status) ;
    if(err10) {

		msg = 'Could not delete record.'
        return [tran.rollback(conn,  msg), 10];
    }

    // 11.
    // commit
    //
    const [ _11, err11 ] = await tran.commit(conn);

    if (err11) {

		msg = 'Could not commit.'
        return [tran.rollback(conn,  msg), 11];
    }

    // 12.
    //
    conn.end();

	return [null, 0]
}

