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


const ToolsetWidget = (function() {

	const LIST_MAX = 20;

	this.MEM = {}

	this.DOM = {
		DownloadJSON : document.getElementById('Toolset.DownloadJSON'),
	}

	this.EVT = {
		download_json		: evt_download_json.bind(this),
	}

	this.API = {
	}

	init.apply(this);

	return this;

	function init() {

		this.DOM.DownloadJSON.addEventListener('click', this.EVT.download_json);

	}
		

/*
 * evt_download_json
 */
	function evt_download_json(e) {

		const elm = e.target;

		const doc = Traceability.API.getCredentialSubject();
		if(doc.customerReferenceNumber == "") {
			alert("Document is not selected.");
			return;
		}

		const filename =  doc.customerReferenceNumber+'.json';

		const blob = new Blob([JSON.stringify(doc, null,JSON_SPACE_LENGTH)], {type : 'application/json'});
        saveAs(blob, filename);

	}

}).apply({});
