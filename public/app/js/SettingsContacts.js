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
	"isBuyer" : 1,
	"isSeller" : 1
  },
  "organization": {
    "name": "Company Name",
    "postcode": "Postcode",
    "address": "Company Address",
    "building": "Company Building",
    "department": "Company Department"
  },
  "member": {
    "member_did": "7738b330-c374-11ec-9a98-e1e3cbe42378",
    "membername": "sonny",
    "work_email": "sonny@example.com"
  }
}

const SettingsContacts = (function() {

	this.MEM = {
		details : TEST_DATA
	}

    const Elem = (id) => document.getElementById(id);

	this.DOM = {
		table : {
			page: Elem('SettingsContacts.table.page')
		},
		exportDetails : {
			uses : Elem('SettingsContacts.exportDetails.uses'),
			partner : Elem('SettingsContacts.exportDetails.partner'),
			seller : Elem('SettingsContacts.exportDetails.seller'),
			buyer : Elem('SettingsContacts.exportDetails.buyer'),
			expire : Elem('SettingsContacts.exportDetails.expire'),
			submit : Elem('SettingsContacts.exportDetails.submit')
		},
		importDetails : {
			file : Elem('SettingsContacts.importDetails.file'),
			area : Elem('SettingsContacts.importDetails.area'),
			select : Elem('SettingsContacts.importDetails.select')
		},
		modal : {
			body : Elem('SettingsContacts.modal.body'),
			close : Elem('SettingsContacts.modal.close'), 
			cancel : Elem('SettingsContacts.modal.cancel'),
			submit : Elem('SettingsContacts.modal.submit')
		},
		form : {
			origin : Elem('SettingsContacts.form.origin'),
			membername : Elem('SettingsContacts.form.membername'),
			work_email : Elem('SettingsContacts.form.work_email'),
			organization_name : Elem('SettingsContacts.form.organization_name'),
			organization_country : Elem('SettingsContacts.form.organization_country'),

			organization_postcode : Elem('SettingsContacts.form.organization_postcode'),
			organization_region : Elem('SettingsContacts.form.organization_region'),
			organization_city : Elem('SettingsContacts.form.organization_city'),
			organization_address : Elem('SettingsContacts.form.organization_address'),
			organization_building : Elem('SettingsContacts.form.organization_building'),
			organization_department : Elem('SettingsContacts.form.organization_department'),
			organization_tax_id : Elem('SettingsContacts.form.organization_tax_id')
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

		const url = '/api/contacts/getContactList';

		const opts = {
			method: 'GET',
		}

		const req = await fetch(url, opts);
		const contacts = await req.json();
		
		const { page } = this.DOM.table;
		page.innerHTML = '';

		contacts.forEach ( contact => {

			//console.log(contact);

			const li = document.createElement('li');
			const table = document.createElement('table');
			const row = table.insertRow();

			const checkCell = row.insertCell();
			const membernameCell = row.insertCell();
			const sendCell = row.insertCell();
			const receiveCell = row.insertCell();
			const countCell = row.insertCell();
			const activityCell = row.insertCell();
			const removeCell = row.insertCell();

			checkCell.setAttribute('class', 'check');
			membernameCell.setAttribute('class', 'membername');
			sendCell.setAttribute('class', 'icon');
			receiveCell.setAttribute('class', 'icon');
			countCell.setAttribute('class', 'count');
			activityCell.setAttribute('class', 'activity');
			removeCell.setAttribute('class', 'icon');
			
			// User Cell
			
			const nameSpan = document.createElement('span');
			const compSpan = document.createElement('span');
			const spaceSpan = document.createElement('span');
			const deptSpan = document.createElement('span');
			const breakPoint = document.createElement('br');
			
			const { remote_origin, remote_membername } = contact;
			nameSpan.textContent = `${remote_membername}@${remote_origin}`;
			membernameCell.appendChild(nameSpan);
			membernameCell.appendChild(breakPoint);

			const { name, department } = contact.remote_organization;
			compSpan.textContent = name;
			spaceSpan.textContent = ' ';
			deptSpan.textContent = department;

			membernameCell.appendChild(compSpan);
			membernameCell.appendChild(spaceSpan);
			membernameCell.appendChild(deptSpan);
			
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
			//console.log(contact.created_on);
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

		const { details } = this.MEM;
		console.log("linkRelationship="+details.relatedLink[0].linkRelationship)

		const opts = {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(details), 
		};

		const url = '/api/contacts/addContact';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

		const json = await response.json();
		console.log(json);

		if(json.err !== 0) {
			alert(json.msg);
			return;	
		}

		delete this.MEM.details;
		this.API.renderContacts();

	}

	function api_closeAndClearModal() {

		this.DOM.modal.body.classList.remove('open')
		
		setTimeout( () => {
			const { form } = this.DOM;
			form.origin.textContent = '';
			form.membername.textContent = '';
			form.work_email.textContent = '';
		
			form.organization_name.textContent = '';
			form.organization_postcode.textContent = '';
			form.organization_address.textContent = '';
			form.organization_building.textContent = '';
			form.organization_department.textContent = '';
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

        let linkRelationship;
		let buyer, seller;

		if( this.DOM.exportDetails.partner.checked ) {
			buyer = 1;
			seller = 1;
            linkRelationship = this.DOM.exportDetails.partner.value;

		} else if( this.DOM.exportDetails.seller.checked ) {
			buyer = 0;
			seller = 1;
            linkRelationship = this.DOM.exportDetails.seller.value;

		} else if( this.DOM.exportDetails.buyer.checked ) {
			buyer = 1;
			seller = 0;
            linkRelationship = this.DOM.exportDetails.buyer.value;

		} else {
			console.error("Error : Invite Contact")
			return
		}

		console.log('export click!! linkRelationship ='+ linkRelationship);
		
		const params = {
			uses: parseInt(this.DOM.exportDetails.uses.value),
			buyer: buyer,
			seller: seller,
			expire: this.DOM.exportDetails.expire.value,
			linkRelationship: linkRelationship
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

		const url = '/api/contacts/createBusunessCard';

		let response;
		try {
			response = await fetch(url, opts);
		} catch(err) {
			throw err;
		}

	
		const json = await response.json();
		console.log(json);
		const mime = {type: "text/plain;charset=utf-8"}
		var blob = new Blob([JSON.stringify(json, null, 2)], mime);

		const { id } = json;
		const uuid = id.split(':').pop();
		const time = uuid.split('-').shift();
		saveAs(blob, `ContactDetails_${time}.json`);

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

		console.log(details);

		this.DOM.modal.body.classList.add('open')
		const { form } = this.DOM;
		
		const { credentialSubject, issuer } = details;
		const [ membername, host ] = credentialSubject.contactPoint.split('@');
		const { address } = credentialSubject;

		form.origin.textContent = host;
		form.membername.textContent = membername;
		form.work_email.textContent = issuer.email;
		
		form.organization_name.textContent = credentialSubject.name;
		form.organization_postcode.textContent = address.postalCode;
		form.organization_region.textContent = address.addressRegion;
		form.organization_city.textContent = address.addressLocality;
		form.organization_country.textContent = address.addressCountry;
		form.organization_address.textContent = address.streetAddress;
		form.organization_building.textContent = address.crossStreet;
		form.organization_department.textContent = credentialSubject.department;
		form.organization_tax_id.textContent = credentialSubject.taxId;

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
