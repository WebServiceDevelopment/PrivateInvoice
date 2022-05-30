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

const SettingsMenu = (function() {

	this.MEM = {
		leaf : null,
		setLeaf : (leaf) => this.MEM.leaf = leaf,
		getLeaf : () => this.MEM.leaf,
	}

	this.DOM = {
		area : {
			back : document.getElementById('SettingsMenu.area.back'),
			menu : document.getElementById('SettingsMenu.area.menu')
		},
		menu : {
			organization : document.getElementById('SettingsMenu.menu.organization'),
			profile : document.getElementById('SettingsMenu.menu.profile'),
			groups : document.getElementById('SettingsMenu.menu.groups'),
			security : document.getElementById('SettingsMenu.menu.security'),
			contacts : document.getElementById('SettingsMenu.menu.contacts'),
			directory : document.getElementById('SettingsMenu.menu.directory'),
			wallet : document.getElementById('SettingsMenu.menu.wallet'),
			activity : document.getElementById('SettingsMenu.menu.activity'),
			statement : document.getElementById('SettingsMenu.menu.statement'),
			invite : document.getElementById('SettingsMenu.menu.invite'),
			api : document.getElementById('SettingsMenu.menu.api'),
			pro : document.getElementById('SettingsMenu.menu.pro')
		},
		pages : {
			organization : document.getElementById('SettingsMenu.pages.organization'),
			profile : document.getElementById('SettingsMenu.pages.profile'),
			groups : document.getElementById('SettingsMenu.pages.groups'),
			security : document.getElementById('SettingsMenu.pages.security'),
			contacts : document.getElementById('SettingsMenu.pages.contacts'),
			directory : document.getElementById('SettingsMenu.pages.directory'),
			wallet : document.getElementById('SettingsMenu.pages.wallet'),
			activity : document.getElementById('SettingsMenu.pages.activity'),
			statement : document.getElementById('SettingsMenu.pages.statement'),
			invite : document.getElementById('SettingsMenu.pages.invite'),
			api : document.getElementById('SettingsMenu.pages.api'),
			api_details : document.getElementById('SettingsMenu.pages.api_details'),
			pro : document.getElementById('SettingsMenu.pages.pro')
		},
		btns : {
			createApi : document.getElementById('SettingsMenu.btns.createApi'),	
			cancelApi : document.getElementById('SettingsMenu.btns.cancelApi')
		}
	}

	this.EVT = {
		handleMenuClick : evt_handleMenuClick.bind(this),
		handleCreateApiClick : evt_handleCreateApiClick.bind(this),
		handleCancelApiClick : evt_handleCancelApiClick.bind(this)
	}

	this.API = {
		openPage : api_openPage.bind(this),
		swapPage : api_swapPage.bind(this)
	}

	init.apply(this);
	return this;

	function init() {
		
		this.API.openPage('contacts');
		
		this.DOM.area.menu.addEventListener('click', this.EVT.handleMenuClick);

		this.DOM.btns.createApi.addEventListener('click', this.EVT.handleCreateApiClick);
		this.DOM.btns.cancelApi.addEventListener('click', this.EVT.handleCancelApiClick);

	}

	function evt_handleCancelApiClick() {
		
		console.log("cancel api");
		this.API.swapPage("api");

	}

	function evt_handleCreateApiClick() {
		
		console.log("create api!!");
		this.API.swapPage("api_details");

	}

	function api_swapPage(leaf) {

		console.log("Open : %s", leaf);

		this.DOM.activePage.classList.remove("active");
		this.DOM.activePage = this.DOM.pages[leaf];
		this.DOM.activePage.classList.add("active");

	}

	function api_openPage(leaf) {

		//console.log("Open : %s", leaf);

		//if(this.MEM.leaf === leaf) {
		if(this.MEM.getLeaf() === leaf) {
			return;
		}

		if(this.MEM.getLeaf()) {
			this.DOM.activeMenu.classList.remove("active");
			this.DOM.activePage.classList.remove("active");
		}

		switch(leaf) {
		case "invite":
			SettingsInvite.API.open();
			break;
		}

		//console.log(leaf)
		//this.MEM.leaf = leaf;
		this.MEM.setLeaf( leaf );
		this.DOM.activeMenu = this.DOM.menu[leaf];
		this.DOM.activePage = this.DOM.pages[leaf];

		this.DOM.activeMenu.classList.add("active");
		this.DOM.activePage.classList.add("active");

	}

	function evt_handleMenuClick(evt) {

		//console.log("click");

		let elem = evt.target;
		while(elem.parentNode && elem.tagName !== "LI") {
			elem = elem.parentNode;
		}
		
		if(!elem.getAttribute) {
			return;
		}

		const id = elem.getAttribute("id");
		if(!id) {
			return;
		}

		const leaf = id.split(".").pop();

		if(leaf === "back") {
			TabWidget.API.openSection("supplier");
			return;
		}
		this.API.openPage(leaf);

	}


}).apply({});
