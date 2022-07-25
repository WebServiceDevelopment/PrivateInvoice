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

const JSON_SPACE_LENGTH = 2;


const SettingsWallet = (function() {

	const LIST_MAX = 20;

	this.MEM = {}

    const Elem = (id) => document.getElementById(id);

	this.DOM = {
		balance : {
			gwei : Elem('SettingsWallet.balance.balanceGwei'),
			wei : Elem('SettingsWallet.balance.balanceWei'),
		},
		deposit : {
			accountAddress : Elem('SettingsWallet.deposit.accountAddress'),
			networkType : Elem('SettingsWallet.deposit.networkType'),
			chainId : Elem('SettingsWallet.deposit.chainId'),
		},
		RecentActivity : Elem('SettingsWallet.RecentActivity.tbody'),
	}

	this.EVT = {
		download_receipt		: evt_download_receipt.bind(this),
		download_invoice		: evt_download_invoice.bind(this),
	}

	this.API = {
		getResentActivityOfWallet: api_getResentActivityOfWallet.bind(this),
		renderResentActivity 	: api_renderResentActivity.bind(this),
		getWalletInfo			: api_getWalletInfo.bind(this),
		renderWalletInfo		: api_renderWalletInfo.bind(this),
		loadResentActivity		: api_loadResentActivity.bind(this),
		clearResentActivity		: api_clearResentActivity.bind(this),
	}

	init.apply(this);

	return this;

	function init() {

	}
		
/*
 * api_clearResentActivity
 */
	function api_clearResentActivity () {

		this.DOM.RecentActivity.innerHTML = "";
			
	}

/*
 * api_loadResentActivity
 */
	function api_loadResentActivity() {

		this.API.clearResentActivity();

		this.API.getResentActivityOfWallet();

		this.API.getWalletInfo();
	}

/*
 * api_getResentActivityOfWallet
 */
    async function api_getResentActivityOfWallet() {
		const LIST_MAX = 20;

		const url = '/api/wallet/getResentActivityOfWallet';

		let response;
        try {
            response = await fetch( url+'?'+new URLSearchParams({
				list_max: LIST_MAX,
				start_position:1
            }).toString());

        } catch(err) {

            throw err;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {

            throw err;
        }

        if(response.status != 200) {
            alert("this.Message.sent\n"+res.err);
			return;
        }

		this.API.renderResentActivity(res.msg.activity);

    }

/*
 * api_renderResentActivity
 *
 * View Recent Activity
 *
 * Date				: activity[i].settlement_time	
 * Type				: activity[i].type = [Sale , Purchase]
 * Transaction Hash : activity[i].settlement_hash
 * Receipt			: this.EVT.download_receipt
 * Inviuce			: this.EVT.download_invoice
 * Amount			: activity[i].amount;
 */
	function api_renderResentActivity(activity) {

		let max = activity.length;
		let json, tr, span, date, type, transaction_hash, receipt, invoice, amount;

		for( let i=0; i< LIST_MAX ; i++) {

			if( i >=  max) {
				break;
			}

		
			json = JSON.stringify(activity[i].credentialSubject);

			tr = this.DOM.RecentActivity.insertRow();

			date = tr.insertCell();
			type = tr.insertCell();
			transaction_hash = tr.insertCell();

			receipt = tr.insertCell();
			receipt.setAttribute("class", "receipt");
			span = document.createElement("span");
			receipt.appendChild(span);
			span.setAttribute("class", "link");
			span.setAttribute("data", activity[i].settlement_hash);
			span.innerText = "download"
			span.addEventListener('click', this.EVT.download_receipt);

			invoice = tr.insertCell();
			invoice.setAttribute("class", "invoice");
			span = document.createElement("span");
			invoice.appendChild(span);
			span.setAttribute("class", "link");
			span.setAttribute("data", json);
			span.innerText = "download"
			span.addEventListener('click', this.EVT.download_invoice);

			amount = tr.insertCell();
			amount.setAttribute("class", "amount");

			date.innerText = activity[i].settlement_time;
			type.innerText = activity[i].type;
			transaction_hash.innerText = activity[i].settlement_hash;
			amount.innerText = activity[i].amount;

			switch (activity[i].type) {
			case "Sale":
				date.title = activity[i].buyer_name;
				transaction_hash.title = activity[i].buyer_id;
			break;
			case "Purchase":
				date.title = activity[i].seller_name;
				transaction_hash.title = activity[i].seller_id;
			break;
			default:
				console.log("Error:renderResentActivity type="+activity[i].type);
			break;
			}

		}
	}

/*
 * evt_download_receipt
 */
	async function evt_download_receipt(e) {


		const elm = e.target;

		const settlement_hash = elm.getAttribute("data");

        const params = {
			"settlement_hash" : settlement_hash
        }

       	const url = '/api/wallet/getReceiptInResentActivity';


		let response;
        try {
            response = await fetch( url+'?'+new URLSearchParams({
				settlement_hash : settlement_hash
            }).toString());

		} catch(err) {

            throw err;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {

            throw err;
        }


        if(response.status != 200) {
            alert("this.Message.sent\n"+res.err);
			return;
        }

		const receipt = res.msg.receipt;
		
		const filename =  settlement_hash+'.json';

		const blob = new Blob([JSON.stringify(receipt, null,JSON_SPACE_LENGTH)], {type : 'application/json'});
        saveAs(blob, filename);

	}

/*
 * evt_download_invoice
 */
	function evt_download_invoice(e) {


		const elm = e.target;

		const doc = JSON.parse(elm.getAttribute("data"));
		const filename =  doc.customerReferenceNumber+'.json';

		const blob = new Blob([JSON.stringify(doc, null,JSON_SPACE_LENGTH)], {type : 'application/json'});
        saveAs(blob, filename);

	}

/*
 * api_getWalletInfo
 */
    async function api_getWalletInfo() {

		const url = '/api/wallet/getWalletInfo';

        const params = {
        }

		const opts = {
            method: 'GET',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        }

		let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {

            throw err;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {

            throw err;
        }

        if(response.status != 200) {
            alert("this.Message.sent\n"+res.err);
			return;
        }

		this.API.renderWalletInfo(res.msg);

    }

/*
 * api_renderWalletInfo
 */
	function api_renderWalletInfo(msg) {

		const balanceGwei = msg.balanceGwei;
		const accountAddress = msg.accountAddress;
		const networkType = msg.networkType;
		const chainId = msg.chainId;

		let balance = balanceGwei.split(".");
		let gwei = parseInt(balance[0]);
		let wei = '0.'+balance[1];

		this.DOM.balance.gwei.innerText = gwei.toLocaleString();

		if(balance[1] != null )  {
			this.DOM.balance.wei.innerText = wei;
		}

		let deposit  = this.DOM.deposit;
		deposit.accountAddress.innerText = accountAddress;
		deposit.networkType.innerText = networkType;
		deposit.chainId.innerText = chainId;

	}


}).apply({});
