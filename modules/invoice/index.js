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

// Seller Status
const { createDraft } = require('./draft_seller_create')
const { updateDraft } = require('./draft_seller_update')
const { sendInvoice } = require('./status_seller_send')
const { recreateInvoice } = require('./status_seller_recreate')
const { withdrawInvoice } = require('./status_seller_withdraw')

// Buyer Status
const { confirmInvoice } = require('./status_buyer_confirm')
const { unconfirmInvoice } = require('./status_buyer_unconfirm')
const { returnInvoice } = require('./status_buyer_return')
const { payInvoice } = require('./status_buyer_pay')

const updateStatus = async (
    action, // enum send, confirm, unconfirm
    member_did, // string did:key:123
    document_uuid, // string uuid
    wallet_address, // string | null (used for pay)
    gasLimit // number | null (userd for pay)
) => {
    switch (action) {
        case 'send':
            // seller
            return await sendInvoice(member_did, document_uuid)
        case 'recreate':
            // seller
            return await recreateInvoice(member_did, document_uuid)
        case 'withdraw':
            // seller
            return await withdrawInvoice(member_did, document_uuid)
        case 'return':
            // buyer
            return await returnInvoice(member_did, document_uuid)
        case 'confirm':
            // buyer
            return await confirmInvoice(member_did, document_uuid)
        case 'unconfirm':
            // buyer
            return await unconfirmInvoice(member_did, document_uuid)
        case 'pay':
            // buyer
            return await payInvoice(
                member_did,
                document_uuid,
                wallet_address,
                gasLimit
            )
        default:
            throw new Error('invalid status provided')
    }
}

module.exports = {
    createDraft,
    updateDraft,
    updateStatus,
}
