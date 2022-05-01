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

const SettingsProfile = (function() {

	this.MEM = {}

	this.DOM = {
		profile : {
			img : document.getElementById('SettingsProfile.profile.img'),
			file : document.getElementById('SettingsProfile.profile.file'),
			username : document.getElementById('SettingsProfile.profile.username'),
			user_uuid : document.getElementById('SettingsProfile.profile.user_uuid'),
			work_email : document.getElementById('SettingsProfile.profile.work_email'),
			edit : document.getElementById('SettingsProfile.profile.edit'),
			cancel : document.getElementById('SettingsProfile.profile.cancel'),
			save : document.getElementById('SettingsProfile.profile.save')
		},
		company : {
			company_name : document.getElementById('SettingsProfile.company.company_name'),
			company_address : document.getElementById('SettingsProfile.company.company_address'),
			company_building : document.getElementById('SettingsProfile.company.company_building'),
			company_department : document.getElementById('SettingsProfile.company.company_department'),
			company_tax_id : document.getElementById('SettingsProfile.company.company_tax_id'),
			company_postcode : document.getElementById('SettingsProfile.company.company_postcode'),
			edit : document.getElementById('SettingsProfile.company.edit'),
			save : document.getElementById('SettingsProfile.company.save'), 
			cancel : document.getElementById('SettingsProfile.company.cancel')
		},
		logo : {
			img : document.getElementById('SettingsProfile.logo.img'),
			file : document.getElementById('SettingsProfile.logo.file'), 
			submit : document.getElementById('SettingsProfile.logo.submit'), 
			cancel : document.getElementById('SettingsProfile.logo.cancel')
		}
	}

	this.EVT = {
		handleProfileImageChange : evt_handleProfileImageChange.bind(this),

		handleProfileEdit : evt_handleProfileEdit.bind(this),
		handleProfileSave : evt_handleProfileSave.bind(this),
		handleProfileCancel : evt_handleProfileCancel.bind(this),

		handleCompanyEditClick : evt_handleCompanyEditClick.bind(this),
		handleCompanySaveClick : evt_handleCompanySaveClick.bind(this),
		handleCompanyCancelClick : evt_handleCompanyCancelClick.bind(this)
	}

	this.API = {
		renderForm : api_renderForm.bind(this),
		asyncReadFile : api_asyncReadFile.bind(this),
/*
		clearFileInput : api_clearFileInput.bind(this),
*/
		updateCompanyProfile : api_updateCompanyProfile.bind(this),
		updateProfile : api_updateProfile.bind(this)
	}

	init.apply(this);
	return this;

	function init() {
		
		/*
		this.API.clearFileInput();
		this.DOM.profile.file.addEventListener('change', this.EVT.handleProfileImageChange);
		*/

		this.DOM.profile.edit.addEventListener('click', this.EVT.handleProfileEdit);
		this.DOM.profile.save.addEventListener('click', this.EVT.handleProfileSave);
		this.DOM.profile.cancel.addEventListener('click', this.EVT.handleProfileCancel);

		this.DOM.company.edit.addEventListener('click', this.EVT.handleCompanyEditClick);
		this.DOM.company.save.addEventListener('click', this.EVT.handleCompanySaveClick);
		this.DOM.company.cancel.addEventListener('click', this.EVT.handleCompanyCancelClick);

		this.DOM.company.save.setAttribute('disabled', 'disabled');
		this.DOM.company.cancel.setAttribute('disabled', 'disabled');
		this.DOM.company.edit.classList.remove('disabled');

		console.log(this.DOM);

	}

	function api_updateCompanyProfile() {
		
		console.log("updating company profile!!!");

		let userData = this.MEM.userData;

		const args = {
			company_name : userData.company_name,
			company_postcode : userData.company_postcode,
			company_address : userData.company_address,
			company_building : userData.company_building,
			company_department : userData.company_department,
			company_tax_id : userData.company_tax_id
		}

		let ajax = new XMLHttpRequest();
		ajax.open('POST', '/api/session/updateCompany');
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(args));

		ajax.onload = () => {

			console.log(ajax.response);

		}

	}

	function evt_handleCompanyEditClick(evt) {

		console.log("edit click!!!");

		let company = this.DOM.company;

		company.save.removeAttribute('disabled');
		company.cancel.removeAttribute('disabled');
		company.edit.classList.add('disabled');

		company.company_name.removeAttribute("readonly");
		company.company_postcode.removeAttribute("readonly");
		company.company_address.removeAttribute("readonly");
		company.company_building.removeAttribute("readonly");
		company.company_department.removeAttribute("readonly");
		company.company_tax_id.removeAttribute("readonly");

		company.company_name.focus();

	}

	function evt_handleCompanySaveClick(evt) {

		let bool = confirm([
			"This will automatically update your information for your contacts.",
			"Are you sure you would like to change your company information?"
		].join("\n"));

		if(!bool) {
			return;
		}

		let company = this.DOM.company;
		let userData = this.MEM.userData;

		company.save.setAttribute('disabled', 'disabled');
		company.cancel.setAttribute('disabled', 'disabled');
		company.edit.classList.remove('disabled');

		userData.company_name		= company.company_name.value;
		userData.company_postcode	= company.company_postcode.value;
		userData.company_address	= company.company_address.value;
		userData.company_building	= company.company_building.value;
		userData.company_department = company.company_department.value;
		userData.company_tax_id		= company.company_tax_id.value;

		company.company_name.setAttribute("readonly", "readonly");
		company.company_postcode.setAttribute("readonly", "readonly");
		company.company_address.setAttribute("readonly", "readonly");
		company.company_building.setAttribute("readonly", "readonly");
		company.company_department.setAttribute("readonly", "readonly");
		company.company_tax_id.setAttribute("readonly", "readonly");

		this.API.updateCompanyProfile()

	}

	function evt_handleCompanyCancelClick(evt) {

		console.log("cancel click!!");

		let company = this.DOM.company;
		let userData = this.MEM.userData;

		company.save.setAttribute('disabled', 'disabled');
		company.cancel.setAttribute('disabled', 'disabled');
		company.edit.classList.remove('disabled');

		company.company_name.value		= userData.company_name;
		company.company_postcode.value	= userData.company_postcode;
		company.company_address.value	= userData.company_address;
		company.company_building.value	= userData.company_building;
		company.company_department.value = userData.company_department;
		company.company_tax_id.value	= userData.company_tax_id;

		company.company_name.setAttribute("readonly", "readonly");
		company.company_postcode.setAttribute("readonly", "readonly");
		company.company_address.setAttribute("readonly", "readonly");
		company.company_building.setAttribute("readonly", "readonly");
		company.company_department.setAttribute("readonly", "readonly");
		company.company_tax_id.setAttribute("readonly", "readonly");

	}

	async function evt_handleProfileImageChange() {

		let files = this.DOM.profile.file.files;
		if(files.length === 0) {
			return;
		}
		
		const file = files[0];
		const image = await this.API.asyncReadFile(file);

		const canvas = document.createElement('canvas');
		canvas.width = 120;
		canvas.height = 120;
		const context = canvas.getContext('2d');
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		
		this.MEM.dataUrl = canvas.toDataURL();
		this.DOM.profile.img.style.backgroundImage = 'url(' + this.MEM.dataUrl + ')';
		this.DOM.profile.img.classList.add('pending');

	}

/*
	function api_clearFileInput() {
		
		this.DOM.profile.file.setAttribute('type', 'text');
		this.DOM.profile.file.value = '';
		this.DOM.profile.file.setAttribute('type', 'file');

	}
*/

	function api_asyncReadFile(file) {

		return new Promise ( (resolve, reject) => {

			const reader = new FileReader();

			reader.onload = evt => {

				const image = new Image();
				image.src = reader.result;
				image.onload = () => {
					resolve(image);
				}

			}

			reader.readAsDataURL(file);

		});


	}

	function evt_handleProfileEdit(evt) {

		console.log("edit click!!!");

		let profile = this.DOM.profile;

		profile.save.removeAttribute('disabled');
		profile.cancel.removeAttribute('disabled');
		profile.edit.classList.add('disabled');

		profile.username.removeAttribute("readonly");
		profile.user_uuid.removeAttribute("readonly");
		profile.work_email.removeAttribute("readonly");

		profile.username.focus();

	}


	function evt_handleProfileCancel() {
	
		console.log("cancel click!!");

		let profile = this.DOM.profile;
		let userData = this.MEM.userData;

		profile.save.setAttribute('disabled', 'disabled');
		profile.cancel.setAttribute('disabled', 'disabled');
		profile.edit.classList.remove('disabled');

		profile.username.value		= userData.username;
		profile.user_uuid.value		= userData.user_uuid;
		profile.work_email.value	= userData.work_email;

		profile.username.setAttribute("readonly", "readonly");
		profile.user_uuid.setAttribute("readonly", "readonly");
		profile.work_email.setAttribute("readonly", "readonly");
	}

	async function evt_handleProfileSave() {

		let profile = this.DOM.profile;
		let userData = this.MEM.userData;

		profile.save.setAttribute('disabled', 'disabled');
		profile.cancel.setAttribute('disabled', 'disabled');
		profile.edit.classList.remove('disabled');

		userData.username	= profile.username.value;
		userData.user_uuid	= profile.user_uuid.value;
		userData.work_email	= profile.work_email.value;

		profile.username.setAttribute("readonly", "readonly");
		profile.user_uuid.setAttribute("readonly", "readonly");
		profile.work_email.setAttribute("readonly", "readonly");

		this.API.updateProfile();

	}

	function api_updateProfile() {
		
		console.log("updating user profile!!!");

		let userData = this.MEM.userData;

		const args = {
			username : userData.username,
			user_uuid : userData.user_uuid,
			work_email : userData.work_email,
		}

		const PATH = '/api/session/updateProfile';

		let ajax = new XMLHttpRequest();
        ajax.open('POST', PATH );
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(args));

		ajax.onload = () => {
			console.log(ajax.response);
		}

	}

	function api_renderForm(userData) {

		this.MEM.userData = userData;
	
		// Profile 

		this.DOM.profile.username.value = userData.username;
		this.DOM.profile.user_uuid.value = userData.user_uuid;
		this.DOM.profile.work_email.value = userData.work_email;

		this.DOM.profile.username.setAttribute("readonly", "readonly");
		this.DOM.profile.user_uuid.setAttribute("readonly", "readonly");
		this.DOM.profile.work_email.setAttribute("readonly", "readonly");

        const ajax = new XMLHttpRequest();
        ajax.open('POST', '/api/settings/getProfileImage');
        ajax.setRequestHeader('Content-Type', 'application/json');
        ajax.responseType = "json";
        ajax.send();

		ajax.onload = () => {
			
			let res = ajax.response;

			if(!res.msg) {
				return;
			}

			this.MEM.userData.profile_img = res.msg.dataUrl;
			let url = res.msg.dataUrl;
			this.DOM.profile.img.style.backgroundImage = `url('${url}')`;

		}
		
		// Company
	
		this.MEM.userData = userData;
		let company = this.DOM.company;

		company.company_name.value = userData.company_name;
		company.company_postcode.value = userData.company_postcode;
		company.company_address.value = userData.company_address;
		company.company_building.value = userData.company_building;
		company.company_department.value = userData.company_department;
		company.company_tax_id.value = userData.company_tax_id;

		company.company_name.setAttribute("readonly", "readonly");
		company.company_postcode.setAttribute("readonly", "readonly");
		company.company_address.setAttribute("readonly", "readonly");
		company.company_building.setAttribute("readonly", "readonly");
		company.company_department.setAttribute("readonly", "readonly");
		company.company_tax_id.setAttribute("readonly", "readonly");

	}


}).apply({});
