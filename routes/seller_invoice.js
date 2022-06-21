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
const sub = require("./invoice_sub.js");
const to_buyer = require("./seller_to_buyer.js");
const tran = require("./invoice_sub_transaction.js");

// Import Router
const express = require("express");
const router = express.Router();
module.exports = router;

// Libraries

const uuidv1 = require("uuid").v1;
const uniqid = require("uniqid");
const moment = require("moment");

// import Sign

const db = require("../database.js");
const sign_your_credentials = require("./sign_your_credentials.js");
const { makePresentation } = require("../modules/presentations_out.js");

// Database

// Table Name
const SELLER_DRAFT_DOCUMENT = "seller_document_draft";
const SELLER_DRAFT_STATUS = "seller_status_draft";

const SELLER_DOCUMENT = "seller_document";
const SELLER_STATUS = "seller_status";

const SELLER_ARCHIVE_DOCUMENT = "seller_document_archive";
const SELLER_ARCHIVE_STATUS = "seller_status_archive";

const CONTACTS = "contacts";

const getPrivateKeys = async (member_did) => {
  const sql = `
		SELECT
			public_key
		FROM
			privatekeys
		WHERE
			member_did = ?
	`;

  const args = [member_did];

  let row;
  try {
    row = await db.selectOne(sql, args);
  } catch (err) {
    return [null, err];
  }

  const keyPair = JSON.parse(row.public_key);
  return [keyPair, null];
};

// ------------------------------- End Points -------------------------------

/*
 * [ Send Invoice ]
 * send
 */

router.post("/send", async function (req, res) {
  const start = Date.now();

  const { document_uuid } = req.body;
  const { member_uuid } = req.session.data;

  let code, errno;

  // 1.
  const [buyer_uuid, err1] = await sub.getBuyerUuidForDraft(
    SELLER_DRAFT_STATUS,
    document_uuid,
    member_uuid
  );
  if (err1) {
    console.log(
      "Error 1.1 status = 400 err=" +
        err1 +
        ":" +
        document_uuid +
        ":" +
        member_uuid
    );

    return res.status(400).json(err1);
  }
  if (buyer_uuid == null) {
    console.log("Error 1.2 :" + document_uuid + ":" + member_uuid);
    return res.status(400).json({ err: 1, msg: "buyer_uuid is not found" });
  }

  // 2.
  const [buyer_host, err2] = await sub.getBuyerHost(
    CONTACTS,
    member_uuid,
    buyer_uuid
  );
  if (err2) {
    console.log(
      "Error 2 status = 400 err=" + err2 + ":" + member_uuid + ":" + buyer_uuid
    );
    return res.status(400).json(err2);
  }

  // 4.
  // DRAFT_STATUS
  // First we go ahead and get the draft status.
  //
  const [status, _4] = await sub.getStatus(SELLER_DRAFT_STATUS, document_uuid);

  if (status.document_uuid == null) {
    console.log("document_uuid is null");

    res.json({ err: 4, msg: "document_uuid is null" });
    return;
  }

  // 5.
  // Creating Send data.
  //
  status.document_uuid = document_uuid;
  status.document_type = "invoice";
  status.document_folder = "sent";

  // 6.
  // Second we go ahead and get the draft document
  //
  const [document] = await sub.getDraftDocumentForSend(
    SELLER_DRAFT_DOCUMENT,
    document_uuid
  );

  if (document.document_uuid == null) {
    console.log("document_uuid is null");

    res.json({ err: 6, msg: "document_uuid is null" });
    return;
  }

  document.seller_uuid = member_uuid;
  document.buyer_uuid = buyer_uuid;

  // 7.
  // signInvoice
  //

  const signedCredential = await sign_your_credentials.signInvoice(
    document.document_uuid,
    document.document_json
  );
  const document_json = JSON.stringify(signedCredential);

  document.document_json = document_json;

  if (document.document_json == null) {
    console.log("document_json == null");

    res.json({ err: 7, msg: "document_json is null" });
    return;
  }

  // 8.
  // Does document_uuid already notexist in the status table?
  //
  const [_8, err8] = await sub.notexist_check(SELLER_STATUS, document_uuid);
  if (err8) {
    errno = 8;
    console.log("Error: " + errno);
    return res.status(400).json({ err: errno, msg: err8 });
  }

  // 9.
  // Does document_uuid already notexist in the document table?
  //
  const [_9, err9] = await sub.notexist_check(SELLER_DOCUMENT, document_uuid);
  if (err9) {
    errno = 9;
    console.log("Error: " + errno);
    return res.status(400).json({ err: errno, msg: err9 });
  }

  // 10.
  // begin Transaction
  //
  const [conn, _10] = await tran.connection();
  await tran.beginTransaction(conn);

  // 11.
  // Then we go ahead and insert into the status
  //
  const [_11, err11] = await tran.insertStatus(conn, SELLER_STATUS, status);

  if (err11) {
    errno = 11;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err11, errno));
  }

  // 12.
  // And then we need to insert into database
  //
  const [_12, err12] = await tran.insertDocument(
    conn,
    SELLER_DOCUMENT,
    status,
    document_json
  );
  if (err12) {
    errno = 12;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err12, errno));
  }

  // 13.
  // Remove from SELLER_DRAFT_STATUS with docunent_uuid key
  //
  const [_13, err13] = await tran.deleteStatus(
    conn,
    SELLER_DRAFT_STATUS,
    status
  );
  if (err13) {
    errno = 13;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err13, errno));
  }

  // 14.
  // Remove from SELLER_DRAFT_DOCUMENT with docunent_uuid key
  //
  const [_14, err14] = await tran.deleteDocument(
    conn,
    SELLER_DRAFT_DOCUMENT,
    status
  );
  if (err14) {
    errno = 14;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err14, errno));
  }

  // 15.
  // Send 'send' message to buyer.

  const presenationSlug = "/api/presentations/available";
  const url = buyer_host + presenationSlug;

  const [keyPair] = await getPrivateKeys(member_uuid);
  const vc = JSON.parse(document.document_json);
  const [code15, err15] = await makePresentation(url, keyPair, vc);

  if (err15) {
    console.log("OMG nuuuu it failed");
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code15, 15, errno));
  }

  // 16.
  // commit
  //
  const [_16, err16] = await tran.commit(conn);

  if (err16) {
    errno = 16;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err16, errno));
  }

  // 17.
  //
  conn.end();

  //console.log("/send accepted");

  res.json({
    err: 0,
    msg: status.document_uuid,
  });

  const end = Date.now();
  console.log("/send Time: %d ms", end - start);
});

/*
 * [ Move to Draft ]
 */
router.post("/recreate", async function (req, res) {
  const METHOD = "/recreate";

  let start = Date.now();

  const { document_uuid } = req.body;
  const { member_uuid } = req.session.data;

  let errno, code;

  let status, document;

  // 1.
  //
  const [buyer_uuid, err1] = await sub.getBuyerUuid(
    SELLER_STATUS,
    document_uuid,
    member_uuid
  );
  if (err1) {
    console.log("Error 1.1 status = 400 err=" + err1);

    return res.status(400).json(err1);
  }

  // 2.
  //
  const [buyer_host, err2] = await sub.getBuyerHost(
    CONTACTS,
    member_uuid,
    buyer_uuid
  );
  if (err2) {
    console.log("Error 1.2 status = 400 err=" + err2);
    return res.status(400).json(err2);
  }

  //3. buyer connect check
  //
  const [code3, err3] = await to_buyer.connect(
    buyer_host,
    member_uuid,
    buyer_uuid
  );

  if (code3 !== 200) {
    console.log("Error 3.1 status = 400 code=" + code3);
    let msg;
    if (code == 500) {
      msg = { err: "buyer connect check:ECONNRESET" };
    } else {
      switch (err3) {
        case "Not found.":
          msg = { err: "The destination node cannot be found." };
          break;
        default:
          msg = { err: err3 };
          break;
      }
    }
    return res.status(400).json(msg);
  }

  // 4
  // STATUS
  // First we go ahead and get the status.
  //
  const [old_status, _4] = await sub.getStatus(SELLER_STATUS, document_uuid);

  if (old_status.document_uuid == null) {
    console.log("document_uuid is null");

    res.json({
      err: 32,
      msg: "document_uuid is null",
    });
    return;
  }

  // 5.
  // Creating Draft data.
  //
  let prefix = "inv-";

  status = JSON.parse(JSON.stringify(old_status));
  status.document_uuid = uuidv1();
  status.document_type = "invoice";
  status.document_folder = "draft";

  status.document_number = prefix + uniqid.time();
  let d = new Date();
  status.create_on = d.toISOString();
  status.due_by = moment().add(30, "days").format("YYYY-MM-DD");

  // 6.
  // Second we go ahead and get the document
  //
  const [old_document, _6] = await sub.getDocument(
    SELLER_DOCUMENT,
    document_uuid
  );

  if (old_document.document_uuid == null) {
    console.log("document_uuid is null");

    res.json({
      err: 42,
      msg: "document_uuid is null",
    });
    return;
  }

  // 7.
  // Creating Send data.
  //

  document = {};

  // 7.1 document_uuid
  //
  document.document_uuid = status.document_uuid;

  // 7.2 document_json
  //
  let document_json = JSON.parse(old_document.document_json);

  document_json.credentialSubject.type = "Invoice";

  // Update if customerReferenceNumber is revised.
  //
  // document_json.credentialSubject.customerReferenceNumber = document_json.credentialSubject.customerReferenceNumber;

  document_json.credentialSubject.identifier = status.document_uuid;
  document_json.credentialSubject.invoiceNumber = status.document_number;
  document_json.credentialSubject.purchaseDate = status.due_by;
  document_json.credentialSubject.invoiceDate = status.create_on;

  document.document_json = JSON.stringify(document_json);

  // 7.3 document_type
  //
  document.document_type = status.document_type;

  // 7.4 subject_line
  //
  document.subject_line = old_status.subject_line;

  // 7.5 currency_options
  //
  const currency_options = {
    formatWithSymbol: true,
    symbol: "Gwei",
    separator: ",",
    decimal: ".",
    precision: 0,
    pattern: "# !",
  };
  document.currency_options = JSON.stringify(currency_options);

  // 7.6 seller_uuid
  //
  document.seller_uuid = old_status.seller_uuid;

  // 7.7 seller_details
  //
  let seller = document_json.credentialSubject.seller;
  let seller_details = {};
  seller_details.organization_name = seller.name;
  seller_details.organization_tax_id = seller.taxId;
  seller_details.organization_department = seller.description;
  seller_details.organization_building = seller.address.streetAddress;
  seller_details.building = seller.address.addressLocality;
  seller_details.addressCountry = seller.address.addressCountry;
  seller_details.addressRegion = seller.address.addressRegion;
  seller_details.addressCity = seller.address.addressCity;

  document.seller_details = JSON.stringify(seller_details);

  // 7.8 seller_membername
  //
  let seller_membername =
    document_json.credentialSubject.seller.contactPoint.split("@")[0];
  document.seller_membername = seller_membername;

  // 7.9 buyer_uuid
  //
  document.buyer_uuid = old_status.buyer_uuid;

  // 7.10 buyer_details
  //
  let buyer = document_json.credentialSubject.buyer;
  let buyer_details = {};
  buyer_details.organization_name = buyer.name;
  buyer_details.organization_tax_id = buyer.taxId;
  buyer_details.organization_department = buyer.description;
  buyer_details.organization_building = buyer.address.streetAddress;
  buyer_details.building = buyer.address.addressLocality;
  buyer_details.addressCountry = buyer.addressCountry;
  buyer_details.addressRegion = buyer.addressRegion;
  buyer_details.addressCity = buyer.addressCity;

  document.buyer_details = JSON.stringify(buyer_details);

  // 7.11 buyer_membername
  //
  let buyer_membername =
    document_json.credentialSubject.buyer.contactPoint.split("@")[0];
  document.buyer_membername = buyer_membername;

  // 7.12 create_on
  //
  document.create_on = status.create_on;

  // 7.13 document_meta
  //
  document.document_meta = {};

  let document_meta = {};
  document_meta.document_number = status.document_number;
  document_meta.created_on = status.create_on.substr(0, 10);
  document_meta.taxId = document_json.credentialSubject.seller.taxId;
  document_meta.due_by = status.due_by;

  document.document_meta = JSON.stringify(document_meta);

  // 7.14 document_body
  //
  let document_body = [];
  let iS = document_json.credentialSubject.itemsShipped;
  let max_rows = iS.length;
  for (let i = 0; i < max_rows; i++) {
    document_body[i] = {};

    document_body[i].date = iS[i].description;
    document_body[i].desc = iS[i].product.description;
    document_body[i].price =
      iS[i].product.productPrice.price +
      " " +
      iS[i].product.productPrice.priceCurrency;
    document_body[i].unit = iS[i].product.sizeOrAmount.unitCode;
    document_body[i].quan = iS[i].product.sizeOrAmount.value;
    document_body[i].subtotal =
      iS[i].lineItemTotalPrice.price +
      " " +
      iS[i].lineItemTotalPrice.priceCurrency;
  }
  document.document_body = JSON.stringify(document_body);

  // 7.15 document_totals
  //
  let document_totals = {};
  document_totals.subtotal =
    document_json.credentialSubject.invoiceSubtotal.price +
    " " +
    document_json.credentialSubject.invoiceSubtotal.priceCurrency;
  document_totals.total =
    document_json.credentialSubject.totalPaymentDue.price +
    " " +
    document_json.credentialSubject.totalPaymentDue.priceCurrency;

  document.document_totals = JSON.stringify(document_totals);

  // 8.
  // Does document_uuid already notexist in the default status table?
  //
  const [_8, err8] = await sub.notexist_check(
    SELLER_DRAFT_STATUS,
    document_uuid
  );
  if (err8) {
    errno = 8;
    console.log("Error: " + errno);
    return res.status(400).json({ err: errno, msg: err8 });
  }

  // 9.
  // Does document_uuid already notexist in the default document table?
  //
  const [_9, err9] = await sub.notexist_check(
    SELLER_DRAFT_DOCUMENT,
    document_uuid
  );
  if (err9) {
    errno = 9;
    console.log("Error: " + errno);
    return res.status(400).json({ err: errno, msg: err9 });
  }

  // 10.
  // begin Transaction
  //
  const [conn, _10] = await tran.connection();
  await tran.beginTransaction(conn);

  // 11.
  // Then we go ahead and insert into the draft status
  //

  const [_11, err11] = await tran.insertStatus(
    conn,
    SELLER_DRAFT_STATUS,
    status
  );

  if (err11) {
    errno = 11;
    insertDraftDocument;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err11, errno));
  }

  // 12.
  // And then we need to insert into the draft document
  //
  const [_12, err12] = await tran.insertDraftDocument(
    conn,
    SELLER_DRAFT_DOCUMENT,
    document
  );

  if (err12) {
    console.log("err12=" + err12);
    errno = 12;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err12, errno));
  }

  // 13.
  // Remove from SELLER_STATUS with docunent_uuid key
  //
  const [_13, err13] = await tran.deleteStatus(conn, SELLER_STATUS, old_status);

  if (err13) {
    errno = 13;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err13, errno));
  }

  // 14.
  // Remove from SELLER_DOCUMENT with docunent_uuid key
  //
  const [_14, err14] = await tran.deleteDocument(
    conn,
    SELLER_DOCUMENT,
    old_status
  );
  if (err14) {
    errno = 14;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err14, errno));
  }

  // 15.
  // Then we go ahead and insert into the archive status
  //

  old_status.document_folder = "trash";
  const [_15, err15] = await tran.insertStatus(
    conn,
    SELLER_ARCHIVE_STATUS,
    old_status
  );

  if (err15) {
    errno = 15;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err15, errno));
  }

  // 16.
  // And then we need to insert into the archive document
  //
  const [_16, err16] = await tran.insertDocument(
    conn,
    SELLER_ARCHIVE_DOCUMENT,
    old_status,
    old_document.document_json
  );

  if (err16) {
    errno = 16;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err16, errno));
  }

  // 17.
  // Send 'recreate' message to buyer.
  //

  const [code17, err17] = await to_buyer.recreate(
    buyer_host,
    old_status.document_uuid,
    old_status.seller_uuid
  );

  if (parseInt(code17) !== 200) {
    errno = 17;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code17, err17, errno));
  }

  // 18.
  // commit
  //
  const [_18, err18] = await tran.commit(conn);

  if (err18) {
    errno = 18;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err18, errno));
  }

  // 19.
  //
  conn.end();

  //console.log("recreate accepted");

  res.json({
    err: 0,
    msg: status.document_uuid,
  });

  let end = Date.now();
  console.log("/recreate Time: %d ms", end - start);
});

/*
 * [ Withdraw ]
 * withdraw
 */
router.post("/withdraw", async function (req, res) {
  let start = Date.now();

  const { document_uuid, document_folder } = req.body;
  const { member_uuid } = req.session.data;

  let errno, code;

  // 1.
  //
  const [buyer_uuid, err1] = await sub.getBuyerUuid(
    SELLER_STATUS,
    document_uuid,
    member_uuid
  );

  if (err1) {
    console.log("Error 1 status = 400 err=" + err1);

    return res.status(400).json(err1);
  }

  // 2.
  const [buyer_host, err2] = await sub.getBuyerHost(
    CONTACTS,
    member_uuid,
    buyer_uuid
  );

  if (err2) {
    console.log("Error 2 status = 400 err=" + err2);
    return res.status(400).json(err2);
  }

  //3. buyer connect check
  const [code3, err3] = await to_buyer.connect(
    buyer_host,
    member_uuid,
    buyer_uuid
  );

  if (code3 !== 200) {
    console.log("Error 3 status = 400 code=" + code3);
    let msg;
    if (code3 == 500) {
      msg = { err: "buyer connect check:ECONNRESET" };
    } else {
      switch (err3) {
        case "Not found.":
          msg = { err: "The destination node cannot be found." };
          break;
        default:
          msg = { err: err3 };
          break;
      }
    }
    return res.status(400).json(msg);
  }

  // 4
  // STATUS
  // First we go ahead and get the status.
  //
  const [old_status, _4] = await sub.getStatus(SELLER_STATUS, document_uuid);

  // Does record exist?
  if (old_status.document_uuid == null) {
    console.log("document_uuid is null");
    errno = 4;

    let msg = { err: errno, msg: document_uuid };

    return res.status(400).json(msg);
  }

  // 5.
  // Does document_uuid already exist in the status table?
  //
  const [_5, err5] = await sub.exist_check(SELLER_STATUS, document_uuid);

  if (err5) {
    console.log("Error 5 status = 400 code=" + err5);
    errno = 5;
    return res.status(400).json({ err: err5, code: errno });
  }

  // 6.
  // Does document_uuid already exist in the document table?
  //
  const [_6, err6] = await sub.exist_check(SELLER_DOCUMENT, document_uuid);

  if (err6) {
    console.log("Error 6 status = 400 code=" + err6);
    errno = 6;
    return res.status(400).json({ err: err6, code: errno });
  }

  // 7.
  // begin Transaction
  //
  const [conn, _7] = await tran.connection();
  await tran.beginTransaction(conn);

  // 8.
  // update status
  //

  const [_8, err8] = await tran.setWithdrawSeller(
    conn,
    SELLER_STATUS,
    document_uuid,
    member_uuid,
    document_folder
  );

  if (err8) {
    console.log("Error 8 status = 400 code=" + err8.msg);
    errno = 8;
    code = 400;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code, err8, errno));
  }

  // 9.
  // Send 'withdraw" message to buyer.
  //

  const [code9, err9] = await to_buyer.withdraw(
    buyer_host,
    old_status.document_uuid,
    old_status.buyer_uuid,
    document_folder
  );

  if (code9 !== 200) {
    console.log("Error 9 status = 400 code=" + err9);
    errno = 9;
    return res
      .status(400)
      .json(tran.rollbackAndReturn(conn, code9, err9, errno));
  }

  // 10
  // commit
  //
  const [_10, err10] = await tran.commit(conn);

  if (err10) {
    console.log("Error 10 status = 400 code=" + err10);
    errno = 10;
    code = 400;
    let msg = tran.rollbackAndReturn(conn, code, err10, errno);

    // 11.
    //
    const [seller_host, err11] = await sub.getSellerHost(
      CONTACTS,
      member_uuid,
      buyer_uuid
    );

    if (err11) {
      console.log("Error 11 status = 400 err=" + err11);
      return res.status(400).json(err11);
    }

    // 12.
    //
    const [code12, err12] = await to_buyer.rollbackReturnToSent(
      seller_host,
      buyer_uuid,
      member_uuid
    );

    if (code12 !== 200) {
      console.log("Error 12 code=" + code12 + ":err=" + err12);
      if (code12 == 500) {
        msg = { err: "seller connect check:ECONNRESET" };
      } else {
        msg = { err: err12 };
      }
    }

    return res.status(400).json(msg);
  }

  // 13.
  //
  conn.end();

  //console.log("/withdraw accepted");

  res.json({
    err: 0,
    msg: document_uuid,
  });

  let end = Date.now();
  console.log("/withdraw Time: %d ms", end - start);
});
