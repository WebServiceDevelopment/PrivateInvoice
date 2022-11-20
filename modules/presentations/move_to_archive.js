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
const sub = require("../invoice_sub.js");
const tran = require("../invoice_sub_transaction.js");

// Libraries

const BUYER_DOCUMENT = "buyer_document";
const BUYER_STATUS = "buyer_status";

const BUYER_ARCHIVE_DOCUMENT = "buyer_document_archive";
const BUYER_ARCHIVE_STATUS = "buyer_status_archive";

const CONTACTS = "contacts";

const moveToArchive = async (document_uuid) => {

  const _NO = "090";
  const FOLDER = 'paid';

  let errno, code;

  // 1.
  // getStatus
  // First we go ahead and get the status.
  // Does record exist?
  //
  const [old_status, _1] = await sub.getStatus(BUYER_STATUS, document_uuid);

  if (old_status == undefined) {
    return 1;
  }

  // 2.
  // Second we go ahead and get the document
  // Does record exist?
  //
  const [old_document, _2] = await sub.getDocument(BUYER_DOCUMENT, document_uuid);

  if (old_document == undefined) {
    return 2;
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
  const [seller_host, err4] = await sub.getSellerHost(CONTACTS, seller_did, member_did);
  if (err4) {
    console.log("Error 4 status = 400 err=" + err4 + ":NO=" + _NO);
    return 4;
  }

  // 5.
  // Compare Host address and req.ip.
  // Are the two ips the same?
  //

  /*
    if(!check_ipadder(req.ip , seller_host)) {
        console.log("invalid request : req.ip="+req.ip+":seller_host="+seller_host);
        let err5 = {err:"invalid host"};
    return 5;
    }
  */

  // 6.
  // Does document_uuid already notexist in the archive status table?
  //
  const [bool6, err6] = await sub.notexist_check(BUYER_ARCHIVE_STATUS, document_uuid)
  if (bool6 == false) {
    return 6;
  }

  // 7.
  // Does document_uuid already notexist in the archive document table?
  //
  const [bool7, err7] = await sub.notexist_check(BUYER_ARCHIVE_DOCUMENT, document_uuid)
  if (bool7 == false) {
    return 7;
  }


  // 8.
  // begin Transaction
  //
  const [conn, _8] = await tran.connection();
  await tran.beginTransaction(conn);

  // 9.
  //

  old_status.document_folder = FOLDER;
  old_status.seller_archived = 1;
  old_status.buyer_archived = 1;

  // 10.
  // Then we go ahead and insert into the archive status
  //
  const [_10, err10] = await tran.insertArchiveStatus(conn, BUYER_ARCHIVE_STATUS, old_status);

  if (err10) {
    errno = 10;
    code = 400;
    return 10;
  }

  // 11.
  // And then we need to insert into the archive document
  //
  const [_11, err11] = await tran.insertArchiveDocument(conn, BUYER_ARCHIVE_DOCUMENT, old_document);

  if (err11) {
    errno = 11;
    code = 400;
    return 11;
  }

  // 12.
  // Remove recoiored from BUYER_STATUS with docunent_uuid key
  //
  const [_12, err12] = await tran.deleteStatus(conn, BUYER_STATUS, old_status);

  if (err11) {
    errno = 12;
    code = 400;
    return 12;
  }

  // 13.
  // Remove recoiored from BUYER_DOCUMENT with docunent_uuid key
  //
  const [_13, err13] = await tran.deleteDocument(conn, BUYER_DOCUMENT, old_status);

  if (err13) {
    errno = 13;
    code = 400;
    return 13;
  }


  // 14.
  // commit
  //
  const [_14, err14] = await tran.commit(conn);

  if (err14) {
    errno = 14;
    code = 400;
    return 14;
  }

  // 15.

  conn.end();
  console.log("moveToArchive accepted");

}

module.exports = {
  moveToArchive
}
