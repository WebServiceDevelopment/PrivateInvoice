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

const { sendInvoice } = require('./status_seller_send')
const { confirmInvoice } = require('./status_buyer_confirm')
const { unconfirmInvoice } = require('./status_buyer_unconfirm')

const updateStatus = async (
    action, // enum send, confirm, unconfirm
    member_did, // string did:key:123
    document_uuid, // string uuid
) => {

    switch (action) {
        case 'send':
            // seller
            await sendInvoice(member_did, document_uuid)
            break;
        case 'confirm':
            // buyer
            await confirmInvoice(member_did, document_uuid)
            break;
        case 'unconfirm':
            // buyer
            await unconfirmInvoice(member_did, document_uuid)
            break;
        default:
            return res.status(400).end('invalid status provided');
    }

}

module.exports = {
    updateStatus
}
