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
        timeout: 2000,
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

	}

	this.DOM = {
		modal : {
			body : document.getElementById('ActionWidget.modal.body'),
			close : document.getElementById('ActionWidget.modal.close'),
			cancel : document.getElementById('ActionWidget.modal.cancel'),
			submit : document.getElementById('ActionWidget.modal.submit')
		},
		invoice : {
			removeDraft :  document.getElementById('ActionWidget.invoice.removeDraft'),
			sendInvoice : document.getElementById('ActionWidget.invoice.sendInvoice'),
			returnInvoice : document.getElementById('ActionWidget.invoice.returnToSender'),
			confirmInvoice : document.getElementById('ActionWidget.invoice.confirmInvoice'),
			moveToTrash : document.getElementById('ActionWidget.invoice.moveToTrash'),
			recreate : document.getElementById('ActionWidget.invoice.recreate'),
			unconfirm : document.getElementById('ActionWidget.invoice.unconfirm'),
			makePayment : document.getElementById('ActionWidget.invoice.makePayment'),
			withdrawSent : document.getElementById('ActionWidget.invoice.withdrawSent'),
			clientWaiting : document.getElementById('ActionWidget.invoice.clientWaiting'),
			makePaymentWaiting : document.getElementById('ActionWidget.invoice.makePaymentWaiting'),
			supplierArchive : document.getElementById('ActionWidget.invoice.supplierArchive'),
			clientTrash : document.getElementById('ActionWidget.invoice.clientTrash'),
			supplierTrash : document.getElementById('ActionWidget.invoice.supplierTrash'),
			sendInvoiceDisabled : () => {
				this.DOM.invoice.sendInvoice.setAttribute("disabled", "disabled")
				this.DOM.invoice.sendInvoice.disabled = true;
			},
			sendInvoiceEnabled : () => {
				this.DOM.invoice.sendInvoice.removeAttribute("disabled")
				this.DOM.invoice.sendInvoice.disabled = false;
			},

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
		handleModalCloseClick : evt_handleModalCloseClick.bind(this),
		handleModalSubmitClick : evt_handleModalSubmitClick.bind(this),
		handleClientWaitingClick : evt_handleClientWaitingClick.bind(this),
		handleMakePaymentWaitingClick : evt_handleMakePaymentWaitingClick.bind(this),
		handleSupplyArchiveClick : evt_handleSupplyArchiveClick.bind(this),
		handleClientTrashClick : evt_handleClientTrashClick.bind(this),
		handleSupplyTrashClick : evt_handleSupplyTrashClick.bind(this)
	}

	this.API = {
		openPanel : api_openPanel.bind(this),
		closePanel : api_closePanel.bind(this),
		submit : {
			readonly : api_submitReadonly.bind(this),
			reset: api_submitReset.bind(this),
		},
		trayRefreshAndClearDocument : api_trayRefreshAndClearDocument.bind(this),
	}

	this.NETWORK = {
		invoiceDraftSend : network_invoiceDraftSend.bind(this),
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
		this.DOM.modal.close.addEventListener('click', this.EVT.handleModalCloseClick);
		this.DOM.modal.cancel.addEventListener('click', this.EVT.handleModalCloseClick);
		this.DOM.modal.submit.addEventListener('click', this.EVT.handleModalSubmitClick);
		this.DOM.invoice.clientWaiting.addEventListener('click', this.EVT.handleClientWaitingClick);
		this.DOM.invoice.makePaymentWaiting.addEventListener('click', this.EVT.handleMakePaymentWaitingClick);

		this.DOM.invoice.supplierArchive.addEventListener('click', this.EVT.handleSupplyArchiveClick);
		this.DOM.invoice.clientTrash.addEventListener('click', this.EVT.handleClientTrashClick);
		this.DOM.invoice.supplierTrash.addEventListener('click', this.EVT.handleSupplyTrashClick);

	}

	async function evt_handleUndelivered() {

		console.log('report not-delivered');
	
	}

	async function evt_handleCancelDelivery() {

		console.log('cancel delivery!!!');

	}

	function evt_handleClientWaitingClick() {
		alert(" Waiting for Confirmation ");
	}

	function evt_handleMakePaymentWaitingClick() {
		alert(" Waiting for Make Payment");
	}

	function evt_handleModalCloseClick() {
	
		this.DOM.modal.body.classList.remove('open');

	}

	async function evt_handleArchiveSupply() {

		console.log('archive supplier delivery');

	}

	async function evt_handleArchiveClient() {

		console.log('archive archive delivery');

	}

	function evt_handleInvoiceMakePayment() {

		console.log("make payment!!");
		this.DOM.modal.body.classList.add('open');

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

		const urll = '/api/quote/withdraw';

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
			throw err;
		}

		let res;
		try {
			res = await response.json();
		} catch(err) {
			this.BUTTON.enabled(button);
			throw err;
		}

		FolderWidget.API.getCount();
		TrayWidget.API.refresh();
		DocumentWidget.API.clearDocument();
		TrayWidget.API.clearDocument();

		this.BUTTON.enabled(button);
	}


/*
* [ Soft Delete ]
*/
	async function evt_handleSupplyTrashClick() {

		const button = this.DOM.invoice.supplierTrash;
		this.BUTTON.disabled(button);

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/softDeleteSupplier';

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

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		if(response.status != 200) {
			alert("this.MESSAGE.sent\n"+res.err);
		}
		this.BUTTON.enabled(button);
	}

/*
* [ Soft Delete ]
*/
	async function evt_handleClientTrashClick() {

		const button = this.DOM.invoice.clientTrash;
		this.BUTTON.disabled(button);

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/softDeleteClient';

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

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		if(response.status != 200) {
			alert("this.MESSAGE.sent\n"+res.err);
		}
		this.BUTTON.enabled(button);
	}

/*
* [ Move to Archive ]
*/
	async function evt_handleSupplyArchiveClick() {

		const button = this.DOM.invoice.supplierArchive;
		this.BUTTON.disabled(button);

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        const url = '/api/invoice/supplierArchive';

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

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		if(response.status != 200) {
			alert("this.MESSAGE.sent\n"+res.err);
		}
		this.BUTTON.enabled(button);
	}

/*
* [ Make Paymant ]
*/
    function evt_handleModalSubmitClick() {

		const button = this.DOM.invoice.makePayment;
		this.BUTTON.disabled(button);

		const url = '/api/invoice/makePayment';

        const doc = DocumentWidget.API.getDocument();

        const params = {
            document_uuid : doc.document_uuid
        };

        const ajax = new XMLHttpRequest();
        ajax.open('POST', url);
        ajax.setRequestHeader('Content-Type', 'application/json');
        ajax.responseType = "json";
        ajax.send(JSON.stringify(params));

        ajax.onload = () => {

			let res = ajax.response;

            FolderWidget.API.getCount();
            TrayWidget.API.refresh();
            DocumentWidget.API.clearDocument();
            this.DOM.modal.body.classList.remove('open');
            TrayWidget.API.clearDocument();

			if(ajax.status != 200) {
				setTimeout(function() {
					alert("this.MESSAGE.sent\n"+res.err);
				}, 10);
			}
			this.BUTTON.enabled(button);

        }

    }

/*
* [ Withdraw ]
*/
	async function evt_handleInvoiceWithdrawSent() {

		const button = this.DOM.invoice.withdrawSent;
		this.BUTTON.disabled(button);

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

            throw err;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);

            throw err;
        }

		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		if(response.status != 200) {
			alert("this.Message.sent\n"+res.err);
		}
		this.BUTTON.enabled(button);

	}
	
/*
* [ Move to Trash ] 
*/
	async function evt_handleInvoiceTrashClick() {

		const button = this.DOM.invoice.moveToTrash;
		this.BUTTON.disabled(button);

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        let url = '/api/invoice/trash';

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

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		if(response.status != 200) {
			alert("this.MESSAGE.sent\n"+res.err);
		}
		this.BUTTON.enabled(button);
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
            throw err;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		if(response.status != 200) {
			alert("this.MESSAGE.sent\n"+res.err);
		}
		this.BUTTON.enabled(button);

	}

/*
* [ Move to Draft ]
*/
	async function evt_handleInvoiceRecreate() {

		const button = this.DOM.invoice.recreate;
		this.BUTTON.disabled(button);

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

        let url = '/api/invoice/recreate';

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

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }

		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		if(response.status != 200) {
			alert("this.MESSAGE.sent\n"+res.err);
		}
		this.BUTTON.enabled(button);

	}

/*
* [ Confirm Invoice ]
*/
	async function evt_handleInvoiceConfirmClick() {

		const button = this.DOM.invoice.confirmInvoice;
		this.BUTTON.disabled(button);

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
            throw err;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		if(response.status != 200) {
			alert("this.MESSAGE.sent\n"+res.err);
		}
		this.BUTTON.enabled(button);
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

        const url = '/api/invoice/return';

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

        let res;
        try {
            res = await response.json();
        } catch(err) {
			this.BUTTON.enabled(button);
            throw err;
        }
		await FolderWidget.API.getCount();
		this.API.trayRefreshAndClearDocument();

		if(response.status != 200) {
			alert("this.MESSAGE.sent\n"+res.err);
		}
		this.BUTTON.enabled(button);
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

/*
		console.log("Contact="+ ContactWidget.API.checkSaveTimeout() +":"+
			"Document="+DocumentWidget.API.checkSaveTimeout() ) ;
*/


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
		
	function network_invoiceDraftSend() {

		const doc = DocumentWidget.API.getDocument();

		const params = {
			document_uuid : doc.document_uuid
		};

		const ajax = new XMLHttpRequest();
		ajax.open('POST', '/api/invoice/send');
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(params));

		ajax.onload = () => {

			let res = ajax.response;

			this.MEM.initSaveTimeout();


			FolderWidget.API.getCount();
			TrayWidget.API.refresh();
			DocumentWidget.API.clearDocument();
			TrayWidget.API.clearDocument();

			this.API.submit.reset();

			if(ajax.status != 200) {
				alert("this.MESSAGE.sent\n"+res.err);
			}
		}

	}
	
	function evt_handleInvoiceDraftDelete() {
		
		const params = {
			document_uuid : this.MEM.getDocument_uuid()
		};

		const ajax = new XMLHttpRequest();
		ajax.open('POST', '/api/invoice/trashDraft');
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(params));

		ajax.onload = () => {

			console.log(ajax.response);

			FolderWidget.API.updateInvoiceDraftCount();
			TrayWidget.API.refresh();
			DocumentWidget.API.clearDocument();
			TrayWidget.API.clearDocument();

		}

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

}).apply({});
