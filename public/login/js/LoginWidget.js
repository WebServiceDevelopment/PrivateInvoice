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

const LoginWidget = (function() {

	this.MEM = {}

	this.DOM = {
		input : {
			membername : document.getElementById('LoginWidget.input.membername'),
			password : document.getElementById('LoginWidget.input.password')
		},
		submit : document.getElementById('LoginWidget.submit')
	}

	this.EVT = {
		handleSubmitClick : evt_handleSubmitClick.bind(this),
		handleInputFocus : evt_handleInputFocus.bind(this),
		handleInputBlur : evt_handleInputBlur.bind(this)
	}

	this.API = {
		checkInputs : api_checkInputs.bind(this),
		clearForm : api_clearForm.bind(this),
		handleSubmitClick : evt_handleSubmitClick.bind(this)
	}

	init.apply(this);
	return this;

	function init() {

		
		setTimeout( () => {
			this.API.checkInputs();
		}, 50);

		for(let key in this.DOM.input) {
			this.DOM.input[key].addEventListener('focus', this.EVT.handleInputFocus);
			this.DOM.input[key].addEventListener('blur', this.EVT.handleInputBlur);
		}

		this.DOM.submit.addEventListener('click', this.EVT.handleSubmitClick);

	}

	function evt_handleSubmitClick() {

		console.log("submit click!!");

		let args = {
			membername : this.DOM.input.membername.value,
			password : this.DOM.input.password.value
		};

		const ajax = new XMLHttpRequest();
		ajax.open('POST', '/api/session/login');
		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(args));

		ajax.onload = () => {
			
			let res = ajax.response;

			if(res.err) {
				return alert(res.msg);
			}

			window.location.href = "/app/";

		}

	}

	function api_checkInputs() {

		// We go through each of the inputs and check if
		// they have a value or not

		for(let key in this.DOM.input) {

			let val = this.DOM.input[key].value;
			let node = this.DOM.input[key].parentNode;
			
			if(val.replace(/\s/g, '').length === 0) {
				this.DOM.input[key].value = "";
				node.classList.remove("fill");
			} else {
				node.classList.add("fill");
			}


		}

	}

	function evt_handleInputFocus(evt) {

		let elem = evt.target;
		let node = elem.parentNode;

		node.classList.add("focus");

	}

	function evt_handleInputBlur(evt) {

		let elem = evt.target;
		let node = elem.parentNode;

		node.classList.remove("focus");
		this.API.checkInputs();

	}

	function api_clearForm() {

		this.DOM.input.membername.value = "";
		this.DOM.input.password.value = "";

	}

}).apply({});
