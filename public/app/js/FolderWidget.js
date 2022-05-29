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

const FolderWidget = (function() {

	this.MEM = {
		timeout: 2000,
		getTimeout : () => this.MEM.timeout,

		saveTimeout : null,
        getSaveTimeout : () => this.MEM.saveTimeout,
        setSaveTimeout : (timeout) => this.MEM.saveTimeout = timeout,
        initSaveTimeout : () => this.MEM.saveTimeout = null,

		activeFolder : null,
        setActiveFolder : (activeFolder) => this.MEM.activeFolder = activeFolder,
        getActiveFolder : () => this.MEM.activeFolder,

		leaf : null,
        setLeaf : (leaf) => this.MEM.leaf = leaf,
        getLeaf : () => this.MEM.leaf,

	}

	this.DOM = {
		create : {
			invoice : document.getElementById('FolderWidget.create.invoice'),
			display : () => this.DOM.create.invoice.display = "",
			nondisplay : () => this.DOM.create.invoice.display = "none",
		},
		groups : {
			invoice_out : document.getElementById('FolderWidget.groups.invoice_out'),
			invoice_in : document.getElementById('FolderWidget.groups.invoice_in'),
			draft : document.getElementById('FolderWidget.groups.draft'),
		},
		c : {
			draft : document.getElementById('FolderWidget.c.draft'),
			sent : document.getElementById('FolderWidget.c.sent'),
			returned : document.getElementById('FolderWidget.c.returned'),
			confirmed : document.getElementById('FolderWidget.c.confirmed'),
			paid : document.getElementById('FolderWidget.c.paid'),
			complete : document.getElementById('FolderWidget.c.complete')
		},
		d : {
			sent : document.getElementById('FolderWidget.d.sent'),
			returned : document.getElementById('FolderWidget.d.returned'),
			confirmed : document.getElementById('FolderWidget.d.confirmed'),
			paid : document.getElementById('FolderWidget.d.paid'),
			complete : document.getElementById('FolderWidget.d.complete')
		}
	}

	this.EVT = {
		handleToggleClick : evt_handleToggleClick.bind(this),
		handleInvoiceCreate : evt_handleInvoiceCreate.bind(this),
		handleGroupClick : evt_handleGroupClick.bind(this),
		handleQuoteCreate : evt_handleQuoteCreate.bind(this)
	}

	this.API = {
		init : api_init.bind(this),
		openTab : api_openTab.bind(this),
		getCount : api_getCount.bind(this),
		updateInvoiceDraftCount : api_updateInvoiceDraftCount.bind(this),

		getCFolderCount : api_getCFolderCount.bind(this),
		getDFolderCount : api_getDFolderCount.bind(this),
		getDraftsFolderCount : api_getDraftsFolderCount.bind(this),
		getFolderTotal : api_getFolderTotal.bind(this),

		getActiveFolderType : api_getActiveFolderType.bind(this),
		getActiveFolderFolder: api_getActiveFolderFolder.bind(this),
		getActiveFolderRole : api_getActiveFolderRole.bind(this),
		getActiveFolderArchive : api_getActiveFolderArchive.bind(this),

		getCountOfActiveFolder: api_getCountOfActiveFolder.bind(this),

		renderFolderTotal : api_renderFolderTotal.bind(this),

		getInvoiceCount : api_getInvoiceCount.bind(this),
		getInvoiceArchiveCount : api_getInvoiceArchiveCount.bind(this),
		getCountOfCurrentFolder : api_getCountOfCurrentFolder.bind(this),
	}

	this.SIMULATE = {
		clickDraftsOfTray : simulate_clickDraftsOfTray.bind(this)
	}

	this.SERVER = {
		invoiceCreate : server_invoiceCreate.bind(this)
	}

	init.apply(this);

	return this;

	function api_getCountOfCurrentFolder(folder, role, archive) {

		//console.log("1 folder="+folder+":role="+role);

		switch (role) {
		case 'seller':
			
			switch (folder) {
			case 'draft':
				return this.DOM.c.draft.innerText;
			break;
			case 'sent':
				return this.DOM.c.sent.innerText;
			break;
			case 'confirmed':
				return this.DOM.c.confirmed.innerText;
			case 'returned':
				return this.DOM.c.returned.innerText;
			break;
			case 'paid':
				if(archive == 1) {
					return null;
				}
				return this.DOM.c.paid.innerText;
			break;
			default:
				return null;
			break;
			}
		break;
		case 'buyer':
			switch (folder) {
			case 'draft':
				return this.DOM.d.draft.innerText;
			break;
			case 'sent':
				return this.DOM.d.sent.innerText;
			break;
			case 'returned':
				return this.DOM.d.returned.innerText;
			break;
			case 'paid':
				if(archive == 1) {
					return null;
				}
				return this.DOM.d.paid.innerText;
			break;
			default:
				return null;
			break;
			}
		break;
		}

		return null;
		
	}

	function api_getCountOfActiveFolder() {
		let folder = this.API.getActiveFolderFolder();
		let role = this.API.getActiveFolderRole();
		let archive = this.API.getActiveFolderArchive();

		//console.log("2 folder="+folder+":role="+role);

		switch (role) {
		case 'seller':
			
			switch (folder) {
			case 'draft':
				return this.DOM.c.draft.innerText;
			break;
			case 'sent':
				return this.DOM.c.sent.innerText;
			break;
			case 'confirmed':
				return this.DOM.c.confirmed.innerText;
			case 'returned':
				return this.DOM.c.returned.innerText;
			break;
			case 'paid':
				if(archive == 1) {
					return null;
				}
				return this.DOM.c.paid.innerText;
			break;
			default:
				return null;
			break;
			}
		break;
		case 'buyer':
			switch (folder) {
			case 'draft':
				return this.DOM.d.draft.innerText;
			case 'sent':
				return this.DOM.d.sent.innerText;
			case 'confirmed':
				return this.DOM.d.confirmed.innerText;
			case 'returned':
				return this.DOM.d.returned.innerText;
			case 'paid':
				if(archive == 1) {
					return null;
				}
				return this.DOM.d.paid.innerText;
			default:
				return null;
			break;
			}
		break;
		}

		return null;
		
	}

	function init() {

		// Only init Events
		
		this.DOM.create.invoice.addEventListener('click', this.EVT.handleInvoiceCreate);

		for(let key in this.DOM.toggle) {
			this.DOM.toggle[key].addEventListener('click', this.EVT.handleToggleClick);
		}

		for(let key in this.DOM.groups) {
			this.DOM.groups[key].addEventListener('click', this.EVT.handleGroupClick);
		}


	}

	function evt_handleQuoteCreate() {
		
		//console.log("quote create click!!!");

		let ajax = new XMLHttpRequest();
		ajax.open('POST', '/api/quote/create');
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send();

		ajax.onload = () => {
			
			let res = ajax.response;
			ajax = null;

			if(res.err) {
				throw res.msg;
			}

			//console.log(res);

        	}

	}

	function api_getAFolderCount(evt) {

		const params = [
			{ type : "quote", role : "seller", folder : "draft", archive : 0 },
			{ type : "quote", role : "seller", folder : "sent", archive : 0 },
			{ type : "quote", role : "seller", folder : "returned", archive : 0 },
			{ type : "order", role : "seller", folder : "sent", archive : 0 },
			{ type : "order", role : "seller", folder : "prep", archive : 0 },
			{ type : "proof", role : "seller", folder : "sent", archive : 0 },
			{ type : "proof", role : "seller", folder : "confirmed", archive : 0 }
		];

		const url = '/api/tray/getCount';

		let ajax = new XMLHttpRequest();
		ajax.open('POST', url);
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(params));

		ajax.onload = () => {

			let res = ajax.response;

			if(res.err) {
				throw res.msg;
			}

			let a = this.DOM.a;

			a.draft.textContent = res.msg[0];
			a.sent.textContent = res.msg[1];
			a.returned.textContent = res.msg[2];
			a.orders.textContent = res.msg[3];
			a.prep.textContent = res.msg[4];
			a.shipped.textContent = res.msg[5];
			a.delivered.textContent = res.msg[6];


		}

	}

	async function api_getBFolderCount(evt) {

		const params = [
			{ type : "quote", role : "buyer", folder : "sent", archive : 0 },
			{ type : "quote", role : "buyer", folder : "returned", archive : 0 },
			{ type : "order", role : "buyer", folder : "draft", archive : 0 },
			{ type : "order", role : "buyer", folder : "sent", archive : 0 },
			{ type : "order", role : "buyer", folder : "prep", archive : 0 },
			{ type : "proof", role : "buyer", folder : "sent", archive : 0 },
			{ type : "proof", role : "buyer", folder : "confirmed", archive : 0 }
		];

		const url = '/api/tray/getCount';

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
            throw err;
        }

		let res = await response.json();
		if(res.err) {
			throw res.msg;
		}

		let b = this.DOM.b;

		b.sent.textContent = res.msg[0];
		b.returned.textContent = res.msg[1];
		b.draft.textContent = res.msg[2];
		b.orders.textContent = res.msg[3];
		b.prep.textContent = res.msg[4];
		b.shipped.textContent = res.msg[5];
		b.delivered.textContent = res.msg[6];

	}

/*
*/
	async function api_getCFolderCount() {

		const params = [
			{ type : "invoice", role : "seller", folder : "sent", archive : 0 },
			{ type : "invoice", role : "seller", folder : "returned", archive : 0 },
			{ type : "invoice", role : "seller", folder : "confirmed", archive : 0 },
			{ type : "invoice", role : "seller", folder : "paid", archive : 0 }
		];

		let url = '/api/tray/getCountSeller';

	    let response;
        let opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

		try {
            response = await fetch( url, opts);
        } catch(err) {
			console.log("err="+err);
			alert("Cannot connect server.");
			return;
        }

		if(response == 'ERR_CONNECTION_REFUSED') {
			alert("Cannot connect server.");
			return;
		}
		

        let res;
        try {
            res = await response.json();
        } catch(err) {
            throw err;
        }
	
		let counts = res.msg;
		let c = this.DOM.c;

		c.sent.textContent = counts[0];
		c.returned.textContent = counts[1];
		c.confirmed.textContent = counts[2];
		c.paid.textContent = counts[3];

		//console.log("CFolderCount")
	}

/*
*/
	async function api_getDraftsFolderCount() {

		const params = [
			{ type : "invoice", role : "seller", folder : "draft", archive : 0 },
		];

		let url = '/api/trayDrafts/getCountSeller';

        let opts = {
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
			alert("Cannot connect server.");
			return;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {
			alert("Json Error.");
			return;
        }
	
		let counts = res.msg;
		let c = this.DOM.c;

		c.draft.textContent = counts[0];

		DocumentWidget.API.readOnly ();

		//console.log("DraftFolderCount role")
	}


/*
*/
async function api_getDFolderCount() {

		const params = [
			{ type : "invoice", role : "buyer", folder : "sent", archive : 0 },
			{ type : "invoice", role : "buyer", folder : "returned", archive : 0 },
			{ type : "invoice", role : "buyer", folder : "confirmed", archive : 0 },
			{ type : "invoice", role : "buyer", folder : "paid", archive : 0 }
		];

		let url = '/api/tray/getCountBuyer';

        let opts = {
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
            //throw err;
			alert("Cannot connect server.");
			return;
        }
		if(response == 'ERR_CONNECTION_REFUSED') {
			alert("Cannot connect server.");
			return;
		}

        let res;
        try {
            res = await response.json();
        } catch(err) {
            throw err;
        }
	
		let counts = res.msg;
		let d = this.DOM.d;

		d.sent.textContent = counts[0];
		d.returned.textContent = counts[1];
		d.confirmed.textContent = counts[2];
		d.paid.textContent = counts[3];

		//console.log("DFolderCount ")
	}


	function api_updateInvoiceDraftCount() {

		//console.log("updateInvoiceDraftCount");
		
		const args = [
			{
				archive : 0,
				folder : 'draft',
				role : 'seller',
				type : 'invoice'
			}
		]

		let PATH = '/api/trayDrafts/getCountSeller';

		const ajax = new XMLHttpRequest();
		ajax.open('POST', PATH );
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(args));

		//console.log("Update draft count");

		ajax.onload = () => {
			
			let res = ajax.response;
			//console.log(res);

			let count = res.msg[0];
			this.DOM.c.draft.textContent = count;

			//console.log("updateInvoiceDraftCount count="+count);

			this.SIMULATE.clickDraftsOfTray();
		}

	}


async function api_getInvoiceCount(count, role, folder , archive, exec) {

		console.log("getInvoiceCount");

		const PATH = '/api/tray/getCount';

        let ROLE;

        switch(role) {
        case 'seller':
            ROLE = 'Seller';
        break;
        case 'buyer':
            ROLE = 'Buyer';
        break;
        default:
            return;
        }

		const params = [
			{
				archive : archive,
				folder : folder,
				role : role,
				type : 'invoice'
			}
		]

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

		const url =   PATH + ROLE;

		let response;
        try {
            response = await fetch(url, opts);
        } catch(err) {
            throw err;
        }

		if(response == 'ERR_CONNECTION_REFUSED') {
            alert("Cannot connect server.");
            return;
        }
		
        let res;
        try {
            res = await response.json();
        } catch(err) {
            throw err;
        }

		let max = res.msg[0];

		await TrayWidget.SHOWING.setAll( max );

		await exec(parseInt(count));

	}

async function api_getInvoiceArchiveCount(count, role, folder , archive, exec) {

		//console.log("getInvoiceArchiveCount");

		const PATH = '/api/trayArchive/getCount';
        let ROLE;

        switch(role) {
        case 'seller':
            ROLE = 'Seller';
        break;
        case 'buyer':
            ROLE = 'Buyer';
        break;
        default:
            return;
        }

		const params = [
			{
				archive : archive,
				folder : folder,
				role : role,
				type : 'invoice'
			}
		]

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

		const url = PATH +ROLE;

        let response;
        try {
            response = await fetch(url, opts);
        } catch(err) {
            throw err;
        }

		if(response == 'ERR_CONNECTION_REFUSED') {
            alert("Cannot connect server.");
            return;
        }
		

        let res;
        try {
            res = await response.json();
        } catch(err) {
            throw err;
        }

		let max = res.msg[0];

		try {
			await TrayWidget.SHOWING.setAll( max );
		} catch (e) {
			console.log(" err");
		}

		try {
			await exec(parseInt(count));
		} catch (e) {
			console.log("count err");
		}

	}

/*
* add 20220407 k.ogawa
*/
	async function api_getFolderTotal() {
		let type =  this.API.getActiveFolderType();
		let folder =  this.API.getActiveFolderFolder();
		let role =  this.API.getActiveFolderRole();
		let archive =  this.API.getActiveFolderArchive();

		//console.log("getFolderTotal:"+role +":"+folder+":"+archive);

		if(archive == 1) {
			TrayWidget.API.displayShowingTotal( null );
			return;
		}


		if(folder == "trash") {
			TrayWidget.API.displayShowingTotal( null );
			return;
		}

		if(folder == null) {
			return;
		}
		if(role == null) {
			return;
		}

		let params = 
			{ type : type, role : role, folder : folder, archive : archive }


		let PATH;
		let ROLE;

		switch(role) {
        case 'seller':
            ROLE = 'Seller';
        break;
        case 'buyer':
            ROLE = 'Buyer';
        break;
        default:
            return;
        }
	

		switch(folder) {
		case 'draft':
			PATH =  '/api/trayDrafts/getTotal'+ROLE
		break;
		case 'paid':
			if(archive == 1) {
				PATH =  '/api/trayArchive/getTotal'+ROLE
			} else {
				PATH =  '/api/tray/getTotal'+ROLE
			}
		break;
		case 'trash':
				PATH =  '/api/trayArchive/getTotal'+ROLE
		break;
		default:
			PATH =  '/api/tray/getTotal'+ROLE
		break;
		}
		

        const opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

		const url = PATH;

		let response;
        try {
            response = await fetch( url, opts);
        } catch(err) {
            throw err;
        }

		if(response == 'ERR_CONNECTION_REFUSED') {
            alert("Cannot connect server.");
            return;
        }
		

        let res;
        try {
            res = await response.json();
        } catch(err) {
            throw err;
        }
		if(res.err) {
			switch(res.err) {
			case 11:
				TrayWidget.API.displayShowingTotal( null );
			break;
			}
			return;
		}

		this.API.renderFolderTotal(res.msg);
	}

/*
* add 20220407 k.ogawa
*/
	function api_renderFolderTotal(msg) {

			let total = msg.total;

			// total = total.toLocaleString('en-US', {style:'currency', currency: 'USD'});
			total = total

			TrayWidget.API.displayShowingTotal( total );
			
	}
/*
 * add 20220405 k.ogawa
 * When you create a new Document, Simulate clicking on Draft Try.
*/
	function simulate_clickDraftsOfTray() {

		let old_folder = this.MEM.getActiveFolder();
		if( old_folder != null) {
			old_folder.classList.remove("active");
		}

		let new_folder = this.DOM.groups.draft;
		this.MEM.setActiveFolder(new_folder);
		new_folder.classList.add("active");

		let role	= "seller";
		let type	= "invoice";
		let folder	= "draft";
		let archive	= 0;

		TrayWidget.API.openFolderForNewDocument(role, type, folder, archive);

	}

/*
 * add 20220406 k.ogawa
 * Get folder type.
*/
	function api_getActiveFolderType() {

		const folder = this.MEM.getActiveFolder();
		if( folder == null) {
			return null;
		}

		return folder.getAttribute("data-type");

	}

	function api_getActiveFolderFolder() {

		const folder = this.MEM.getActiveFolder();
		if( folder == null) {
			return null;
		}

		return folder.getAttribute("data-folder");

	}

	function api_getActiveFolderArchive() {

		const folder = this.MEM.getActiveFolder();
		if( folder == null) {
			return null;
		}

		return folder.getAttribute("data-archive");

	}

	function api_getActiveFolderRole() {

		const folder = this.MEM.getActiveFolder();
		if( folder == null) {
			return null;
		}

		return folder.getAttribute("data-role");

	}

async function evt_handleGroupClick(evt) {

		DocumentWidget.API.clearDocument();

		TrayWidget.API.nonselectTray();

		await this.API.getCount("handleGroupClick");

		let elem = evt.target;
		while(elem.parentNode && elem.tagName !== "LI") {
			if(elem.tagName === "UL") {
				return;
			}
			elem = elem.parentNode;
		}

		
		const role = elem.getAttribute("data-role");
		const type = elem.getAttribute("data-type");
		const folder = elem.getAttribute("data-folder");
		const archive = elem.getAttribute("data-archive");

		if(!role || !folder || !type) {
			console.log("1 handleGroupClick : folder="+folder+":role="+role+":type="+type);
			return;
		}

		let start =1;

		TrayWidget.DOM.showing.setStart( TrayWidget.SHOWING.setStart( start ) );

		const ACTIVE = "active";

		if(this.MEM.getActiveFolder()) {
			this.MEM.getActiveFolder().classList.remove(ACTIVE);
		}

		elem.classList.add(ACTIVE);
		this.MEM.setActiveFolder( elem );

		TrayWidget.API.openFolder(role, type, folder, archive);

		DocumentWidget.API.setTo_from(role);

		if( folder != "draft") {
			DocumentWidget.API.readOnly();
		}
	}

async function api_getCount(from) {
		//console.log("caller "+from);
		
		await this.API.getCFolderCount();
		await this.API.getDFolderCount();

		await this.API.getDraftsFolderCount();
/*
* add 20220407 k.ogawa
* Totalの表示
*/
		setTimeout( function () {
			this.API.getFolderTotal();
		}.bind(this), 500);

	}

	function api_openTab(leaf) {

		this.DOM.toggle[this.MEM.leaf].classList.remove("active");
		this.DOM.display[this.MEM.leaf].classList.remove("open");

		//this.MEM.leaf = leaf;
		this.MEM.setLeaf( leaf );

		this.DOM.toggle[this.MEM.leaf].classList.add("active");
		this.DOM.display[this.MEM.leaf].classList.add("open");
		
		this.API.getCount("openTab");

	}

	function evt_handleToggleClick(evt) {

		let elem = evt.target;
		if(elem.tagName !== "TD") {
			return;
		}

		let id = elem.getAttribute("id");
		if(!id) {
			return;
		}

		const parts = id.split(".");
		const leaf = parts.pop();
		this.API.openTab(leaf);

	}

/*
* plus 文字で、新規のDocumentをDraftsに追加する
*/
	function evt_handleInvoiceCreate(evt) {
		Traceability.API.init();

		TrayWidget.SHOWING.setAll( parseInt(this.DOM.c.draft.innerText) );
		TrayWidget.DOM.showing.setAll( TrayWidget.SHOWING.addAll() );

		const role = 'seller';
		DocumentWidget.API.setTo_from(role);

		this.DOM.create.nondisplay();
		if( ContactWidget.API.checkSaveTimeout() &&
			DocumentWidget.API.checkSaveTimeout() ) {

			this.SERVER.invoiceCreate();
			
		} else {

			let timeout =  setTimeout( () => {

				this.SERVER.invoiceCreate();

			}, this.MEM.getTimeout());

			this.MEM.setSaveTimeout( timeout );
		}
	}

async function  server_invoiceCreate () {


		const params = {
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

		const url = '/api/invoice/create';

		let response;
        try {
            response = await fetch(url, opts);
        } catch(err) {
            throw err;
        }

		if(response == 'ERR_CONNECTION_REFUSED') {
            alert("Cannot connect server.");
            return;
        }

		await this.API.updateInvoiceDraftCount();

	}

	function api_init() {

		let session = SessionWidget.API.getSessionMemory();

		// We should probably look at the member type and make decisions based off that

		this.API.getCount("init");

	}

}).apply({});
