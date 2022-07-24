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

const ContactWidget = (function() {

	this.MEM = {
		list : null,
		getList : () => this.MEM.list,
		setList : (list) => this.MEM.list = list,

		lookup : {},
		getLookup : (key) => this.MEM.lookup[key],
		setLookup : (key, value) => this.MEM.lookup[key] = value,
		initLookup : () => this.MEM.lookup = {},

		timeout: 500,
		getTimeout : () => this.MEM.timeout,

		saveTimeout : null,
		getSaveTimeout : () => this.MEM.saveTimeout,
		setSaveTimeout : (timeout) => this.MEM.saveTimeout = timeout,
		initSaveTimeout : () => this.MEM.saveTimeout = null,
	}

    const Elem = (id) => document.getElementById(id);

	this.DOM = {
		line : Elem('ContactWidget.line'),
		input : Elem('ContactWidget.input'),
		list : Elem('ContactWidget.list')
	}

	this.EVT = {
		handleInputFocus : evt_handleInputFocus.bind(this),
		handleInputChange : evt_handleInputChange.bind(this),
		handleInputBlur : evt_handleInputBlur.bind(this),
		handleListClick : evt_handleListClick.bind(this)
	}

	this.API = {
		setAddress : api_setAddress.bind(this),
		clearAddress : api_clearAddress.bind(this),
		updateAddress : api_updateAddress.bind(this),
		checkSaveTimeout : api_checkSaveTimeout.bind(this),
	}

	init.apply(this);
	return this;

	function init() {

		this.DOM.input.value = "";
		this.DOM.list.addEventListener('click', this.EVT.handleListClick);

		this.DOM.input.addEventListener('focus', this.EVT.handleInputFocus);
		this.DOM.input.addEventListener('input', this.EVT.handleInputChange);
		this.DOM.input.addEventListener('blur', this.EVT.handleInputBlur);

	}

	function api_checkSaveTimeout() {
		return (this.MEM.getSaveTimeout() == null) ? true: false;
	}

	function api_clearAddress() {

		this.DOM.input.value = "";

	}

	function api_setAddress(doc) {
	
		let session = SessionWidget.API.getSessionMemory();

/*
*		if(session.member_did === doc.seller_did) {
*
*			if(doc.buyer_membername != null) {
*				this.DOM.input.value = doc.buyer_membername;
*			} else {
*				this.DOM.input.value = "";
*			}
*
*		} else {
*
*			if(doc.buyer_membername != null) {
*				this.DOM.input.value = doc.seller_membername;
*			} else {
*				this.DOM.input.value = "";
*			}
*
*		}
*/

		const elem =  FolderWidget.MEM.getActiveFolder();

		if( elem != null) {
			const folder = elem.getAttribute("data-folder");

			if(folder == "draft") {
				this.DOM.input.removeAttribute("readonly");
			} else {
				this.DOM.input.setAttribute("readonly", "readonly");
			}
		}

	}

/*
 * api_updateAddress()
 *
 * Extract member data of To.
 * Generate contactPoint from membername and remote_origin.
 * Set taxId.
 * Update document.
 */
	function api_updateAddress() {
		
		this.MEM.initSaveTimeout();

		let membername = this.DOM.input.value;
		let memberData = this.MEM.getLookup( membername );

		if(!memberData) {
			this.DOM.input.value = "";
			TrayWidget.API.updateCompany("");

		} else {
			TrayWidget.API.updateCompany(memberData.organization_name);

			memberData.contactPoint = _contactPoint(membername, memberData.remote_origin);

		}
		//console.log("memberData.contactPoint ="+memberData.contactPoint);

		
/*
		for(let key in memberData) {
			console.log(key+"="+memberData[key])
			for(let key1 in memberData[key]) {
				if(typeof memberData[key] == "object") {
					console.log(key1+"="+memberData[key][key1])
				}
			}
		}
		console.log("memberData.taxId ="+memberData.taxId);
*/

		
		DocumentWidget.API.updateToInfo(memberData);

		return;

		function _contactPoint (membername, remote_origin) {

			const HTTP = "http://";
			const HTTPS = "https://";

			let http_addr = "";

			if(remote_origin.indexOf(HTTP) !== -1) {
				http_addr =remote_origin.split(HTTP)[1];

			} else if(remote_origin.indexOf(HTTPS) !== -1) {
				http_addr =remote_origin.split(HTTPS)[1];
			}

			return membername + "@"+ http_addr;
		}

	}

	

	function evt_handleListClick(evt) {
		
		let elem = evt.target;
		while(!elem.memberData) {
			if(elem === this.DOM.list) {
				return;
			}
			elem = elem.parentNode;
		}

		this.DOM.input.value = elem.memberData.membername;

		clearTimeout(this.MEM.getSaveTimeout());
		this.MEM.initSaveTimeout();

		this.API.updateAddress();

	}

	function evt_handleInputBlur() {
	
		const elem =  FolderWidget.MEM.getActiveFolder();
		if( elem != null) {
			const folder = elem.getAttribute("data-folder");
			if(folder != "draft") {
				return;
			}
		}
		
		this.DOM.line.classList.remove("open");

		let timeout =  setTimeout( () => {
			this.API.updateAddress();
		}, this.MEM.getTimeout());

		this.MEM.setSaveTimeout( timeout );
	}

	function evt_handleInputFocus() {
	
		const elem =  FolderWidget.MEM.getActiveFolder();
		if( elem != null) {
			const folder = elem.getAttribute("data-folder");
			if(folder != "draft") {
				return;
			}
		}

		const params = {
			contactType : "buyers"
		};

		const url = '/api/invite/contacts';

		const ajax = new XMLHttpRequest();
		ajax.open('POST', url);
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(params));

		ajax.onload = () => {
			
			let res = ajax.response;

			if(res.err) {
				throw res.msg;
			}

			this.MEM.initSaveTimeout();
			
			const list = res.msg;

			this.MEM.setList( list );

			this.MEM.lookup = {};
			list.forEach( contact => {
				this.MEM.setLookup( contact.membername, contact );
				if(contact == null) {
					return;
				}
			});

		}

	}

	function evt_handleInputChange() {
	
		const elem =  FolderWidget.MEM.getActiveFolder();
		if( elem != null) {
			const folder = elem.getAttribute("data-folder");
			//console.log("folder ="+folder);
			if(folder != "draft") {
				return;
			}
		}

		let hits = 0;
		const ul = document.createElement("ul");

		// Do the search
	
		let needle = this.DOM.input.value;
		if(needle.replace(/\s/g, "").length === 0) {
			this.DOM.line.classList.remove("open");
			return;
		}
		
		this.DOM.line.classList.add("open");

		//console.log("1 handleInputChange");

		const list = this.MEM.getList();
		list.forEach( contact => {
			
			if(hits === 5) {
				return;
			}

			let a = contact.membername;
			let b = contact.organization_name;
			let c = contact.organization_department;

/*
			for(let key in contact) {
				//console.log(key +":"+contact[key])
			}
*/

			let regex;
			try {
				regex = new RegExp(needle, "gi");
			} catch(e) {
				alert("正しくない文字列です");
				return;
			}
			

			if(!regex.test(a) && !regex.test(b) && !regex.test(c)) {
				return;
			}

			const li = document.createElement("li");
			li.memberData = contact;
			const table = document.createElement('table');

			const row_1 = table.insertRow();
			const row_2 = table.insertRow();
			const row_3 = table.insertRow();

			const prof_cell = row_1.insertCell();
			const name_cell = row_1.insertCell();
			const org_cell = row_2.insertCell();
			const dept_cell = row_3.insertCell();

			const profile = document.createElement("div");
			profile.setAttribute("class", "profile");

			prof_cell.setAttribute("rowspan", "3");
			prof_cell.setAttribute("class", "profile");
			org_cell.setAttribute("class", "organization");

			name_cell.setAttribute("class", "membername");

			hits++;

			name_cell.innerHTML = a.replace(regex, (m) => `<b>${m}</b>`);
			org_cell.innerHTML = b.replace(regex, (m) => `<b>${m}</b>`);
			dept_cell.innerHTML = c.replace(regex, (m) => `<b>${m}</b>`);

			prof_cell.appendChild(profile);
			li.appendChild(table);
			ul.appendChild(li);

		});

		if(hits === 0) {
			
			const li = document.createElement("li");
			const table = document.createElement("table");
			const row = table.insertRow();
			const cell = row.insertCell();
			
			cell.setAttribute("class", "center");
			cell.textContent = "No Matches Found";
			li.appendChild(table);
		}

		let prev = this.DOM.list.childNodes[0];
		this.DOM.list.replaceChild(ul, prev);

	}

}).apply({});
