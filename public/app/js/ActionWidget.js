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

const ActionWidget = (function() {

	this.MEM = {
        timeout: 1500,
        getTimeout : () => this.MEM.timeout,

        saveTimeout : null,
        getSaveTimeout : () => this.MEM.saveTimeout,
        setSaveTimeout : (timeout) => this.MEM.saveTimeout = timeout,
        initSaveTimeout : () => this.MEM.saveTimeout = null,

		panel : null,
		getPanel : () => this.MEM.panel,
		setPanel : (panel) => this.MEM.panel = panel,
		initPanel : () => this.MEM.panel = null,

		document_uuid : null,
		getDocument_uuid : () => this.MEM.document_uuid,
		setDocument_uuid : (uuid) => this.MEM.document_uuid = uuid,

		ipfs_address : null,
		getIpfsAddress : () => this.MEM.ipfs_address,
		setIpfsAddress : (address) => this.MEM.ipfs_address = address,

		transaction_hash : null,
		getTransactionHash : () => this.MEM.transaction_hash,
		setTransactionHash : (hash) => this.MEM.transaction_hash = hash,
	}

	const Elem = (id) => document.getElementById(id);

	this.DOM = {
		modal : {
			body : Elem('ActionWidget.modal.body'),
			close : Elem('ActionWidget.modal.close'),
			cancel : Elem('ActionWidget.modal.cancel'),
			submit : Elem('ActionWidget.modal.submit'),
			gasLimit_input : Elem('ActionWidget.modal.gasLimit.input'),
			sending : Elem('ActionWidget.modal.sending'),
		},
		modal_transaction : {
			body : Elem('ActionWidget.modal_transaction.body'),
			close : Elem('ActionWidget.modal_transaction.close'),
			cancel : Elem('ActionWidget.modal_transaction.cancel'),
			ipfs_cid : Elem('ActionWidget.modal_transaction.ipfs_cid'),
		},
		modal_receipt : {
			body : Elem('ActionWidget.modal_receipt.body'),
			close : Elem('ActionWidget.modal_receipt.close'),
			cancel : Elem('ActionWidget.modal_receipt.cancel'),
			ipfs_cid : Elem('ActionWidget.modal_receipt.ipfs_cid'),
		},
		invoice : {
			// draft
			removeDraft :  Elem('ActionWidget.invoice.removeDraft'),
			sendInvoice : Elem('ActionWidget.invoice.sendInvoice'),
			returnInvoice : Elem('ActionWidget.invoice.returnToSender'),
			confirmInvoice : Elem('ActionWidget.invoice.confirmInvoice'),
			moveToTrash : Elem('ActionWidget.invoice.moveToTrash'),
			recreate : Elem('ActionWidget.invoice.recreate'),
			unconfirm : Elem('ActionWidget.invoice.unconfirm'),
			makePayment : Elem('ActionWidget.invoice.makePayment'),
			withdrawSent : Elem('ActionWidget.invoice.withdrawSent'),
			makePaymentWaiting : Elem('ActionWidget.invoice.makePaymentWaiting'),

			// paid
			sellerArchive : Elem('ActionWidget.invoice.sellerArchive'),

			// Trash
			buyerTrash : Elem('ActionWidget.invoice.buyerTrash'),
			sellerTrash : Elem('ActionWidget.invoice.sellerTrash'),
			sendInvoiceDisabled : () => {
				this.DOM.invoice.sendInvoice.setAttribute("disabled", "disabled")
				this.DOM.invoice.sendInvoice.disabled = true;
			},
			sendInvoiceEnabled : () => {
				this.DOM.invoice.sendInvoice.removeAttribute("disabled")
				this.DOM.invoice.sendInvoice.disabled = false;
			},
			sending : Elem('ActionWidget.invoice.sender-wrap'),

		},
		viewReport : {
			// paid
			moveToArciveBuyer : Elem('ActionWidget.viewReport.moveToArciveBuyer'),
			moveToArciveSeller : Elem('ActionWidget.viewReport.moveToArciveSeller'),

			// complete
			completeBuyer : Elem('ActionWidget.viewReport.completeBuyer'),
			completeSeller : Elem('ActionWidget.viewReport.completeSeller'),
		}
	}


	this.EVT = {
		handleInvoiceDraftDelete : evt_handleInvoiceDraftDelete.bind(this),
		handleInvoiceDraftSend : evt_handleInvoiceDraftSend.bind(this),
		handleInvoiceReturnClick : evt_handleInvoiceReturnClick.bind(this),
		handleInvoiceConfirmClick : evt_handleInvoiceConfirmClick.bind(this),
		handleInvoiceTrashClick : evt_handleInvoiceTrashClick.bind(this),
		handleInvoiceRecreate : evt_handleInvoiceRecreate.bind(this),
		handleInvoiceUnconfirm : evt_handleInvoiceUnconfirm.bind(this),
		handleInvoiceMakePayment : evt_handleInvoiceMakePayment.bind(this),
		handleInvoiceWithdrawSent : evt_handleInvoiceWithdrawSent.bind(this),

// modal
		handleModalCloseClick : evt_handleModalCloseClick.bind(this),
		handleModalSubmitClick : evt_handleModalSubmitClick.bind(this),

// modal_transaction
		handleModalTransactionCloseClick : evt_handleModalTransactionCloseClick.bind(this),

// modal_receipt
		handleModalReceiptCloseClick : evt_handleModalReceiptCloseClick.bind(this),

		handleBuyerWaitingClick : evt_handleBuyerWaitingClick.bind(this),
		handleMakePaymentWaitingClick : evt_handleMakePaymentWaitingClick.bind(this),
		handleSupplyArchiveClick : evt_handleSupplyArchiveClick.bind(this),
		handleBuyerTrashClick : evt_handleBuyerTrashClick.bind(this),
		handleSupplyTrashClick : evt_handleSupplyTrashClick.bind(this),

		handleViewReport : {
			moveToArciveBuyerClick : evt_handleViewReport_MoveToArciveBuyerClick.bind(this),
			moveToArciveSellerClick : evt_handleViewReport_MoveToArciveSellerClick.bind(this),

			completeBuyerClick : evt_handleViewReport_CompleteBuyerClick.bind(this),
			completeSellerClick : evt_handleViewReport_CompleteSellerClick.bind(this),
		},

		handleGasLimitBlur : evt_handleGasLimitBlur.bind(this),

		handleIpfs : {
			jsonDataClick : evt_handleIpfs_jsonDataClick.bind(this),
			jsonDataByTransactionClick : evt_handleIpfs_jsonDataByTransactionClick.bind(this),
		}
	}

	this.API = {
		openPanel : api_openPanel.bind(this),
		closePanel : api_closePanel.bind(this),
		submit : {
			readonly : api_submitReadonly.bind(this),
			reset: api_submitReset.bind(this),
		},
		trayRefreshAndClearDocument : api_trayRefreshAndClearDocument.bind(this),
		transaction_receipt : api_transaction_receipt.bind(this),
    	handleModalSubmit : api_handleModalSubmit.bind(this),
	}

	this.NETWORK = {
		invoiceDraftSend : network_invoiceDraftSend.bind(this),
		invoiceDraftDelete : network_invoiceDraftDelete.bind(this),
	}

	this.MESSAGE = {
		not_sent : "Could not be sent."
	}

	this.BUTTON = {
		timeout : 500,
		enabled : (button) => {
			const f = function (button) {
					button.removeAttribute("disabled" );
			}.bind(this, button);

			setTimeout( function(f) { f(); }.bind(this,f), this.BUTTON.timeout);
		},
		disabled : (button) => {
			button.setAttribute("disabled" , true);
		}
	}

	this.SENDING = {
		visible : () => { this.DOM.modal.sending.style.visibility = "visible"; },
		hidden : () => { this.DOM.modal.sending.style.visibility = "hidden"; },
	}

	this.SENDING_WRAP = {
		visible : () => { this.DOM.invoice.sending.style.visibility = "visible"; },
		hidden : () => { this.DOM.invoice.sending.style.visibility = "hidden"; },
	}


	init.apply(this);
	return this;

	function init() {
		
		this.DOM.invoice.removeDraft.addEventListener('click', this.EVT.handleInvoiceDraftDelete);
		this.DOM.invoice.sendInvoice.addEventListener('click', this.EVT.handleInvoiceDraftSend);
		this.DOM.invoice.returnInvoice.addEventListener('click', this.EVT.handleInvoiceReturnClick);
		this.DOM.invoice.confirmInvoice.addEventListener('click', this.EVT.handleInvoiceConfirmClick);
		this.DOM.invoice.moveToTrash.addEventListener('click', this.EVT.handleInvoiceTrashClick);
		this.DOM.invoice.recreate.addEventListener('click', this.EVT.handleInvoiceRecreate);
		this.DOM.invoice.unconfirm.addEventListener('click', this.EVT.handleInvoiceUnconfirm);
		this.DOM.invoice.makePayment.addEventListener('click', this.EVT.handleInvoiceMakePayment);
		this.DOM.invoice.withdrawSent.addEventListener('click', this.EVT.handleInvoiceWithdrawSent);

// modal
		this.DOM.modal.close.addEventListener('click', this.EVT.handleModalCloseClick);
		this.DOM.modal.cancel.addEventListener('click', this.EVT.handleModalCloseClick);
		this.DOM.modal.submit.addEventListener('click', this.EVT.handleModalSubmitClick);

//  modal_transaction
		this.DOM.modal_transaction.close.addEventListener('click', this.EVT.handleModalTransactionCloseClick);
		this.DOM.modal_transaction.cancel.addEventListener('click', this.EVT.handleModalTransactionCloseClick);

//  modal_receipt
		this.DOM.modal_receipt.close.addEventListener('click', this.EVT.handleModalReceiptCloseClick);
		this.DOM.modal_receipt.cancel.addEventListener('click', this.EVT.handleModalReceiptCloseClick);


// Await Payment
// [ make Payment Waiting ]
		this.DOM.invoice.makePaymentWaiting.addEventListener('click', this.EVT.handleMakePaymentWaitingClick);


// paid 
// [ View Taransaction Receipt ]
		this.DOM.viewReport.moveToArciveBuyer.addEventListener('click', this.EVT.handleViewReport.moveToArciveBuyerClick);

// [ View Taransaction Receipt ]
		this.DOM.viewReport.moveToArciveSeller.addEventListener('click', this.EVT.handleViewReport.moveToArciveSellerClick);

// complete
// [ View Taransaction Receipt ]
		this.DOM.viewReport.completeBuyer.addEventListener('click', this.EVT.handleViewReport.completeBuyerClick);

// [ View Taransaction Receipt ]
		this.DOM.viewReport.completeSeller.addEventListener('click', this.EVT.handleViewReport.completeSellerClick);

//

		this.DOM.invoice.sellerArchive.addEventListener('click', this.EVT.handleSupplyArchiveClick);
		this.DOM.invoice.buyerTrash.addEventListener('click', this.EVT.handleBuyerTrashClick);
		this.DOM.invoice.sellerTrash.addEventListener('click', this.EVT.handleSupplyTrashClick);


		this.DOM.modal.gasLimit_input.addEventListener('blur', this.EVT.handleGasLimitBlur);

		this.DOM.modal_transaction.ipfs_cid.addEventListener('click',this.EVT.handleIpfs.jsonDataClick);

		this.DOM.modal_receipt.ipfs_cid.addEventListener('click',this.EVT.handleIpfs.jsonDataByTransactionClick);

		this.SENDING_WRAP.hidden();
	}

	async function evt_handleIpfs_jsonDataByTransactionClick() {

		const transactionHash = this.MEM.getTransactionHash();

        const url = '/api/wallet/getIPFScidByTransactionHash';

        let response;
        try {
            response = await fetch( url+'?'+new URLSearchParams({
            	transactionHash : transactionHash
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
        }

		const ipfs_address = res.msg.ipfs_address;
		const hash = res.msg.ipfs_cid;

		const base = `${ipfs_address}/ipfs`;


		let newwin = window.open (`${base}/${hash}`);

	}

	function evt_handleIpfs_jsonDataClick() {

		const ipfs_address= this.MEM.getIpfsAddress();

		//const base = `${window.location.protocol}//${ipfs_hostname}:8080/ipfs`;
		const base = `${ipfs_address}/ipfs`;

		let id = 'ActionWidget.modal_transaction.input';
		let hash = document.getElementById(id).innerText;

		let newwin = window.open (`${base}/${hash}`);
	}

    function evt_handleGasLimitBlur(evt) {

        const elm = evt.target;
        let value = elm.value;

		if( value != "") {
			if(value.indexOf(",") !== -1) {
				value = value.replace(/,/g,'');
			}
		}

        if(value == null ) {
			console.log("value-"+value)	
            return;
        }

		value = value.replace(/[^0-9]/g, '');

		if( typeof(parseInt(value)) !== 'number') {
			
			alert("Please enter a number.");
			return;
		} 

		value = Number(value).toLocaleString();

		elm.value = value;

        //const opts = DocumentWidget.MEM.document.currency_options;
        //const c = currency(value, opts);
        //elm.value = c.format(true);

    }

	async function evt_handleUndelivered() {

		console.log('report not-delivered');
	
	}

	async function evt_handleCancelDelivery() {

		console.log('cancel delivery!!!');

	}

	function evt_handleBuyerWaitingClick() {

		this.DOM.modal_receipt.body.classList.add('open');

	}

// Await Payment : open
	function evt_handleMakePaymentWaitingClick() {

		console.log("Await Payment : handleMakePaymentWaitingClick")
		alert("Make Payment Waiting");

	}

// Confirmed : modal : close
	function evt_handleModalCloseClick() {
		//this.DOM.modal.sending.style.visibility = "hidden";
		
		this.SENDING.hidden();
	
		this.DOM.modal.body.classList.remove('open');

	}

// Paid : modal_transaction : close
	function evt_handleModalTransactionCloseClick() {
	
		console.log("Paid : handleModalTransactionCloseClick")
		this.DOM.modal_transaction.body.classList.remove('open');

	}

// Paid : modal_receipt : close
	function evt_handleModalReceiptCloseClick() {
	
		//console.log("Paid : handleModalReceiptCloseClick")
		this.DOM.modal_receipt.body.classList.remove('open');

	}

// Paid : View Transaction Report
	function evt_handleViewReport_MoveToArciveBuyerClick(){

		//console.log("Paid : handleViewReport_MoveToArciveBuyerClick");

		const role = "buyer"; 
		const archive = 0;

		this.API.transaction_receipt(role, archive) ; 
	}

	function evt_handleViewReport_MoveToArciveSellerClick(){

		//console.log("Paid : handleViewReport_MoveToArciveSellerClick");

		const role = "seller"; 
		const archive = 0;

		this.API.transaction_receipt(role, archive) ; 

		//this.DOM.modal_receipt.body.classList.add('open');

	}

// Complete : View Transaction Report
	function evt_handleViewReport_CompleteBuyerClick(){

		//console.log("Paid : handleViewReport_CompleteBuyer");

		const role = "buyer"; 
		const archive = 1;

		this.API.transaction_receipt(role, archive) ; 

		//this.DOM.modal_receipt.body.classList.add('open');

	}

	function evt_handleViewReport_CompleteSellerClick(){

		console.log("Paid : handleViewReport_CompleteSeller");

		const role = "seller"; 
		const archive = 1;

		this.API.transaction_receipt(role, archive) ; 

		//this.DOM.modal_receipt.body.classList.add('open');

	}


	async function evt_handleArchiveSupply() {

		console.log('archive seller delivery');

	}

	async function evt_handleArchiveBuyer() {

		console.log('archive archive delivery');

	}

/*
 * [ View transaction Receipt ]
 */
	async function api_transaction_receipt(role, archive) { 
		console.log("transaction_receipt:"+role +":"+ archive)

		const url = '/api/wallet/getTransactionReceipt';

        const doc = DocumentWidget.API.getDocument();

        let response;
        try {
            response = await fetch( url+'?'+new URLSearchParams({
          			document_uuid : doc.document_uuid,
					role : role,
					archive : archive
            }));

        } catch(err) {
			console.log("err="+err);
			alert("Cannot connect server.");
			return;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {
			return;
        }

		//console.log(res.msg.receipt);
		let i,id, elm;

		if( response.status != 200) {
			if(res.err != 0) {
				alert(res.msg);
				return;
			}
		}

		let receipt = res.msg.receipt;
		let hash	= res.msg.hash;

		if(receipt == null) {
			alert("Transaction Receipt not found.");
			return;
		}

		let base ='ActionWidget.modal_receipt.';
		let ids = [
			'transactionHash',
			'transactionIndex',
			'blockNumber',
			'blockHash',
			'from',
			'to',
			'cumulativeGasUsed',
			'gasUsed',
			'contractAddress',
			'type',
			'effectiveGasPrice'
		]

		for(i = 0; i < ids.length; i++) {
			id = ids[i];
			elm = document.getElementById(base + id);
			elm.innerText =  receipt[id];
		}

		id = 'transactionHash';
		this.MEM.setTransactionHash(receipt[id]);
		
		this.DOM.modal_receipt.body.classList.add('open');


	}


/*
 * [ Make Payment ] 
 */
	async function evt_handleInvoiceMakePayment() {


		const GAS_LIMIT = '210,000';
		//console.log("make payment!!");

		const url = '/api/wallet/getCurrentBalanceOfBuyer';

        const doc = DocumentWidget.API.getDocument();

        let response;
        try {
            response = await fetch( url+'?'+new URLSearchParams({
   				 document_uuid: doc.document_uuid
			}).toString());

        } catch(err) {
			return;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {
			return;
        }

		if(response.status != 200) {
			console.error('Server Error ');
			alert("Server Error "+res.msg)
			return;
		}


		let base = 'ActionWidget.modal.';	
		let i, id, elm;

		let msg = res.msg;

		let ids  = [
			'balanceGwei',
			'makePaymantTo',
			'transferCost',
			'gas',
		];

		for ( i=0; i<ids.length; i++) {
			id = ids[i];
			elm = document.getElementById(base + id)
			try {
			elm.innerText = msg[id];
			} catch (e) {
				console.log(i+":"+id)
			}
		}

		this.DOM.modal.gasLimit_input.value = GAS_LIMIT;

		this.SENDING.hidden();

		this.DOM.modal.body.classList.add('open');

//
// Check for insufficient balance
//
// If the balance is insufficient, 
// the Send Transaction button cannot be pressed.
//
		let balance = parseInt(msg[ids[0]].replace(/,/g,"").replace("Gwei",""));
		let amount = 0;

		for ( i=1; i<ids.length; i++) {
			id = ids[i];
			amount += parseInt(msg[id].replace(/,/g,"").replace("Gwei",""));
		}
		amount += parseInt(GAS_LIMIT.replace(/,/g,""));
		if(balance <= amount) {
			this.DOM.modal.submit.setAttribute("disabled", true);
			alert(`Insufficient balance : ${(balance - amount)} Gwei`);

		} else {
			if( this.DOM.modal.submit.hasAttribute("disabled")) {
				this.DOM.modal.submit.removeAttribute("disabled");
			}
		}

	}

	async function evt_handleOrderRequestCancel() {

		console.log('send cancel requst!!!');

	}

	function api_trayRefreshAndClearDocument() {

		setTimeout(function () {
			TrayWidget.API.refresh();
			DocumentWidget.API.clearDocument();
			TrayWidget.API.clearDocument();
		}, 500);

	}


	async function evt_handleCreateInvoice() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/createInvoice';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleConfirmDelivery() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/confirm';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleOrderCancel() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/cancel';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleOrderShip() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/ship';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleOrderPrepare() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/prepare';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleOrderDecline() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/decline';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleOrderWithdraw() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/withdraw';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

		if(response.status != 200) {
			alert("this.MESSAGE.sent\n"+res.err);
		}

	}

	async function evt_handleDeleteOrder() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/trash';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleSendOrder() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/send';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleQuoteRemove() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/quote/trash';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleQuoteRemake() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/quote/recreate';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleQuoteWithdraw() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/quote/withdraw';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleQuoteReturn() {

		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/quote/return';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();


	}

	async function evt_handleCreateOrder() {
		
		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
		};

		const url = '/api/order/create';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

	async function evt_handleQuoteDraftSend() {

		console.log('draft sent');
		
		let errors = DocumentWidget.API.checkInvoiceSendable();
		if(errors) {
			alert(errors);
			return;
		}


		const doc = DocumentWidget.API.getDocument();
		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
				method: 'POST',
				cache: 'no-cache',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(params)
		};

		const url = '/api/quote/send';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			throw err;
		}

		if( res.err != 0) {
			alert(res.msg);
			return;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

	}

/*
 * [ Move to Trash ]
 */
	async function evt_handleQuoteDraftDelete() {

		const button = this.DOM.invoice.removeDraft;
		this.BUTTON.disabled(button);

		this.SENDING_WRAP.visible();

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

		const opts = {
				method: 'POST',
				cache: 'no-cache',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(params)
		};

		const url = '/api/quote/deleteDraft';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
		}
		if(response.status != 200) {
			alert("[ Move to Trash ]\n"+res.err);

			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

		this.BUTTON.enabled(button);

		this.SENDING_WRAP.hidden();
	}


/*
 * [ Soft Delete ]
 */
	async function evt_handleSupplyTrashClick() {

		const button = this.DOM.invoice.sellerTrash;
		this.BUTTON.disabled(button);

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/softDeleteSeller';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }
		if(response.status != 200) {
			alert("[ Soft Delete ]\n"+res.err);
			this.BUTTON.enabled(button);

			return;
		}

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);

            return;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		this.BUTTON.enabled(button);
	}

/*
 * [ Soft Delete ]
 */
	async function evt_handleBuyerTrashClick() {

		const button = this.DOM.invoice.buyerTrash;
		this.BUTTON.disabled(button);

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/softDeleteBuyer';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			this.BUTTON.enabled(button);

			return;
        }
		if(response.status != 200) {
			alert("[ Soft Delete ]\n"+res.err);
			this.BUTTON.enabled(button);

			return;
		}

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);

			return;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		this.BUTTON.enabled(button);
	}

/*
* [ Move to Archive ]
*/
	async function evt_handleSupplyArchiveClick() {

		const button = this.DOM.invoice.sellerArchive;
		this.BUTTON.disabled(button);

		this.SENDING_WRAP.visible();

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/sellerArchive';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
        }
		if(response.status != 200) {
			alert("[ Move to Archive ]\n"+res.err);
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
		}

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		this.BUTTON.enabled(button);
		this.SENDING_WRAP.hidden();
	}

/*
 * [ Make Paymant ]
 */
    async function evt_handleModalSubmitClick() {
		this.SENDING.visible();

		await this.API.handleModalSubmit();
	}

	function _GwaiToNumber(gasLimit) {

			let g = gasLimit;

			//console.log("g="+g);

			if(g == null) {
				return g;
			}
			
			if(g.indexOf(" Gwei") != -1) {
				g = g.replace(" Gwei","");
			}
			if(g.indexOf(",") != -1) {
				g = g.replace(/,/g,"");
			}

			return g;
	}

/*
 * [ Send Transaction ]
 */
    async function api_handleModalSubmit() {


		const url = '/api/invoice/makePayment';

        const doc = DocumentWidget.API.getDocument();

		let gasLimit = _GwaiToNumber(this.DOM.modal.gasLimit_input.value);

		//console.log("gasLimit = "+gasLimit);

        const params = {
            document_uuid : doc.document_uuid,
			gasLimit : gasLimit
        };

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };


        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			return;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {
			return;
        }

		await this.DOM.modal.body.classList.remove('open');

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

		this.SENDING.visible();

		if(response.status != 200) {
			setTimeout(function() {
				alert("[ makePayment ]\nerr="+res.err+"\nmsg : "+res.msg);
			}, 100);
		} else {

			setTimeout(function(res) {
				let r = res.msg.transaction_result

				let base,i,id,elm;

					//'chainId',
					//'maxPriorityFeePerGas',
					//'maxFeePerGas',

				let ids = [
					'type',
					'hash',
					'input',
					'nonce',
					'blockNumber',
					'blockHash',
					'from',
					'to',
					'value',
					'gasPrice',
					'gas'
				]

				base = 'ActionWidget.modal_transaction.';
			
				for( i=0 ;i<ids.length;i++ ) {
					id = ids[i];
					elm = document.getElementById(base+id);

					if(id == 'input') {
						elm.title = r[id];
						elm.innerText = res.msg.ipfs_cid;
						continue;
					}

					elm.innerText = r[id];
				}

				this.MEM.setIpfsAddress(res.msg.ipfs_address);

				this.DOM.modal_transaction.body.classList.add('open');

			}.bind(this, res), 100);
		}

    }

/*
 * [ Withdraw ]
 */
	async function evt_handleInvoiceWithdrawSent() {

		const button = this.DOM.invoice.withdrawSent;
		this.BUTTON.disabled(button);

		this.SENDING_WRAP.visible();

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid,
			document_folder : "sent" 
		};

        const url = '/api/invoice/withdraw';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };


        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

            return;
        }

		if(response.status != 200) {
			alert("[ Withdraw ]\n"+res.err);

			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();
			return;
		}

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

            return;
        }

		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		this.BUTTON.enabled(button);
		this.SENDING_WRAP.hidden();

	}
	
/*
 * [ Move to Trash ] 
 * Reterned Tray
 */
	async function evt_handleInvoiceTrashClick() {

		const button = this.DOM.invoice.moveToTrash;
		this.BUTTON.disabled(button);

		this.SENDING_WRAP.visible();

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/trash';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }

		if(response.status != 200) {
			alert("[ Move to Trash ]\n"+res.err);

			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();
			return;
		}


        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
        }

		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		this.BUTTON.enabled(button);
		this.SENDING_WRAP.hidden();
	}

/*
 * [ Unconfirm ]
 */
	async function evt_handleInvoiceUnconfirm() {

		const button = this.DOM.invoice.unconfirm;
		this.BUTTON.disabled(button);

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/unconfirm';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			this.BUTTON.enabled(button);

			return;
        }

		if(response.status != 200) {
			alert("[ Unconfirm ]\n"+res.err);
			this.BUTTON.enabled(button);

			return;
		}

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);

			return;
        }

		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		this.BUTTON.enabled(button);

	}

/*
 * [ Move to Draft ]
 */
	async function evt_handleInvoiceRecreate() {

		const button = this.DOM.invoice.recreate;
		this.BUTTON.disabled(button);

		this.SENDING_WRAP.visible();

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/recreate';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
        }

		if(response.status != 200) {
			alert("[ Move to Draft ]\n"+res.err);
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
		}

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

            return;
        }

		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		this.BUTTON.enabled(button);
		this.SENDING_WRAP.hidden();

	}

/*
 * [ Confirm Invoice ]
 */
	async function evt_handleInvoiceConfirmClick() {

		const button = this.DOM.invoice.confirmInvoice;
		this.BUTTON.disabled(button);

		this.SENDING_WRAP.visible();

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/confirm';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };


        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
        }

		if(response.status != 200) {
			alert("[ Confirm Invoice ]\n"+res.err);

			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

			return;
		}

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
			this.SENDING_WRAP.hidden();

            return;
        }

		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		this.BUTTON.enabled(button);
		this.SENDING_WRAP.hidden();
	}

/*
 * [ Return to Sender ]
 */
	async function evt_handleInvoiceReturnClick() {

		const button = this.DOM.invoice.returnInvoice;
		this.BUTTON.disabled(button);

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/returnToSender';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
			this.BUTTON.enabled(button);

			return;
        }

		if(response.status != 200) {
			alert("[ Return to Sender ]\n"+res.err);
			this.BUTTON.enabled(button);

			return;
		}

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);

			return;
        }

		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();


		this.BUTTON.enabled(button);
	}



/*
 * [ Send Invoice ]
*/
	function evt_handleInvoiceDraftSend() {

		const button = this.DOM.invoice.sendInvoice;
		this.BUTTON.disabled(button);

		//console.log("send draft");

		let errors = DocumentWidget.API.checkInvoiceSendable();
		if(errors) {
			alert(errors);
			return;
		}

		this.DOM.invoice.sendInvoiceDisabled();

		DocumentWidget.API.updateDocument();

		const message="Subject has not been entered. Do you want to send it?";

		const subject =  DocumentWidget.DOM.inputs.getSubject();

		if ( subject == "" || subject == null) {
			if( confirm(message) == false) {
				this.BUTTON.enabled(button);

				return;
			}
		}

		if( this.MEM.getSaveTimeout() != null) {
			console.log("saveTimeout");
			this.BUTTON.enabled(button);

			return;
		}

		this.API.submit.readonly();

		this.SENDING_WRAP.visible();


		if( ContactWidget.API.checkSaveTimeout() &&
			DocumentWidget.API.checkSaveTimeout() ) {

			this.NETWORK.invoiceDraftSend();

			this.BUTTON.enabled(button);

		} else {
	
			let timeout =  setTimeout( () => {

					this.NETWORK.invoiceDraftSend();

					this.BUTTON.enabled(button);

			}, this.MEM.getTimeout());

			this.MEM.setSaveTimeout( timeout );

		}

	}
		
/*
 *  [ Send Invoice ]
 */
    async function network_invoiceDraftSend() {

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

		const url = '/api/invoice/sendInvoice';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {

			this.SENDING_WRAP.hidden();
			return;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {

			this.SENDING_WRAP.hidden();
			return;
        }

		this.MEM.initSaveTimeout();

		if(response.status != 200) {

			alert("[ Send Invoice ]\n"
					+`ErrorNo:${res.err}\n`
					+`${res.msg}`);


			this.API.submit.reset();
			this.SENDING_WRAP.hidden();
			return;
		}



		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

		this.API.submit.reset();

		this.SENDING_WRAP.hidden();

	}
	
/*
 * [ Move to Trash ]
 * Draft Tray
 */
	function evt_handleInvoiceDraftDelete() {

		const button = this.DOM.invoice.removeDraft;
		this.BUTTON.disabled(button);

		//console.log("send draft");

		this.DOM.invoice.sendInvoiceDisabled();


		if( this.MEM.getSaveTimeout() != null) {
			console.log("saveTimeout");
			this.BUTTON.enabled(button);

			return;
		}

		this.API.submit.readonly();

		this.SENDING_WRAP.visible();


			let timeout =  setTimeout( () => {

					this.NETWORK.invoiceDraftDelete();

					this.BUTTON.enabled(button);
					this.DOM.invoice.sendInvoiceEnabled();

					this.MEM.initSaveTimeout();
					this.API.submit.reset();

			}, this.MEM.getTimeout());

			this.MEM.setSaveTimeout( timeout );

	}

/*
 * [ Move to Trash ]
 * Draft Tray
 */
    async function network_invoiceDraftDelete() {
		
		const params = {
			document_uuid : this.MEM.getDocument_uuid()
		};

		const url = '/api/invoice/trashDraft';

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {

			this.SENDING_WRAP.hidden();
			return;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {

			this.SENDING_WRAP.hidden();
			return;
        }
		if(response.status != 200) {

			alert("[ Return to Sender ]\n"+res.err);

			this.SENDING_WRAP.hidden();
			return;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

		this.SENDING_WRAP.hidden();
	}

	function api_openPanel(doc) {

		const params = TrayWidget.API.getParams();

		this.MEM.setDocument_uuid( doc.document_uuid );

		const id = [
			params.role, 
			params.type, 
			params.folder,
			params.archive
		].join(".");

		//console.log("looking for id: %s", id);
		const panel = document.getElementById(id);
		
		if(this.MEM.getPanel()) {
			this.MEM.getPanel().classList.remove("open");
		}

		if(!panel) {
			this.MEM.initPanel();
			return;
		}

		panel.classList.add("open");
		this.MEM.setPanel( panel );

	}

	function api_closePanel() {

		const panel = this.MEM.getPanel();
		if(panel) {
			panel.classList.remove("open");
			this.MEM.initPanel();
		}

	}

	function api_submitReadonly() {

		this.DOM.invoice.sendInvoice.style.disabled = true;
		this.DOM.invoice.moveToTrash.style.disabled = true;
		this.DOM.invoice.sendInvoice.classList.add("nonactive");
		this.DOM.invoice.moveToTrash.classList.add("nonactive");

	}

	function api_submitReset() {

		this.DOM.invoice.sendInvoice.style.disabled = false;
		this.DOM.invoice.moveToTrash.style.disabled = false;
		this.DOM.invoice.sendInvoice.classList.remove("nonactive");
		this.DOM.invoice.moveToTrash.classList.remove("nonactive");

	}

}).apply({});
