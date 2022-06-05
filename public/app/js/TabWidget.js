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

const TabWidget = (function() {

	this.MEM = {}

	this.DOM = {
		tab : {
			settings : document.getElementById('TabWidget.tab.settings')
		},
		section : {
			supplier : document.getElementById('TabWidget.section.seller'),
			settings : document.getElementById('TabWidget.section.settings')
		}
	}

	this.EVT = {
		handleToggleClick : evt_handleToggleClick.bind(this)
	}

	this.API = {
		openSection : api_openSection.bind(this)
	}

	init.apply(this);
	return this;

	function init() {

		for(let key in this.DOM.tab) {
			this.DOM.tab[key].addEventListener('click', this.EVT.handleToggleClick);
		}

		// this.API.openSection("supplier");

		this.API.openSection("settings");

	}

	function api_openSection(leaf) {
		//console.log(leaf);

		for(let key in this.DOM.tab) {
			if(this.DOM.tab[key]) {
				this.DOM.tab[key].classList.remove("open");
			}
			this.DOM.section[key].classList.remove("open");
		}
		
		if(this.DOM.tab[leaf]) {
			this.DOM.tab[leaf].classList.add("open");
		}
		this.DOM.section[leaf].classList.add("open");


	}

	function evt_handleToggleClick(evt) {

		let elem = evt.target;
		while(elem.parentNode) {
			if(elem.tagName === "DIV" || elem.tagName === "TD") {
				break;
			}
			elem = elem.parentNode;
		}

		let id = elem.getAttribute("id");
		let leaf = id.split(".").pop();
		this.API.openSection(leaf);

	}


}).apply({});
