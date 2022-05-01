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
			company : document.getElementById('SettingsMenu.menu.company'),
			profile : document.getElementById('SettingsMenu.menu.profile'),
			contacts : document.getElementById('SettingsMenu.menu.contacts')
		},
		pages : {
			company : document.getElementById('SettingsMenu.pages.company'),
			profile : document.getElementById('SettingsMenu.pages.profile'),
			contacts : document.getElementById('SettingsMenu.pages.contacts')
		}
	}

	this.EVT = {
		handleMenuClick : evt_handleMenuClick.bind(this)
	}

	this.API = {
		openPage : api_openPage.bind(this),
		swapPage : api_swapPage.bind(this)
	}

	init.apply(this);
	return this;

	function init() {
		
		this.API.openPage('company');
		this.DOM.area.menu.addEventListener('click', this.EVT.handleMenuClick);

	}

	function api_swapPage(leaf) {

		console.log("Open : %s", leaf);

		this.DOM.activePage.classList.remove("active");
		this.DOM.activePage = this.DOM.pages[leaf];
		this.DOM.activePage.classList.add("active");

	}

	function api_openPage(leaf) {

		console.log("Open : %s", leaf);

		if(this.MEM.getLeaf() === leaf) {
			return;
		}

		if(this.MEM.getLeaf()) {
			this.DOM.activeMenu.classList.remove("active");
			this.DOM.activePage.classList.remove("active");
		}

		this.MEM.setLeaf( leaf );
		this.DOM.activeMenu = this.DOM.menu[leaf];
		this.DOM.activePage = this.DOM.pages[leaf];

		this.DOM.activeMenu.classList.add("active");
		this.DOM.activePage.classList.add("active");

	}

	function evt_handleMenuClick(evt) {

		console.log("click");

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
