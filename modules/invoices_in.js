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

// Database Libraries
const db						= require('../database.js');

// Table Name
const BUYER__DOCUMENT			= 'buyer_document'
const BUYER__STATUS				= 'buyer_status'

const SELLER_DRAFT_DOCUMENT     = "seller_document_draft";
const SELLER_DRAFT_STATUS   	= "seller_status_draft";

const CONTACTS					= 'contacts'

const sub  						= require('./invoice_sub.js')
const tran 						= require('./invoice_sub_transaction.js')

// Exports
module.exports = {
    getMemberInfo           	: _getMemberInfo,
    getOrganizationInfo     	: _getOrganizationInfo,
	insertSellerDraftStatus 	: _insertSellerDraftStatus,
	insertSellerDraftDocument	: _insertSellerDraftDocument,

    handleIncomingInvoice		: _handleIncomingInvoice,
}

// Error Message
const MESSAGE_AFFECTED_ROWS     = ":result.affectedRows != 1";

// --------------------------------- Modules ---------------------------------
/*
 *	getMemberInfo
 */
async function _getMemberInfo ( member_did ) {

	const sql = `
        SELECT
            member_did as member_did,
            membername,
			organization_uuid,
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
    } catch(err) {
		const msg = "This member_did is not found."
		return [null, msg];

    }

	return [row, null];
}

/*
 *	getOrganizationInfo
 */
async function _getOrganizationInfo ( organization_uuid ) {

	const sql = `
        SELECT
            organization_name,
            organization_address,
            organization_building,
            organization_department,
            organization_tax_id,
			organization_postcode,
            addressCountry,
            addressRegion,
            addressCity
        FROM
            organizations
        WHERE
			organization_uuid = ?
    `;

    const args = [organization_uuid];

    let  org;
    try {
        org = await db.selectOne(sql, args);
    } catch(err) {
		const msg = "This organization_uuid is not found."
		return [null, msg];
    }

	return [org, null];
}


async function _insertSellerDraftStatus (conn, args) {

	const sql = `
		INSERT INTO ${SELLER_DRAFT_STATUS} (
			document_uuid,
			document_type,
			document_number,
			document_folder,
			seller_did,
			seller_membername,
			seller_organization,
			seller_last_action,
			subject_line,
			due_by,
			amount_due
		) VALUES (
			?,
			?,
			?,
			?,
			?,
			?,
			?,
			NOW(),
			'',
			?,
			?
		)
	`;

	const [result , err ] = await tran.insert(conn, sql, args);

	if(err) {
		return [result , err ]
	}

	if(result.affectedRows != 1) {
		let msg = {Message:MESSAGE_AFFECTED_ROWS};
		return [result , msg ]
	}

	return [result , err ];

}

async function _insertSellerDraftDocument (conn, args) {

	const sql = `
		INSERT INTO ${SELLER_DRAFT_DOCUMENT} (
			document_uuid,
			document_json,
			document_type,

			currency_options,

			seller_did,
			seller_membername,
			seller_details,
			document_meta,
			document_body,
			document_totals
		) VALUES (
			?,
			?,
			?,

			?,

			?,
			?,
			?,
			?,
			?,
			?
		)
	`;

	const [result , err ] = await tran.insert(conn, sql, args);

	return [result , err ];

}


/*
 * handleIncomingInvoice
 */
async function _handleIncomingInvoice (invoiceCert, res) {
    //console.log("/buyerToSend");

    const { credentialSubject } = invoiceCert
    const { totalPaymentDue } = credentialSubject
    const document_uuid = credentialSubject.identifier
    const seller_did = credentialSubject.seller.id
    const buyer_did = credentialSubject.buyer.id
    const document_json = JSON.stringify(invoiceCert)

    const status = {
        document_uuid,
        document_type: 'invoice',
        document_number: credentialSubject.invoiceNumber,
        seller_did,
        seller_membername: credentialSubject.seller.contactPoint
            .split('@')
            .shift(),
        seller_organization: credentialSubject.seller.name,
        seller_archived: 0,
        seller_last_action: new Date(),
        buyer_did,
        buyer_membername: credentialSubject.buyer.contactPoint
            .split('@')
            .shift(),
        buyer_organization: credentialSubject.buyer.name,
        buyer_archived: 0,
        buyer_last_action: new Date('0000-00-00 00:00:00'),
        created_from: null,
        root_document: null,
        created_on: new Date(credentialSubject.invoiceDate),
        removed_on: null,
        opened: 0,
        subject_line: credentialSubject.customerReferenceNumber,
        due_by: new Date(credentialSubject.purchaseDate),
        amount_due: `${totalPaymentDue.price} ${totalPaymentDue.priceCurrency}`,
        document_folder: 'sent',
    }

    //console.log(document);
    let errno, code

    // 1.

    //console.log("/buyerToSend:"+CONTACTS+":"+ seller_did+":"+ buyer_did);

    // 2.
    // Second we check to see if there is any contact information
    const [_2, err2] = await sub.getSellerHost(
        CONTACTS,
        seller_did,
        buyer_did
    )

    if (err2) {
        console.log('/buyerToSend:err 2')
        return res.status(400).json(err2)
    }

    // 3.
    // Then we check to see if there is any data already registered
    //
    const [_3, err3] = await sub.checkForExistingDocument(
        BUYER__DOCUMENT,
        document_uuid
    )

    if (err3) {
        console.log('/buyerToSend:err 3')
        return res.status(400).json(err3)
    }

    /*
     * Convert time format from ISO format to Date format.
     */
    // 4.
    //
    status.due_by = new Date(Date.parse(status.due_by))

    // 5.
    // begin Transaction
    //
    const [conn, _5] = await tran.connection()
    await tran.beginTransaction(conn)

    // 6.
    const [_6, err6] = await tran.insertDocument(
        conn,
        BUYER__DOCUMENT,
        status,
        document_json
    )

    if (err6) {
        console.log('/buyerToSend:err 6')
        errno = 6
        code = 400
        return res
            .status(400)
            .json(tran.rollbackAndReturn(conn, code, err6, errno))
    }

    // 7.
    //
    const [_7, err7] = await tran.insertStatus(conn, BUYER__STATUS, status)

    if (err7) {
        console.log('/buyerToSend:err 7')
        errno = 7
        code = 400
        return res
            .status(400)
            .json(tran.rollbackAndReturn(conn, code, err7, errno))
    }

    // 8.
    // commit
    //
    const [_8, err8] = await tran.commit(conn)

    if (err8) {
        console.log('/buyerToSend:err 8')
        errno = 8
        code = 400
        return res
            .status(400)
            .json(tran.rollbackAndReturn(conn, code, err8, errno))
    }

    // 9.
    //
    conn.end()
    res.status(200).end('accepted')

    console.log('/buyerToSend accepted')
}

