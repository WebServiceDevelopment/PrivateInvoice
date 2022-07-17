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

const SettingsInvite = (function() {

	this.MEM = {
		ready : false,
		setReady : (ready) => this.MEM.ready = ready,
        getReady : () => this.MEM.ready,
	}

	this.DOM = {
		form : {
			count : document.getElementById('SettingsInvite.form.count'),
			minutes : document.getElementById('SettingsInvite.form.minutes'),
			buyer : document.getElementById('SettingsInvite.form.buyer'),
			seller : document.getElementById('SettingsInvite.form.seller'),
			submit : document.getElementById('SettingsInvite.form.submit'),
			list: document.getElementById('SettingsInvite.form.list')
		}
	}

	this.EVT = {
		handleSubmitClick : evt_handleSubmitClick.bind(this),
		handleRemoveClick : evt_handleRemoveClick.bind(this)
	}

	this.API = {
		open : api_open.bind(this),
		getInviteList : api_getInviteList.bind(this),
		appendInvite : api_appendInvite.bind(this)
	}

	init.apply(this);
	return this;

	function init() {

		this.DOM.form.submit.addEventListener('click', this.EVT.handleSubmitClick);

	}

	function evt_handleRemoveClick(evt) {

		let elem = evt.target;
		while(elem.parentNode && elem.tagName !== "A") {
			elem = elem.parentNode;
		}

		let memberData = elem.memberData;
		if(!memberData) {
			return;
		}

		let params = {
			invite_code : memberData.code
		}

		const url = '/api/invite/remove';

		const ajax = new XMLHttpRequest();
		ajax.open('POST', url);
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(params));

		ajax.onload = () => {
			
			let element = memberData.li;
			element.parentNode.removeChild(element);

			console.log(ajax.response);

		}

	}

	function evt_handleSubmitClick() {

		const params = {
			count : this.DOM.form.count.value,
			minutes : this.DOM.form.minutes.value,
			buyer : this.DOM.form.buyer.checked ? 1 : 0,
			seller : this.DOM.form.seller.checked ? 1 : 0
		};

		if(!params.buyer && !params.seller) {
			return;
		}

		if(params.count === "unlimited") {
			params.count = null;
		}

		if(params.minutes === "unlimited") {
			params.minutes = null;
		}

		const url = '/api/invite/create';

		const ajax = new XMLHttpRequest();
		ajax.open('POST', url);
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(params));

		ajax.onload = () => {

			this.API.appendInvite(ajax.response.msg);

		}

	}

	function api_open() {

/*
		if(this.MEM.ready) {
			return;
		}
		
		this.MEM.ready = true;
*/
		if(this.MEM.getReady()) {
			return;
		}
		
		this.MEM.setReady( true );

		this.DOM.form.list.innerHTML = "";
		this.API.getInviteList();

	}

	function api_getInviteList() {

		const url = '/api/invite/list';

		const ajax = new XMLHttpRequest();
		ajax.open('POST', url);
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send();

		ajax.onload = () => {
			
			let res = ajax.response;
			console.log(res);

			if(res.err) {
				throw res.msg;
			}

			let list = res.msg;

			for(let i = 0; i < list.length; i++) {
				this.API.appendInvite(list[i]);
			}

		}

	}

	function api_appendInvite(invite) {

		console.log("render invite list");

		const li = document.createElement("li");
		const table = document.createElement("table");
		const row = table.insertRow();

		const link_cell = row.insertCell();
		const uses_cell = row.insertCell();
		const time_cell = row.insertCell();
		const remove_cell = row.insertCell();

		link_cell.setAttribute('class', 'link');
		uses_cell.setAttribute('class', 'uses');
		time_cell.setAttribute('class', 'expire');
		remove_cell.setAttribute('class', 'cancel');

		// First we create the link cell

		const outline = document.createElement("div");
		outline.setAttribute("class", "outline");

		const plane = document.createElement("i");
		const inbox = document.createElement("i");

		plane.setAttribute("class", "fab fa-telegram-plane");
		inbox.setAttribute("class", "fas fa-inbox");

		if(invite.rel_buyer) {
			plane.classList.add("ok");
		}

		if(invite.rel_seller) {
			inbox.classList.add("ok");
		}
		
		const input = document.createElement("input");
		input.setAttribute("readonly", "readonly");

		let str = "";
		str += location.protocol;
		str += "//";
		str += location.hostname;
		if(location.port !== 80) {
			str += ":" + location.port;
		}
		str += "/invite/?code=" + invite.invite_code;
		input.value = str;
		
		const button = document.createElement("button");
		button.setAttribute("data-clipboard-text",str);
		button.textContent = "Copy";
		const clipboard = new ClipboardJS(button);
		
		outline.appendChild(plane);
		outline.appendChild(inbox);
		outline.appendChild(input);
		outline.appendChild(button);
		link_cell.appendChild(outline);

		// Then we add the Uses Cell
		
		const a = document.createElement("a");
		const member = document.createElement("i");
		member.setAttribute("class", "fas fa-member");
		a.appendChild(member);

		const useCount = document.createTextNode(invite.use_count);
		a.appendChild(useCount);

		if(invite.max_count) {
			const maxCount = document.createTextNode(" / " + invite.max_count);
			a.appendChild(maxCount);
		} else {
			const maxCount = document.createTextNode(" / ∞");
			a.appendChild(maxCount);
		}

		uses_cell.appendChild(a);

		// Get Remaining Time

		const b = document.createElement("a");

		if(!invite.expires_on) {
		
			b.textContent = "∞";

		} else {
			
			const now = Date.now();
			let timezone = new Date().getTimezoneOffset();
			console.log(timezone);
			
			const gmt = new Date(invite.expires_on).getTime();
			const expires_on = gmt - (timezone * 60000);
			const diff = expires_on - now;

			const ONE_DAY = 86400000;
			const ONE_HOUR = 3600000;
			const ONE_MINUTE =  60000;

			if(now > expires_on) {
				b.textContent = "Expired";
			} else if(diff > ONE_DAY) {
				let count = Math.floor(diff / ONE_DAY);
				let units = count === 1 ? "day" : "days";
				b.textContent = count + " " + units;
			} else if (diff > ONE_HOUR) {
				let count = Math.floor(diff / ONE_HOUR);
				let units = count === 1 ? "hour" : "hours";
				b.textContent = count + " " + units;
			} else if(diff > ONE_MINUTE) {
				let count = Math.floor(diff / ONE_MINUTE);
				b.textContent = count + " min";
			} else {
				b.textContent = "< 1 min";
			}
			

		}

		time_cell.appendChild(b);

		// Cancel Button

		const c = document.createElement("a");
		const times = document.createElement("i");
		times.setAttribute("class", "fas fa-times");
		const node = document.createTextNode("Deactivate");
		c.appendChild(times);
		c.appendChild(node);
		remove_cell.appendChild(c);

		c.memberData = {
			code : invite.invite_code,
			li : li
		};
		c.addEventListener('click', this.EVT.handleRemoveClick);

		// Append Element To Form List

		li.appendChild(table);
		this.DOM.form.list.appendChild(li);

	}

}).apply({});
