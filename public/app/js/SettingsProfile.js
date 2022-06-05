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
			membername : document.getElementById('SettingsProfile.profile.membername'),
			member_uuid : document.getElementById('SettingsProfile.profile.member_uuid'),
			work_email : document.getElementById('SettingsProfile.profile.work_email'),
			edit : document.getElementById('SettingsProfile.profile.edit'),
			cancel : document.getElementById('SettingsProfile.profile.cancel'),
			save : document.getElementById('SettingsProfile.profile.save')
		},
		organization : {
			organization_name : document.getElementById('SettingsProfile.organization.organization_name'),
			organization_postcode : document.getElementById('SettingsProfile.organization.organization_postcode'),
			organization_address : document.getElementById('SettingsProfile.organization.organization_address'),
			organization_building : document.getElementById('SettingsProfile.organization.organization_building'),
			organization_department : document.getElementById('SettingsProfile.organization.organization_department'),
			organization_tax_id : document.getElementById('SettingsProfile.organization.organization_tax_id'),
			addressCountry: document.getElementById('SettingsProfile.organization.addressCountry'),
			addressRegion : document.getElementById('SettingsProfile.organization.addressRegion'),
			edit : document.getElementById('SettingsProfile.organization.edit'),
			save : document.getElementById('SettingsProfile.organization.save'), 
			cancel : document.getElementById('SettingsProfile.organization.cancel')
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

		this.DOM.organization.edit.addEventListener('click', this.EVT.handleCompanyEditClick);
		this.DOM.organization.save.addEventListener('click', this.EVT.handleCompanySaveClick);
		this.DOM.organization.cancel.addEventListener('click', this.EVT.handleCompanyCancelClick);

		this.DOM.organization.save.setAttribute('disabled', 'disabled');
		this.DOM.organization.cancel.setAttribute('disabled', 'disabled');
		this.DOM.organization.edit.classList.remove('disabled');

		//console.log(this.DOM);

	}

	function api_updateCompanyProfile() {
		
		console.log("updating organization profile!!!");

		let memberData = this.MEM.memberData;

		const args = {
			organization_name : memberData.organization_name,
			organization_postcode : memberData.organization_postcode,
			organization_address : memberData.organization_address,
			organization_building : memberData.organization_building,
			organization_department : memberData.organization_department,
			organization_tax_id : memberData.organization_tax_id,
			addressCountry : memberData.addressCountry,
			addressRegion : memberData.addressRegion,
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

		let organization = this.DOM.organization;

		organization.save.removeAttribute('disabled');
		organization.cancel.removeAttribute('disabled');
		organization.edit.classList.add('disabled');

		organization.organization_name.removeAttribute("readonly");
		organization.organization_postcode.removeAttribute("readonly");
		organization.organization_address.removeAttribute("readonly");
		organization.organization_building.removeAttribute("readonly");
		organization.organization_department.removeAttribute("readonly");
		organization.organization_tax_id.removeAttribute("readonly");
		organization.addressCountry.removeAttribute("readonly");
		organization.addressRegion.removeAttribute("readonly");

		organization.organization_name.focus();

	}

	function evt_handleCompanySaveClick(evt) {

		let bool = confirm([
			"This will automatically update your information for your contacts.",
			"Are you sure you would like to change your organization information?"
		].join("\n"));

		if(!bool) {
			return;
		}

		let organization = this.DOM.organization;
		let memberData = this.MEM.memberData;

		organization.save.setAttribute('disabled', 'disabled');
		organization.cancel.setAttribute('disabled', 'disabled');
		organization.edit.classList.remove('disabled');

		memberData.organization_name		= organization.organization_name.value;
		memberData.organization_postcode	= organization.organization_postcode.value;
		memberData.organization_address		= organization.organization_address.value;
		memberData.organization_building	= organization.organization_building.value;
		memberData.organization_department	= organization.organization_department.value;
		memberData.organization_tax_id		= organization.organization_tax_id.value;
		memberData.addressCountry			= organization.addressCountry.value;
		memberData.addressRegion			= organization.addressRegion.value;

		organization.organization_name.setAttribute("readonly", "readonly");
		organization.organization_postcode.setAttribute("readonly", "readonly");
		organization.organization_address.setAttribute("readonly", "readonly");
		organization.organization_building.setAttribute("readonly", "readonly");
		organization.organization_department.setAttribute("readonly", "readonly");
		organization.organization_tax_id.setAttribute("readonly", "readonly");
		organization.addressCountry.setAttribute("readonly", "readonly");
		organization.addressRegion.setAttribute("readonly", "readonly");

		this.API.updateCompanyProfile()

	}

	function evt_handleCompanyCancelClick(evt) {

		console.log("cancel click!!");

		let organization = this.DOM.organization;
		let memberData = this.MEM.memberData;

		organization.save.setAttribute('disabled', 'disabled');
		organization.cancel.setAttribute('disabled', 'disabled');
		organization.edit.classList.remove('disabled');

		organization.organization_name.value		= memberData.organization_name;
		organization.organization_postcode.value	= memberData.organization_postcode;
		organization.organization_address.value		= memberData.organization_address;
		organization.organization_building.value	= memberData.organization_building;
		organization.organization_department.value	= memberData.organization_department;
		organization.organization_tax_id.value		= memberData.organization_tax_id;
		organization.addressCountry.value			= memberData.addressCountry;
		organization.addressRegion.value			= memberData.addressRegion;

		organization.organization_name.setAttribute("readonly", "readonly");
		organization.organization_postcode.setAttribute("readonly", "readonly");
		organization.organization_address.setAttribute("readonly", "readonly");
		organization.organization_building.setAttribute("readonly", "readonly");
		organization.organization_department.setAttribute("readonly", "readonly");
		organization.organization_tax_id.setAttribute("readonly", "readonly");
		organization.addressCountry.setAttribute("readonly", "readonly");
		organization.addressRegion.setAttribute("readonly", "readonly");

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

		profile.membername.removeAttribute("readonly");
		profile.member_uuid.removeAttribute("readonly");
		profile.work_email.removeAttribute("readonly");

		profile.membername.focus();

	}


	function evt_handleProfileCancel() {
	
		console.log("cancel click!!");

		let profile = this.DOM.profile;
		let memberData = this.MEM.memberData;

		profile.save.setAttribute('disabled', 'disabled');
		profile.cancel.setAttribute('disabled', 'disabled');
		profile.edit.classList.remove('disabled');

		profile.membername.value		= memberData.membername;
		profile.member_uuid.value		= memberData.member_uuid;
		profile.work_email.value	= memberData.work_email;

		profile.membername.setAttribute("readonly", "readonly");
		profile.member_uuid.setAttribute("readonly", "readonly");
		profile.work_email.setAttribute("readonly", "readonly");
	}

	async function evt_handleProfileSave() {

		let profile = this.DOM.profile;
		let memberData = this.MEM.memberData;

		profile.save.setAttribute('disabled', 'disabled');
		profile.cancel.setAttribute('disabled', 'disabled');
		profile.edit.classList.remove('disabled');

		memberData.membername	= profile.membername.value;
		memberData.member_uuid	= profile.member_uuid.value;
		memberData.work_email	= profile.work_email.value;

		profile.membername.setAttribute("readonly", "readonly");
		profile.member_uuid.setAttribute("readonly", "readonly");
		profile.work_email.setAttribute("readonly", "readonly");

		this.API.updateProfile();

	}

	function api_updateProfile() {
		
		console.log("updating member profile!!!");

		let memberData = this.MEM.memberData;

		const args = {
			membername : memberData.membername,
			member_uuid : memberData.member_uuid,
			work_email : memberData.work_email,
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

	function api_renderForm(memberData) {

		this.MEM.memberData = memberData;
	
		// Profile 

		this.DOM.profile.membername.value = memberData.membername;
		this.DOM.profile.member_uuid.value = memberData.member_uuid;
		this.DOM.profile.work_email.value = memberData.work_email;

		this.DOM.profile.membername.setAttribute("readonly", "readonly");
		this.DOM.profile.member_uuid.setAttribute("readonly", "readonly");
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

			this.MEM.memberData.profile_img = res.msg.dataUrl;
			let url = res.msg.dataUrl;
			this.DOM.profile.img.style.backgroundImage = `url('${url}')`;

		}
		
		// Company
	
		this.MEM.memberData = memberData;
		let organization = this.DOM.organization;

		organization.organization_name.value = memberData.organization_name;
		organization.organization_postcode.value = memberData.organization_postcode;
		organization.organization_address.value = memberData.organization_address;
		organization.organization_building.value = memberData.organization_building;
		organization.organization_department.value = memberData.organization_department;
		organization.organization_tax_id.value = memberData.organization_tax_id;
		organization.addressCountry.value = memberData.addressCountry;
		organization.addressRegion.value = memberData.addressRegion;

		organization.organization_name.setAttribute("readonly", "readonly");
		organization.organization_postcode.setAttribute("readonly", "readonly");
		organization.organization_address.setAttribute("readonly", "readonly");
		organization.organization_building.setAttribute("readonly", "readonly");
		organization.organization_department.setAttribute("readonly", "readonly");
		organization.organization_tax_id.setAttribute("readonly", "readonly");
		organization.addressCountry.setAttribute("readonly", "readonly");
		organization.addressRegion.setAttribute("readonly", "readonly");

	}


}).apply({});
