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

	this.DOM = {
		line : document.getElementById('ContactWidget.line'),
		input : document.getElementById('ContactWidget.input'),
		list : document.getElementById('ContactWidget.list')
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
		//this.MEM.setEditable( doc.editable );

		if(session.user_uuid === doc.supplier_uuid) {

			if(doc.client_username) {
				this.DOM.input.value = doc.client_username;
			} else {
				this.DOM.input.value = "";
			}

		} else {

			this.DOM.input.value = doc.supplier_username;

		}

		//if(this.MEM.getEditable()) {
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

	function api_updateAddress() {
		
		this.MEM.initSaveTimeout();

		let username = this.DOM.input.value;
		let userData = this.MEM.getLookup( username );

		if(!userData) {
			this.DOM.input.value = "";
			TrayWidget.API.updateCompany("");
		} else {
			TrayWidget.API.updateCompany(userData.company_name);
		}
		
		DocumentWidget.API.updateToInfo(userData);

	}

	function evt_handleListClick(evt) {
		
		let elem = evt.target;
		while(!elem.userData) {
			if(elem === this.DOM.list) {
				return;
			}
			elem = elem.parentNode;
		}

		this.DOM.input.value = elem.userData.username;

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
			contactType : "clients"
		};

		const ajax = new XMLHttpRequest();
		ajax.open('POST', '/api/invite/contacts');
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
				this.MEM.setLookup( contact.username, contact );
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

			let a = contact.username;
			let b = contact.company_name;
			let c = contact.company_department;

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
			li.userData = contact;
			const table = document.createElement('table');

			const row_1 = table.insertRow();
			const row_2 = table.insertRow();
			const row_3 = table.insertRow();

			const prof_cell = row_1.insertCell();
			const name_cell = row_1.insertCell();
			const comp_cell = row_2.insertCell();
			const dept_cell = row_3.insertCell();

			const profile = document.createElement("div");
			profile.setAttribute("class", "profile");

			prof_cell.setAttribute("rowspan", "3");
			prof_cell.setAttribute("class", "profile");
			name_cell.setAttribute("class", "username");
			comp_cell.setAttribute("class", "company");

			hits++;

			name_cell.innerHTML = a.replace(regex, (m) => `<b>${m}</b>`);
			comp_cell.innerHTML = b.replace(regex, (m) => `<b>${m}</b>`);
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
