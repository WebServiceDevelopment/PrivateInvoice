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

    const Elem = (id) => document.getElementById(id);

	this.DOM = {
		area : {
			back : Elem('SettingsMenu.area.back'),
			menu : Elem('SettingsMenu.area.menu')
		},
		menu : {
			organization : Elem('SettingsMenu.menu.organization'),
			profile : Elem('SettingsMenu.menu.profile'),
			groups : Elem('SettingsMenu.menu.groups'),
			security : Elem('SettingsMenu.menu.security'),
			contacts : Elem('SettingsMenu.menu.contacts'),
			directory : Elem('SettingsMenu.menu.directory'),
			wallet : Elem('SettingsMenu.menu.wallet'),
			activity : Elem('SettingsMenu.menu.activity'),
			statement : Elem('SettingsMenu.menu.statement'),
			invite : Elem('SettingsMenu.menu.invite'),
			api : Elem('SettingsMenu.menu.api'),
			pro : Elem('SettingsMenu.menu.pro')
		},
		pages : {
			organization : Elem('SettingsMenu.pages.organization'),
			profile : Elem('SettingsMenu.pages.profile'),
			groups : Elem('SettingsMenu.pages.groups'),
			security : Elem('SettingsMenu.pages.security'),
			contacts : Elem('SettingsMenu.pages.contacts'),
			directory : Elem('SettingsMenu.pages.directory'),
			wallet : Elem('SettingsMenu.pages.wallet'),
			activity : Elem('SettingsMenu.pages.activity'),
			statement : Elem('SettingsMenu.pages.statement'),
			invite : Elem('SettingsMenu.pages.invite'),
			api : Elem('SettingsMenu.pages.api'),
			api_details : Elem('SettingsMenu.pages.api_details'),
			pro : Elem('SettingsMenu.pages.pro')
		},
		btns : {
			createApi : Elem('SettingsMenu.btns.createApi'),	
			cancelApi : Elem('SettingsMenu.btns.cancelApi')
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

		switch(leaf) {
		case "back":
			TabWidget.API.openSection("supplier");
		return;
		case "wallet":
			SettingsWallet.API.loadResentActivity();
		break;
		}

		this.API.openPage(leaf);

	}

}).apply({});
