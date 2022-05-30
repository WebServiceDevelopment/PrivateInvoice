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

const DocumentWidget = (function() {

	this.MEM = {
		timeout : 2000,
		getTimeout : () => this.MEM.timeout,

		saveTimeout : null,
		getSaveTimeout : () => this.MEM.saveTimeout,
		setSaveTimeout : (timeout) => this.MEM.saveTimeout = timeout,
		initSaveTimeout : () => { clearTimeout(this.MEM.saveTimeout); this.MEM.saveTimeout = null},

		document : null,
		getDocument : () => this.MEM.document,
		setDocument : (document) => this.MEM.document = document,

		focus : null,
		getFocus : () => this.MEM.focus,
		setFocus : (focus) => this.MEM.focus = focus,
		initFocus : () => this.MEM.focus = null,

		currency_options : {
			"formatWithSymbol" : true,
			"symbol" : "Gwei",
			"separator" : ",",
			"decimal" : ".",
			"precision" : 0,
			"pattern" : "# !"
		},
	};

	this.DOM = {

		meta : {
			document_number : document.getElementById('DocumentWidget.meta.document_number'),
			created_on : document.getElementById('DocumentWidget.meta.created_on'), 
			taxId : document.getElementById('DocumentWidget.meta.taxId'),
			due_by : document.getElementById('DocumentWidget.meta.due_by'),
		},

		label : {
			doc_type : document.getElementById('DocumentWidget.label.doc_type'),
			due_by : document.getElementById('DocumentWidget.label.due_by'),
			bill_to : document.getElementById('DocumentWidget.label.bill_to'),
			created_on : document.getElementById('DocumentWidget.label.created_on'),
			to_from : document.getElementById('DocumentWidget.label.to_from'),
		},

		from : {
			organization_name : document.getElementById('DocumentWidget.from.organization_name'),
			organization_address : document.getElementById('DocumentWidget.from.organization_address'),
			organization_building : document.getElementById('DocumentWidget.from.organization_building'),
			organization_department : document.getElementById('DocumentWidget.from.organization_department')
		},

		to : {
			organization_name : document.getElementById('DocumentWidget.to.organization_name'),
			organization_address : document.getElementById('DocumentWidget.to.organization_address'),
			organization_building : document.getElementById('DocumentWidget.to.organization_building'),
			organization_department : document.getElementById('DocumentWidget.to.organization_department')
		},

		inputs : {
			subject : document.getElementById('DocumentWidget.inputs.subject'),
			body : document.getElementById('DocumentWidget.inputs.body'),
			save : document.getElementById('DocumentWidget.inputs.save'),
			dragarea : document.getElementById('DocumentWidget.inputs.dragarea'),

			getSubject : () =>  this.DOM.inputs.subject.value,

		},

		textarea : {
			comments :  document.getElementById('DocumentWidget.textarea.comments'),
		},

		contact : {
			input : document.getElementById('ContactWidget.input'),
		},

		totals : {
			table : document.getElementById('DocumentWidget.totals.table'),
			subtotal : document.getElementById('DocumentWidget.totals.subtotal'),
			total : document.getElementById('DocumentWidget.totals.total'),
			details : document.getElementById('DocumentWidget.totals.details'),
			display : document.getElementById('DocumentWidget.totals.display'),
		}
	};


	this.EVT = {
		handleSubjectInput		: evt_handleSubjectInput.bind(this),
		handleDocumentResize	: evt_handleDocumentResize.bind(this),
		handleTextChange		: evt_handleTextChange.bind(this),
		handleNumberChange		: evt_handleNumberChange.bind(this),
		handleNumberBlur		: evt_handleNumberBlur.bind(this),
		handleInputFocus		: evt_handleInputFocus.bind(this),
		handleInputBlur			: evt_handleInputBlur.bind(this),
		handleDueChange			: evt_handleDueChange.bind(this),
		handleFileDrop			: evt_handleFileDrop.bind(this),
		handleDragEnter			: evt_handleDragEnter.bind(this),
		handleDragLeave			: evt_handleDragLeave.bind(this),
		handleSaveClick			: evt_handleSaveClick.bind(this),
		handleComments			: evt_handleComments.bind(this),
	};

	this.API = {
		openDocument			: api_openDocument.bind(this),
		renderDocument			: api_renderDocument.bind(this),
		renderDocumentBody		: api_renderDocumentBody.bind(this),
		updateShimHeight		: api_updateShimHeight.bind(this),
		triggerSavePoint		: api_triggerSavePoint.bind(this),
		updateDocument			: api_updateDocument.bind(this),
		updateTotals			: api_updateTotals.bind(this),
		renderTotals			: api_renderTotals.bind(this),
		readFileAsync			: api_readFileAsync.bind(this),
		updateToInfo			: api_updateToInfo.bind(this),
		clearDocument			: api_clearDocument.bind(this),
		checkInvoiceSendable	: api_checkInvoiceSendable.bind(this),
		getDocument				: api_getDocument.bind(this),
		setTo_from				: api_setTo_from.bind(this),
		checkSaveTimeout		: api_checkSaveTimeout.bind(this),
		readOnly				: api_readOnly.bind(this),
		renderComments			: api_renderComments.bind(this),
		getCurrencyOptions		: api_getCurrencyOptions.bind(this),
	};

	this.ATTR = {
		removeAttribute : attr_removeAttribute.bind(this),
		setAttribute : attr_setAttribute.bind(this),
	}

	init.apply(this);
	return this;

	

	function api_readOnly () {
		this.DOM.inputs.subject.setAttribute("readonly", "readonly");
		this.DOM.contact.input.setAttribute("readonly", "readonly");
	}

	function init() {

		this.DOM.inputs.subject.addEventListener('input', this.EVT.handleSubjectInput);
		this.API.clearDocument();

		setTimeout( () => {
			this.API.updateShimHeight();
		}, 50);

		window.addEventListener('resize', this.EVT.handleDocumentResize);

		// for inputs
		this.DOM.inputs.save.setAttribute("disabled", "disabled");

		this.DOM.inputs.dragarea.addEventListener('drop', this.EVT.handleFileDrop);
		this.DOM.inputs.dragarea.addEventListener('dragenter', this.EVT.handleDragEnter);
		this.DOM.inputs.dragarea.addEventListener('dragleave', this.EVT.handleDragLeave);
		this.DOM.inputs.save.addEventListener('click', this.EVT.handleSaveClick);

		// for comments
		this.DOM.textarea.comments.addEventListener('blur', this.EVT.handleComments);
		this.DOM.textarea.comments.addEventListener('input', this.EVT.handleComments);

		this.API.readOnly ();


	}

    function api_checkSaveTimeout() {
        return (this.MEM.getSaveTimeout() == null) ? true : false;
    }

/*
 * add 20220406 k.ogawa
 *
*/
	function api_setTo_from (role) {
		let to_from;

		//console.log("role="+role);

		switch(role) {
		case 'seller':
			to_from = "To";
		break;
		case 'buyer':
			to_from = "From";
		break;
		default:
			to_from = "";
		break;
		}

		this.DOM.label.to_from.innerText = to_from;
	}

	function api_getDocument() {

		return this.MEM.document;

	}

/*
 * 20220405 add 
 * Add judgment
 * (1) this.DOM.contact.input.value
 * (2) this.DOM.to.organization_name.value
 * call [Send] button
*/
	function api_checkInvoiceSendable() {

		let document_json = Traceability.API.getCredentialSubject();

		if(!document_json.buyer.name) {
			return "NO CLIENT : buyer name";
		}

		if(this.DOM.contact.input.value == "") {
			return "NO CLIENT : to";
		}

		if(this.DOM.to.organization_name.value == "") {
			return "NO CLIENT : organization_name";
		}

		if(this.MEM.getSaveTimeout()) {
			clearTimeout(this.MEM.getSaveTimeout());
			this.MEM.initSaveTimeout();
		}

		return null;

	}

	async function evt_handleSaveClick() {
		console.log("handleSaveClick");

		if(this.MEM.getSaveTimeout()) {
			clearTimeout(this.MEM.getSaveTimeout());
			this.MEM.initSaveTimeout();
		}
		
		ActionWidget.DOM.invoice.sendInvoiceDisabled();
		await this.API.updateDocument();

	}

	function api_clearDocument() {

		// When we clear the document, we pretty much render an empty document
		// so we set the default data to a null document and then call the 
		// respective clear functions

		this.MEM.document = {
			document_meta : {
				created_on : "",
				taxId : "",
				due_by : ""
			},
			document_totals : {
				subtotal : "",
				total : "",
			},
			document_body : new Array(10)
		}

		this.API.renderDocument();

		setTimeout( function () {
			this.API.renderDocumentBody();
			this.API.renderTotals();
			this.API.renderComments();
		}.bind(this), 100);

		ContactWidget.API.clearAddress();
		ActionWidget.API.closePanel();

		let f = this.ATTR.setAttribute;

		f( this.DOM.inputs.subject );
		f( this.DOM.contact.input );

		f( this.DOM.from.organization_name );
		f( this.DOM.from.organization_address );
		f( this.DOM.from.organization_building );
		f( this.DOM.from.organization_department );

		f( this.DOM.to.organization_name );
		f( this.DOM.to.organization_address );
		f( this.DOM.to.organization_building );
		f( this.DOM.to.organization_department );
	}

	function api_updateToInfo(memberData) {
		
		if(memberData) {
			this.MEM.document.buyer_uuid = memberData.member_uuid;

			this.DOM.to.organization_name.value = memberData.organization_name || "";
			this.DOM.to.organization_address.value = memberData.organization_address || "";
			this.DOM.to.organization_building.value = memberData.organization_building || "";
			this.DOM.to.organization_department.value = memberData.organization_department || "";
		} else {
			this.MEM.document.buyer_uuid = null;
			this.DOM.to.organization_name.value = "";
			this.DOM.to.organization_address.value = "";
			this.DOM.to.organization_building.value = "";
			this.DOM.to.organization_department.value = "";
		}

		//this.MEM.document.buyer_details = memberData;
		this.MEM.document.buyer_details = memberData;

		let doc = this.MEM.document;
		for(let key in doc) {
			console.log(key +"="+doc[key]);
		}

		this.API.triggerSavePoint();

	}

	function evt_handleDragEnter(evt) {

		evt.stopPropagation(); 
		evt.preventDefault();

        const elem = FolderWidget.MEM.getActiveFolder();
		if( elem != null) {
			const folder = elem.getAttribute("data-folder");
			if(folder != "draft") {
				return;
			}
		}

		this.DOM.inputs.dragarea.classList.add("drag-over");

	}

	function evt_handleDragLeave(evt) {

		evt.stopPropagation(); 
		evt.preventDefault();

        const elem =  FolderWidget.MEM.getActiveFolder();
		if(elem != null) {
			const folder = elem.getAttribute("data-folder");
			if(folder != "draft") {
				return;
			}
		}
		
		this.DOM.inputs.dragarea.classList.remove("drag-over");

	}

	function api_readFileAsync(file) {

		return new Promise( (resolve, reject) => {
		
			const reader = new FileReader();

			reader.onload = (evt) => {
				
				const data = new Uint8Array(evt.target.result);
				resolve(data);

			}

			reader.onerror = (evt) => {
				
				reader.abort();
				reject();

			}

			reader.readAsArrayBuffer(file);

		});

	}

	async function evt_handleFileDrop(evt) {

		evt.stopPropagation(); 
		evt.preventDefault();

        const elem =  FolderWidget.MEM.getActiveFolder();
		if(elem != null) {
			const folder = elem.getAttribute("data-folder");
			if(folder != "draft") {
				return;
			}
		}
		
		this.DOM.inputs.dragarea.classList.remove("drag-over");
		const supported = ["xls", "xlsx"];

		let files = evt.dataTransfer.files;
		for(let i = 0; i < files.length; i++) {
			let file = files[i];
			let ext = file.name.split(".").pop();

			if(supported.indexOf(ext.toLowerCase()) === -1) {
				continue;
			}

			let data;
			try {
				data = await this.API.readFileAsync(file);
			} catch(err) {
				continue
			}

			let workbook = XLSX.read(data, {type: 'array'});
			workbook.SheetNames.forEach(sheetName => {

				const sheet = workbook.Sheets[sheetName];
				const rows = XLSX.utils.sheet_to_row_object_array(sheet);

				if(!rows.length) {
					return;
				}

				// Then we need to find the last empty slot 
				
				let index = this.MEM.document.document_body.length;
				while(index > 0) {
					let elem = this.MEM.document.document_body[index - 1];
					let len = 0;
					for(let key in elem) {
						len += elem[key].toString().length;
					}
					
					if(len) {
						break;
					}
					index--;
				}
				
				let full_len = (index + rows.length);
				let rounded = Math.ceil(full_len / 5) * 5;
				let diff = rounded - this.MEM.document.document_body.length;
				for(let i = 0; i < diff; i++) {
					this.MEM.document.document_body.push({
						date : "",
						desc : "",
/* 20220410 delete
						sales_tax : "",
*/
						quan : "",
						unit : "",
						price : "",
						subtotal : ""
					});
				}
			
				const opts = this.API.getCurrencyOptions();

				for(let i = 0; i < rows.length; i++) {
					let row = rows[i];
					let item = this.MEM.document.document_body[index + i];

					if(row.Date) {
						let conv = XLSX.SSF.parse_date_code(row.Date);

						let m = conv.m.toString();
						if(m.length < 2) {
							m = "0" + m;
						}

						let d = conv.d.toString();
						if(d.length < 2) {
							d = "0" + s;
						}
						item.date = [conv.y, m, d].join("-");
					}

					item.desc = row.Description || "";
/* 20220410 del
					item.sales_tax = row.Tax || "";
*/
					item.unit = row.Unit || "";

					if(row.Quantity) {
						item.quan = row.Quantity.toString();
					}

					if(row.Price) {
						item.price = currency(row.Price, opts).format(true);
					}

					if(row.Price && row.Quantity) {
						item.subtotal = currency(row.Price, opts).multiply(row.Quantity).format(true);
					}
					
				}

			});

		}
		
		this.API.triggerSavePoint();
		this.API.renderDocumentBody();
		this.API.updateTotals();

	}

	function evt_handleDueChange(evt) {

		let elem = evt.target;
		this.MEM.document.document_meta.due_by = elem.value;
		TrayWidget.API.updateDueDate(elem.value);
		this.API.triggerSavePoint();

	}

	function api_renderTotals() {

		this.DOM.totals.table.innerHTML = '';
		
		let row, label, value;

		// Subtotal
		
		//console.log(this.DOM.totals.table);
		row = this.DOM.totals.table.insertRow();

		label = row.insertCell();
		value = row.insertCell();
		label.setAttribute('class', 'label');
		value.setAttribute('class', 'value');

		label.textContent = 'Subtotal';
		value.textContent = this.MEM.document.document_totals.subtotal;

		// Sales Tax

/* 20220410 del
		this.MEM.document.document_totals.sales_tax_details.sort( (a, b) => {
			return a.percent - b.percent;
		});

		this.MEM.document.document_totals.sales_tax_details.forEach( detail => {

			row = this.DOM.totals.table.insertRow();

			label = row.insertCell();
			value = row.insertCell();
			label.setAttribute('class', 'label');
			value.setAttribute('class', 'value');

			label.textContent = 'Sales Tax ('+detail.percent+'%)';
			value.textContent = detail.tax_val;

		});
*/

		// Totals

		row = this.DOM.totals.table.insertRow();

		label = row.insertCell();
		value = row.insertCell();
		label.setAttribute('class', 'label');
		value.setAttribute('class', 'value');

		label.textContent = 'Total';
		value.textContent = this.MEM.document.document_totals.total;
		this.DOM.totals.display.textContent = this.MEM.document.document_totals.total;

		// Subtotals

		this.DOM.totals.subtotal.textContent = this.MEM.document.document_totals.subtotal;

		// Sales tax

/* 20220410 del
		this.DOM.totals.sales_tax.textContent = this.MEM.document.document_totals.sales_tax;
*/

		// Totals

		this.DOM.totals.total.textContent = this.MEM.document.document_totals.total;

		// Sales tax Details

		const table = document.createElement("table");
		//let row, a, b, c, d;

/* 20220410 del
		this.MEM.document.document_totals.sales_tax_details.forEach( detail => {

			row = table.insertRow();
			a = row.insertCell();
			b = row.insertCell();
			c = row.insertCell();
			d = row.insertCell();
			a.setAttribute("class", "label_a");
			b.setAttribute("class", "value_a");
			c.setAttribute("class", "label_b");
			d.setAttribute("class", "value_b");

			a.textContent = detail.percent + "% subtotal";
			b.textContent = detail.subtotal;
			c.textContent = detail.percent + "% sales tax";
			d.textContent = detail.tax_val;

		});
*/

		// Replace existing table

		let child = this.DOM.totals.details.children[0];

		if(child) {
			this.DOM.totals.details.replaceChild(table, child);
		} else {
			this.DOM.totals.details.appendChild(table);
		}

		this.DOM.totals.display.textContent = this.MEM.document.document_totals.total;

	}

/*
 * 20200410 del
	function evt_handleTaxFocus(evt) {

		const elem = evt.target;
		const memberData = elem.memberData;
		if(!memberData) {
			return;
		}
		

		if(memberData.dom.tax.value.length) {
			return;
		}

		

		memberData.dom.tax.value = this.MEM.document.default_sales_tax;
		memberData.data.sales_tax = memberData.dom.tax.value;


	}
*/

	function evt_handleInputFocus(evt) {
		
		let elem = evt.target;

		while(elem.parentNode && elem.tagName !== "TD") {
			elem = elem.parentNode;
		}

		if(elem.tagName !== "TD") {
			return;
		}

		if(this.MEM.getFocus()) {
			this.MEM.getFocus().classList.remove("focus");
		}

		elem.classList.add("focus");
		this.MEM.setFocus( elem );

	}

	function evt_handleInputBlur(evt) {
		
		this.MEM.focus.classList.remove("focus");

	}

	function evt_handleNumberBlur(evt) {

		const elem = evt.target;
		const memberData = elem.memberData;
		if(!memberData) {
			return;
		}
		
		const opts = this.API.getCurrencyOptions();

		const c = currency(memberData.dom.price.value, opts);
		memberData.dom.price.value = c.format(true);

	}

	function api_updateTotals() {
		
		const opts = this.API.getCurrencyOptions();
		
		const totals = {
			subtotal : currency(0, opts),
			total : currency(0, opts),
/* 20220410 del
			sales_tax : currency(0, opts),
			sales_tax_details : []
*/
		};

		this.MEM.items.forEach( memberData => {
			
			const dom = memberData.dom;
			const data = memberData.data;

			if(!data.quan.length || !data.price.length) {
				dom.subtotal.value = "";
				data.subtotal = "";
			} else {
				const c = currency(data.price, opts).multiply(data.quan);
				data.subtotal = c.format(true);
				totals.subtotal = totals.subtotal.add(data.subtotal);
				dom.subtotal.value = data.subtotal;
				
				// then we need to separate by tax percent
				/* 20220410 del
				let percent = data.sales_tax;
				let found = false;
				for(let i = 0; i < totals.sales_tax_details.length; i++) {
					if(totals.sales_tax_details[i].percent !== percent) {
						continue;
					}
					
					found = true;

					const sb = totals.sales_tax_details[i].subtotal;
					totals.sales_tax_details[i].subtotal = sb.add(data.subtotal);
				}

				if(found) {
					return;
				}

				totals.sales_tax_details.push({
					percent : percent,
					subtotal : currency(data.subtotal, opts),
					tax_val : null
				})
				*/

			}

		});
		
		// Then we calculate sales tax
		
		/* 20220410 del
		totals.sales_tax_details.forEach( detail => {
			
			let decimal = parseFloat(detail.percent) / 100;
			detail.tax_val = detail.subtotal.multiply(decimal).format(true);
			detail.subtotal = detail.subtotal.format(true);
			totals.sales_tax = totals.sales_tax.add(detail.tax_val);

		});
		*/
		
		totals.total = totals.subtotal.add(totals.sales_tax);

		totals.subtotal = totals.subtotal.format(true);

/* 20220410 del 
		totals.sales_tax = totals.sales_tax.format(true);
*/
		totals.total = totals.total.format(true);
		//console.log("totals.total"+totals.total);

		TrayWidget.API.updateSelectTotal(totals.total);

		this.MEM.document.document_totals = totals;

		setTimeout( function () {
			this.API.renderTotals();
			this.API.renderComments();
		}.bind(this), 20);

	}

	function evt_handleTextChange(evt) {
		console.log("evt_handleTextChange");

		const elem = evt.target;
		const memberData = elem.memberData;
		if(!memberData) {
			return;
		}

		memberData.data.date = memberData.dom.date.value;
		memberData.data.desc = memberData.dom.desc.value;
		memberData.data.unit = memberData.dom.unit.value;

		this.API.triggerSavePoint();

	}

	function evt_handleNumberChange(evt) {

		const elem = evt.target;
		const memberData = elem.memberData;
		if(!memberData) {
			return;
		}
		
		// 20220524
		const opts = this.API.getCurrencyOptions();

/*
*		memberData.data.sales_tax = memberData.dom.tax.value;
*/
		memberData.data.quan = memberData.dom.quan.value;
		memberData.data.price = currency(memberData.dom.price.value, opts).format(true);

		console.log("memberData.data.price="+memberData.data.price) 

		this.API.triggerSavePoint();
		this.API.updateTotals();

	}

/*
 *
*/
	function api_updateDocument() {
		//console.trace();
		//console.log(JSON.stringify(this.MEM.document.buyer_details));

		Traceability.API.setSign(this.MEM.document);

		//debugger;

		this.DOM.inputs.save.setAttribute("disabled", "disabled");

		const document_json = Traceability.API.getCredential();
		document_json.credentialSubject = Traceability.API.getCredentialSubject();

		const param = {
			document_uuid : this.MEM.document.document_uuid,
			document_body : this.MEM.document.document_body,
			document_totals : this.MEM.document.document_totals,
			document_meta : this.MEM.document.document_meta,
			subject_line : this.MEM.document.subject_line,
			buyer_details : this.MEM.document.buyer_details,
			document_json : document_json,
		}

		const ajax = new XMLHttpRequest();
		ajax.open('POST', '/api/invoice/update');

		ajax.setRequestHeader('Content-Type', 'application/json');
		ajax.responseType = "json";
		ajax.send(JSON.stringify(param));

		ajax.onload = () => {
			
			ActionWidget.DOM.invoice.sendInvoiceEnabled();
			//console.log(ajax.response);

		}

	}

	function api_triggerSavePoint() {

		if(this.MEM.getSaveTimeout()) {
			clearTimeout(this.MEM.getSaveTimeout());
			this.MEM.initSaveTimeout();
		}
		
		this.DOM.inputs.save.removeAttribute("disabled");

		ActionWidget.DOM.invoice.sendInvoiceDisabled();

		let timeout = setTimeout(this.API.updateDocument, this.MEM.getTimeout());
		this.MEM.setSaveTimeout( timeout );

	}

	function evt_handleDocumentResize() {
		
		this.API.updateShimHeight();

	}

	function api_updateShimHeight() {
		
		/*
		let height = this.DOM.inputs.body.offsetHeight;
		this.MEM.items.forEach(item => {
			let shim = item.dom.shim;
			autosize.update(item.dom.desc);
			shim.style.minHeight = ((height-9) / 10) + "px";
		});
		*/

	}

	function api_renderDocumentBody() {

		this.MEM.items = [];
		
		let no = 0;
/*
		this.MEM.focus = null;
*/
		this.MEM.initFocus();

		this.DOM.inputs.body.innerHTML = "";
		if(this.MEM.document.document_body == null) {
			return;
		}

		for(let i = 0; i < this.MEM.document.document_body.length; i++) {
			
			let item = this.MEM.document.document_body[i] || {};

			no++;
			const li = document.createElement("li");
			const table_a = document.createElement("table");
			const row_a = table_a.insertRow();

			//const px_cell = row_a.insertCell();
			const no_cell = row_a.insertCell();
			const date_cell = row_a.insertCell();
			const desc_cell = row_a.insertCell();
/* 20220410
			const tax_cell = row_a.insertCell();
*/
			const price_cell = row_a.insertCell();
			const quan_cell = row_a.insertCell();
			const unit_cell = row_a.insertCell();
			const subtotal_cell = row_a.insertCell();

			//px_cell.setAttribute("class", "px");
			no_cell.setAttribute("class", "no");
			date_cell.setAttribute("class", "date");
			desc_cell.setAttribute("class", "desc");

/* 20220410
			tax_cell.setAttribute("class", "tax");
*/
			quan_cell.setAttribute("class", "quan");
			unit_cell.setAttribute("class", "unit");
			price_cell.setAttribute("class", "price");
			subtotal_cell.setAttribute("class", "subtotal");

			/*
			const shim = document.createElement("div");
			shim.setAttribute("class", "tbody-shim");
			px_cell.appendChild(shim);
			*/

			let num = no.toString();
			while(num.length < 3) {
				num = "0" + num;
			}
			no_cell.textContent = num;

			const date_input = document.createElement("input");
			date_input.setAttribute("type", "text");
			date_input.setAttribute("placeholder", "yyyy-mm-dd");
			date_cell.appendChild(date_input);
			date_input.value = item.date || "";

			const textarea = document.createElement("textarea");
			textarea.setAttribute("placeholder", "Description");
			desc_cell.appendChild(textarea);
			textarea.value = item.desc || "";

/* 20220410 del
			const percent_div = document.createElement("div");
			percent_div.setAttribute("class", "percent");
			const percent_input = document.createElement("input");
			percent_input.setAttribute("type", "text");
			percent_input.value = item.sales_tax || "";
			percent_div.appendChild(percent_input);
			tax_cell.appendChild(percent_div);
*/

			const quan_input = document.createElement("input");
			quan_input.setAttribute("type", "text");
			quan_input.setAttribute("placeholder", "Quan");
			quan_cell.appendChild(quan_input);
			quan_input.value = item.quan || "";

			const unit_input = document.createElement("input");
			unit_input.setAttribute("type", "text");
			unit_input.setAttribute("placeholder", "Unit");
			unit_cell.appendChild(unit_input);
			unit_input.value = item.unit || "";

			const price_input = document.createElement("input");
			price_input.setAttribute("type", "text");
			price_input.setAttribute("placeholder", "Price");
			price_cell.appendChild(price_input);
			price_input.value = item.price || "";

			const subtotal_input = document.createElement("input");
			subtotal_input.setAttribute("type", "text");
			subtotal_input.setAttribute("readonly", "readonly");
			subtotal_input.setAttribute("placeholder", "Subtotal");
			subtotal_cell.appendChild(subtotal_input);
			subtotal_input.value = item.subtotal || "";

			li.appendChild(table_a);
			this.DOM.inputs.body.appendChild(li);

			const memberData = {
				data : item,
				dom : {
					// shim : shim,
					date : date_input,
					desc : textarea,
					quan : quan_input,
					unit : unit_input,
					price : price_input,
					subtotal : subtotal_input
				}
			};
			
			for(let key in memberData.dom) {
				if(key === "shim") {
					continue;
				}
				memberData.dom[key].memberData = memberData;
			}

			date_input.addEventListener('input', this.EVT.handleTextChange);
			textarea.addEventListener('input', this.EVT.handleTextChange);
			quan_input.addEventListener('input', this.EVT.handleNumberChange);
			unit_input.addEventListener('input', this.EVT.handleTextChange);
			price_input.addEventListener('input', this.EVT.handleNumberChange);
			price_input.addEventListener('blur', this.EVT.handleNumberBlur);
			
			date_input.addEventListener('focus', this.EVT.handleInputFocus);
			textarea.addEventListener('focus', this.EVT.handleInputFocus);
			quan_input.addEventListener('focus', this.EVT.handleInputFocus);
			unit_input.addEventListener('focus', this.EVT.handleInputFocus);
			price_input.addEventListener('focus', this.EVT.handleInputFocus);
			
			date_input.addEventListener('blur', this.EVT.handleInputBlur);
			textarea.addEventListener('blur', this.EVT.handleInputBlur);
			quan_input.addEventListener('blur', this.EVT.handleInputBlur);
			unit_input.addEventListener('blur', this.EVT.handleInputBlur);
			price_input.addEventListener('blur', this.EVT.handleInputBlur);


			const elem =  FolderWidget.MEM.getActiveFolder();
			if( elem != null) {
				const folder = elem.getAttribute("data-folder");
				//console.log("folder ="+folder);
				if(folder == "draft") {
					flatpickr(date_input, {});
					autosize(textarea);
					subtotal_input.setAttribute("readonly", "readonly");
					subtotal_input.setAttribute("disabled", "disabled");
				} else {
					date_input.setAttribute("readonly", "readonly");
					textarea.setAttribute("readonly", "readonly");
					quan_input.setAttribute("readonly", "readonly");
					unit_input.setAttribute("readonly", "readonly");
					price_input.setAttribute("readonly", "readonly");
					subtotal_input.setAttribute("readonly", "readonly");

					date_input.setAttribute("disabled", "disabled");
					textarea.setAttribute("disabled", "disabled");
					quan_input.setAttribute("disabled", "disabled");
					unit_input.setAttribute("disabled", "disabled");
					price_input.setAttribute("disabled", "disabled");
					subtotal_input.setAttribute("disabled", "disabled");
				}
			}

			this.MEM.items.push(memberData);

		}
		
		this.API.updateShimHeight();

	}

	function evt_handleSubjectInput(evt) {

		let txt = this.DOM.inputs.subject.value;
		TrayWidget.API.updateSelectSubject(txt);
		this.MEM.document.subject_line = txt;
		this.API.triggerSavePoint();

	}

async	function api_openDocument(document_uuid, role, folder, archive) {

		if(this.MEM.getSaveTimeout()) {
			clearTimeout(this.MEM.getSaveTimeout());
			this.MEM.initSaveTimeout();

			ActionWidget.DOM.invoice.sendInvoiceDisabled();
			this.API.updateDocument();
		}

		const params = {
			document_uuid : document_uuid
		}


		let PATH;
		let ROLE;

        switch(role) {
        case 'seller':
            ROLE = 'Seller';
        break;
        case 'buyer':
            ROLE = 'Buyer';
        break;
        default:
            return;
        }

		switch(folder) {
		case 'draft':
			PATH = '/api/invoice/getDraftDocument';
		break;
		case 'paid':
			if(archive == 0) {
				PATH = '/api/invoice/getDocument'+ROLE;
			} else {
				PATH = '/api/invoice/getArchiveDocument'+ROLE;
			}
		break;
		case 'trash':
			PATH = '/api/invoice/getArchiveDocument'+ROLE;
		break;
		default:
			PATH = '/api/invoice/getDocument'+ROLE;
		break;
		}

		let url = PATH;

        let response;

        let opts = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        };

        try {
            response = await fetch( url, opts);
        } catch(err) {
            //throw err;
            alert("Cannot connect server.");
            return;
        }

        if(response == 'ERR_CONNECTION_REFUSED') {
            alert("Cannot connect server.");
            return;
        }

        let res;
        try {
            res = await response.json();
        } catch(err) {
            //throw err;
            alert("Responce Document Data Error.");
            return;
        }

		//console.log("openDocument");

		Traceability.API.setCredential (res.msg.document_json);

		Traceability.API.setCredentialSubject(res.msg.document_json.credentialSubject);
/*
 *
 * Traceability.API.getSign (res.msg)
 *
 * Add buyer_uuid and buyer_membername information to 
 * this.MEM.document.buyer_details
 *
 * If buyer_uuid and buyer_membername information is insufficient,
 * Send operation will result in an error.
 */
		let doc =  Traceability.API.getSign (res.msg);

		this.MEM.document = doc;
	
		this.API.renderDocument();
		this.API.renderDocumentBody();
		this.API.renderTotals();
		this.API.renderComments();

		// Render the contact name

		ContactWidget.API.setAddress(this.MEM.document);
		ActionWidget.API.openPanel(this.MEM.document);

		return;
	}

	function api_renderComments () {
		if(this.MEM.document.comments == null) {
			this.DOM.textarea.comments.value = "";
			return;
		}
	
		this.DOM.textarea.comments.value = this.MEM.document.comments;
	}


	function api_getCurrencyOptions () {
		return Object.assign({}, this.MEM.currency_options);
	}


	function api_renderDocument() {
	
		// First we render the meta

		//console.log(this.MEM.document);

		switch(this.MEM.document.document_type) {
		case 'quote':
			
			this.DOM.label.doc_type.textContent = 'Quote';
			this.DOM.label.due_by.textContent = 'Valid Until';
			this.DOM.label.bill_to.setAttribute('data-text', 'Quote To');

			break;
		case 'order':
			
			this.DOM.label.doc_type.textContent = 'Purchase Order';
			this.DOM.label.due_by.textContent = 'Valid Until';
			this.DOM.label.bill_to.setAttribute('data-text', 'Purchase From');

			break;
		case 'proof':
			
			this.DOM.label.doc_type.textContent = 'Delivery Notice';
			this.DOM.label.due_by.textContent = 'Valid Until';
			this.DOM.label.bill_to.setAttribute('data-text', 'Bill To');

			break;
		case 'invoice':

			this.DOM.label.doc_type.textContent = 'Invoice';
			this.DOM.label.due_by.textContent = 'Due By';
			this.DOM.label.bill_to.setAttribute('data-text', 'Bill To');

			break;
		}



		if(this.MEM.document.document_meta.document_number== null) {
// 
// If the number of corresponding Folders is 0, it will be null.
//
			//console.log("Info: this.MEM.document.document_meta.document_number is null.");
		} else {

			this.DOM.meta.document_number.textContent = this.MEM.document.document_meta.document_number;
			this.DOM.meta.created_on.textContent = this.MEM.document.document_meta.created_on;

			this.DOM.meta.taxId.textContent = this.MEM.document.document_meta.taxId;
			let document_meta = this.MEM.document.document_meta;
			for(let key in document_meta) {
				console.log(key +"="+document_meta[key]);
			}

			this.DOM.meta.due_by.textContent = "";

			let due_input = document.createElement("input");
			due_input.setAttribute("type", "text");
			this.DOM.meta.due_by.appendChild(due_input);
			due_input.addEventListener('change', this.EVT.handleDueChange);
	

			if( this.MEM.document!= null) {
				if( this.MEM.document.document_meta != null) {
					due_input.value = this.MEM.document.document_meta.due_by;
				}
			}
			flatpickr(due_input, {});
		}


		// Then we render the to / from areas
		
		if(this.MEM.document.document_type === 'order') {

			let sd = this.MEM.document.seller_details;
			this.DOM.to.organization_name.value = sd.organization_name;
			this.DOM.to.organization_address.value = sd.organization_address;
			this.DOM.to.organization_building.value = sd.organization_building;
			this.DOM.to.organization_department.value = sd.organization_department;
				
			let cd = this.MEM.document.buyer_details;
			this.DOM.from.organization_name.value = cd.organization_name || "";
			this.DOM.from.organization_address.value = cd.organization_address || "";
			this.DOM.from.organization_building.value = cd.organization_building || "";
			this.DOM.from.organization_department.value = cd.organization_department || "";

		} else {

			if(this.MEM.document.seller_details) {

				let sd = this.MEM.document.seller_details;
				this.DOM.from.organization_name.value = sd.organization_name;
				this.DOM.from.organization_address.value = sd.organization_address;
				this.DOM.from.organization_building.value = sd.organization_building;
				this.DOM.from.organization_department.value = sd.organization_department;

			} else {

				this.DOM.from.organization_name.value = "";
				this.DOM.from.organization_address.value = "";
				this.DOM.from.organization_building.value = "";
				this.DOM.from.organization_department.value = "";

			}
	
			if(this.MEM.document.buyer_details) {
				
				let cd = this.MEM.document.buyer_details;
				this.DOM.to.organization_name.value = cd.organization_name || "";
				this.DOM.to.organization_address.value = cd.organization_address || "";
				this.DOM.to.organization_building.value = cd.organization_building || "";
				this.DOM.to.organization_department.value = cd.organization_department || "";

			} else {

				this.DOM.to.organization_name.value = "";
				this.DOM.to.organization_address.value = "";
				this.DOM.to.organization_building.value = "";
				this.DOM.to.organization_department.value = "";

			}

		}

		// Render the Subject

		this.DOM.inputs.subject.value = this.MEM.document.subject_line || "";

		this.DOM.contact.input.value = this.MEM.document.buyer_membername || "";


		const elem =  FolderWidget.MEM.getActiveFolder();
		if( elem != null)  {
			let f;
			const folder = elem.getAttribute("data-folder");
			if(folder == "draft") {
				//this.DOM.inputs.subject.removeAttribute("readonly");
				f = this.ATTR.removeAttribute;
				
			} else {
				//this.DOM.inputs.subject.setAttribute("readonly", "readonly");
				f = this.ATTR.setAttribute;
			}
			f( this.DOM.inputs.subject );
			f( this.DOM.contact.input );

			f( this.DOM.from.organization_name );
			f( this.DOM.from.organization_address );
			f( this.DOM.from.organization_building );
			f( this.DOM.from.organization_department );

			f( this.DOM.to.organization_name );
			f( this.DOM.to.organization_address );
			f( this.DOM.to.organization_building );
			f( this.DOM.to.organization_department );

		}

		this.DOM.label.created_on.innerText = this.MEM.document.created_on || "";

	}

	function attr_removeAttribute(elm) {
		elm.removeAttribute("readonly");
		elm.removeAttribute("disabled");
	}

	function attr_setAttribute(elm) {
		elm.setAttribute("readonly", "readonly");
		elm.setAttribute("disabled", "disabled");
	}

	async function evt_handleComments(evt) {

		evt.stopPropagation(); 
		evt.preventDefault();

		let wk = this.DOM.textarea.comments.value;
		wk = wk.split("\n");
		for(let key in wk) {
			console.log(key+":"+wk[key]);
		}

		this.MEM.document.comments = wk;

		this.MEM.initSaveTimeout();
		const timeout = await setTimeout(function() {
			this.EVT.handleSaveClick();
		}.bind(this), this.MEM.getTimeout());

		this.MEM.setSaveTimeout(timeout);

	}

}).apply({});
