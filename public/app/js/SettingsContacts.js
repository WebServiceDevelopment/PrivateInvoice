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

const TEST_DATA = {
  "host": {
    "invite_code": "l2ct23ja",
    "origin": "http://192.168.1.126:30003",
	"isClient" : 1,
	"isSupplier" : 1
  },
  "company": {
    "name": "Company Name",
    "postcode": "Postcode",
    "address": "Company Address",
    "building": "Company Building",
    "department": "Company Department"
  },
  "user": {
    "user_uuid": "7738b330-c374-11ec-9a98-e1e3cbe42378",
    "username": "sonny",
    "work_email": "sonny@example.com"
  }
}

const SettingsContacts = (function() {

	this.MEM = {
		details : TEST_DATA
	}

	this.DOM = {
		table : {
			page: document.getElementById('SettingsContacts.table.page')
		},
		exportDetails : {
			uses : document.getElementById('SettingsContacts.exportDetails.uses'),
			partner : document.getElementById('SettingsContacts.exportDetails.partner'),
			supplier : document.getElementById('SettingsContacts.exportDetails.supplier'),
			client : document.getElementById('SettingsContacts.exportDetails.client'),
			expire : document.getElementById('SettingsContacts.exportDetails.expire'),
			submit : document.getElementById('SettingsContacts.exportDetails.submit')
		},
		importDetails : {
			file : document.getElementById('SettingsContacts.importDetails.file'),
			area : document.getElementById('SettingsContacts.importDetails.area'),
			select : document.getElementById('SettingsContacts.importDetails.select')
		},
		modal : {
			body : document.getElementById('SettingsContacts.modal.body'),
			close : document.getElementById('SettingsContacts.modal.close'), 
			cancel : document.getElementById('SettingsContacts.modal.cancel'),
			submit : document.getElementById('SettingsContacts.modal.submit')
		},
		form : {
			origin : document.getElementById('SettingsContacts.form.origin'),
			username : document.getElementById('SettingsContacts.form.username'),
			work_email : document.getElementById('SettingsContacts.form.work_email'),
			company_name : document.getElementById('SettingsContacts.form.company_name'),
			company_postcode : document.getElementById('SettingsContacts.form.company_postcode'),
			company_address : document.getElementById('SettingsContacts.form.company_address'),
			company_building : document.getElementById('SettingsContacts.form.company_building'),
			company_department : document.getElementById('SettingsContacts.form.company_department')
		}
	}

	this.EVT = {
		handleExportClick : evt_handleExportClick.bind(this),
		handleImportClick : evt_handleImportClick.bind(this),
		handleFileChange : evt_handleFileChange.bind(this),
		handleDragEnter : evt_handleDragEnter.bind(this),
		handleDragLeave : evt_handleDragLeave.bind(this),
		handleDragOver : evt_handleDragOver.bind(this),
		handleDrop : evt_handleDrop.bind(this),
		handleModalCloseClick : evt_handleModalCloseClick.bind(this),
		handleModalCancelClick : evt_handleModalCancelClick.bind(this),
		handleModalSubmitClick : evt_handleModalSubmitClick.bind(this)
	}

	this.API = {
		readContactFile : api_readContactFile.bind(this),
		showContactConfirm : api_showContactConfirm.bind(this),
		closeAndClearModal : api_closeAndClearModal.bind(this),
		addContact : api_addContact.bind(this),
		renderContacts : api_renderContacts.bind(this)
	}

	init.apply(this);
	return this;

	function init() {
		
		// Set Expiration Date to Tomorrow

		const day = moment().add(1, 'days');
		const date = day.format('YYYY-MM-DD')
		this.DOM.exportDetails.expire.value = date;

		// Event Listeners

		this.DOM.exportDetails.submit.addEventListener('click', this.EVT.handleExportClick)
		this.DOM.importDetails.select.addEventListener('click', this.EVT.handleImportClick)
		this.DOM.importDetails.file.addEventListener('change', this.EVT.handleFileChange)

		// Handle Drag and Drop
		
		this.DOM.importDetails.area.addEventListener('dragenter', this.EVT.handleDragEnter)
		this.DOM.importDetails.area.addEventListener('dragleave', this.EVT.handleDragLeave)
		this.DOM.importDetails.area.addEventListener('dragover', this.EVT.handleDragOver)
		this.DOM.importDetails.area.addEventListener('drop', this.EVT.handleDrop)

		// Modal Events

		this.DOM.modal.close.addEventListener('click', this.EVT.handleModalCloseClick);
		this.DOM.modal.cancel.addEventListener('click', this.EVT.handleModalCancelClick);
		this.DOM.modal.submit.addEventListener('click', this.EVT.handleModalSubmitClick);

		// Start Functions

		this.API.renderContacts();

	}

	async function api_renderContacts() {

		const req = await fetch('/api/contacts/get');
		const contacts = await req.json();
		
		const { page } = this.DOM.table;
		page.innerHTML = '';

		contacts.forEach ( contact => {

			console.log(contact);

			const li = document.createElement('li');
			const table = document.createElement('table');
			const row = table.insertRow();

			const checkCell = row.insertCell();
			const usernameCell = row.insertCell();
			const sendCell = row.insertCell();
			const receiveCell = row.insertCell();
			const countCell = row.insertCell();
			const activityCell = row.insertCell();
			const removeCell = row.insertCell();

			checkCell.setAttribute('class', 'check');
			usernameCell.setAttribute('class', 'username');
			sendCell.setAttribute('class', 'icon');
			receiveCell.setAttribute('class', 'icon');
			countCell.setAttribute('class', 'count');
			activityCell.setAttribute('class', 'activity');
			removeCell.setAttribute('class', 'icon');
			
			// User Cell
			
			const nameSpan = document.createElement('span');
			const compSpan = document.createElement('span');
			const deptSpan = document.createElement('span');
			const breakPoint = document.createElement('br');
			
			const { remote_origin, remote_username } = contact;
			nameSpan.textContent = `${remote_username}@${remote_origin}`;
			usernameCell.appendChild(nameSpan);
			usernameCell.appendChild(breakPoint);

			const { name, department } = contact.remote_company;
			compSpan.textContent = name;
			deptSpan.textContent = department;
			usernameCell.appendChild(compSpan);
			usernameCell.appendChild(deptSpan);
			
			li.appendChild(table);
			page.appendChild(li);

			// Send Cell

			const sendIcon = document.createElement('i');
			sendIcon.setAttribute('class', 'fas fa-paper-plane');
			const sendSpan = document.createElement('span');
			sendSpan.textContent = 'Can Send';
			sendCell.appendChild(sendIcon);
			sendCell.appendChild(sendSpan);
			
			if(contact.local_to_remote) {
				sendCell.classList.add('able');
			}

			// Receive Cell

			const receiveIcon = document.createElement('i');
			receiveIcon.setAttribute('class', 'fas fa-inbox');
			const receiveSpan = document.createElement('span');
			receiveSpan.textContent = 'Can Receive';
			receiveCell.appendChild(receiveIcon);
			receiveCell.appendChild(receiveSpan);
			
			if(contact.remote_to_local) {
				receiveCell.classList.add('able');
			}

			// Activity Cell

			const label = document.createElement('a');
			const sinceSpan = document.createElement('span');
			label.textContent = 'Addon On';
			console.log(contact.created_on);
			const since = moment(contact.created_on);
			sinceSpan.textContent = since.fromNow();

			activityCell.appendChild(label);
			activityCell.appendChild(sinceSpan);

			// Receive Cell

			const removeIcon = document.createElement('i');
			removeIcon.setAttribute('class', 'fas fa-trash');
			const removeSpan = document.createElement('span');
			removeSpan.textContent = 'Remove';
			removeCell.appendChild(removeIcon);
			removeCell.appendChild(removeSpan);
			
			if(false) {
				removeCell.classList.add('able');
			}

		});

	}

	async function api_addContact() {

		console.log('now we add the contact!!')
		const { details } = this.MEM;

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(details)
		};

		let response;
		try {
			response = await fetch('/api/contacts/add', opts);
		} catch(err) {
			throw err;
		}

		const json = await response.json();
		console.log(json);

		delete this.MEM.details;
		this.API.renderContacts();

	}

	function api_closeAndClearModal() {

		this.DOM.modal.body.classList.remove('open')
		
		setTimeout( () => {
			const { form } = this.DOM;
			form.origin.textContent = '';
			form.username.textContent = '';
			form.work_email.textContent = '';
		
			form.company_name.textContent = '';
			form.company_postcode.textContent = '';
			form.company_address.textContent = '';
			form.company_building.textContent = '';
			form.company_department.textContent = '';
		}, 1000);

	}

	function evt_handleModalCloseClick() {
		
		this.API.closeAndClearModal();

	}

	function evt_handleModalCancelClick() {

		this.API.closeAndClearModal();

	}

	function evt_handleModalSubmitClick() {

		console.log('try to add contact!!!');

		this.API.closeAndClearModal();
		this.API.addContact();

	}


	function evt_handleDragEnter(evt) {

		console.log('enter');
		this.DOM.importDetails.area.classList.add('over');
		evt.stopPropagation();
		evt.preventDefault();

	}

	function evt_handleDragLeave(evt) {

		console.log('leave');
		this.DOM.importDetails.area.classList.remove('over');
		evt.stopPropagation();
		evt.preventDefault();

	}

	function evt_handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();

	}

	function evt_handleDrop(evt) {

		evt.stopPropagation();
		evt.preventDefault();
		this.DOM.importDetails.area.classList.remove('over');
		const { files } = evt.dataTransfer;
		if(!files) {
			return;
		}

		const [ file ] = files;
		if(!file) {
			return;
		}
		
		this.API.showContactConfirm(file);

	}

	async function evt_handleExportClick() {

		console.log('export click!!');
		
		const params = {
			uses: parseInt(this.DOM.exportDetails.uses.value),
			client: 1,
			supplier: 1,
			expire: this.DOM.exportDetails.expire.value
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
			response = await fetch('/api/contacts/generate', opts);
		} catch(err) {
			throw err;
		}

		const json = await response.json();
		const mime = {type: "text/plain;charset=utf-8"}
		var blob = new Blob([JSON.stringify(json, null, 2)], mime);
		saveAs(blob, `ContactDetails_${json.host.invite_code}.json`);

	}

	function evt_handleImportClick() {
		
		this.API.addContact();

		// this.DOM.importDetails.file.click();

	}

	async function evt_handleFileChange(evt) {
		
		const { files } = evt.target;
		if(!files) {
			return;
		}
		const [ file ] = files;
		if(!file) {
			return;
		}

		this.API.showContactConfirm(file);

	}

	async function api_showContactConfirm(file) {

		const details = await this.API.readContactFile(file)
		this.MEM.details = details;

		this.DOM.modal.body.classList.add('open')
		const { form } = this.DOM;

		const { host, company, user } = details;

		form.origin.textContent = host.origin;
		form.username.textContent = user.username;
		form.work_email.textContent = user.work_email;
		
		form.company_name.textContent = company.name;
		form.company_postcode.textContent = company.postcode;
		form.company_address.textContent = company.address;
		form.company_building.textContent = company.building;
		form.company_department.textContent = company.department;

	}

	function api_readContactFile(file) {
		
		return new Promise( (resolve, reject) => {
			const reader = new FileReader();

			reader.addEventListener('load', () => {
				const { result } = reader;
				try {
					const details = JSON.parse(result);
					resolve(details);
				} catch(err) {
					reject(err);
				}
			});

			reader.readAsText(file);
		});

	}

}).apply({});
