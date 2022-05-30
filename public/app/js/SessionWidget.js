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

const SessionWidget = (function() {

	this.MEM = {
		session : null,
		setSession : (session) => this.MEM.session = session,
        getSession : () => this.MEM.session,
	}

	this.DOM = {
		menu : {
			toggle : document.getElementById('SessionWidget.menu.toggle'),
			body : document.getElementById('SessionWidget.menu.body'),
			membername : document.getElementById('SessionWidget.menu.membername'),
			signout : document.getElementById('SessionWidget.menu.signout')
		}
	}

	this.EVT = {
		handleToggleClick : evt_handleToggleClick.bind(this),
		handleSignoutClick : evt_handleSignoutClick.bind(this),
		handleDocumentClick : evt_handleDocumentClick.bind(this)
	}

	this.API = {
		getSessionData : api_getSessionData.bind(this),
		getSessionMemory : api_getSessionMemory.bind(this),

	}

	init.apply(this);
	return this;

	function init() {

		//console.log("v 104");

		// Init Events

		document.body.addEventListener('click', this.EVT.handleDocumentClick);
		this.DOM.menu.toggle.addEventListener('click', this.EVT.handleToggleClick);
		this.DOM.menu.signout.addEventListener('click', this.EVT.handleSignoutClick);

		// Init session memory

		this.API.getSessionData();

	}

	function api_getSessionData() {

		const ajax = new XMLHttpRequest();
		ajax.open('POST', '/api/session/check');
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send();

		ajax.onload = () => {

/*
			this.MEM.session = ajax.response;
*/
			let session = ajax.response;
			this.MEM.setSession( session );

			FolderWidget.API.init();
			SettingsProfile.API.renderForm( session );
/*
			for(let key in session ) {
				console.log(key+":"+session[key])
			}
*/
			this.DOM.menu.membername.textContent = session.membername;

		}

	}

	function api_getSessionMemory() {

		return this.MEM.session;

	}

	function evt_handleDocumentClick(evt) {

		let elem = evt.target;
		while(elem.parentNode) {
			
			switch(elem) {
			case this.DOM.menu.body:
			case this.DOM.menu.toggle:
				return;
				break;
			default:
				elem = elem.parentNode;
				break;
			}
		}

		this.DOM.menu.body.classList.remove("open");

	}

	function evt_handleToggleClick() {

		this.DOM.menu.body.classList.toggle("open");

	}

	function evt_handleSignoutClick() {

		window.location.href = "/api/session/logout";

	}

}).apply({});
