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

const TrayWidget = (function() {

	this.MEM = {
		document_uuid : null,
		setDocument_uuid : (uuid) => this.MEM.document_uuid = uuid,
		getDocument_uuid : () => this.MEM.document_uuid,
		clearDocument_uuid : () => this.MEM.document_uuid = null,

		params : null,
		setParams : (params) => this.MEM.params = params,
		getParams : () => this.MEM.params,

		results : null,
		setResults : (results) => this.MEM.results = results,
		getResults : () => this.MEM.results,

	}

    const Elem = (id) => document.getElementById(id);

	this.DOM = {
		header : {
			select : Elem('TrayWidget.header.select'),
			batch : Elem('TrayWidget.header.batch'),

		},
		tray : {
			body : Elem('TrayWidget.tray.body')
		},
		showing : {
			start : Elem('TrayWidget.Showing.start'),
			end : Elem('TrayWidget.Showing.end'),
			all : Elem('TrayWidget.Showing.all'),
			currentPage : Elem('TrayWidget.Showing.currentPage'),
			maxPage : Elem('TrayWidget.Showing.maxPage'),
			total : Elem('TrayWidget.Showing.total'),
			label_total : Elem('TrayWidget.Showing.label_total'),

			left : Elem('TrayWidget.Showing.left'),
			double_left : Elem('TrayWidget.Showing.double_left'),
			right : Elem('TrayWidget.Showing.right'),
			double_right : Elem('TrayWidget.Showing.double_right'),

			getStart	: () => this.DOM.showing.start.innerText,
			setStart	: (n) => this.DOM.showing.start.innerText = n,
			getEnd		: () => this.DOM.showing.end.innerText,
			setEnd		: (n) => this.DOM.showing.end.innerText = n,
			getAll		: () => this.DOM.showing.all.innerText,
			setAll		: (n) => this.DOM.showing.all.innerText = n ,
			getTotal	: () => this.DOM.showing.total.innerText,
			setTotal	: (n) => this.DOM.showing.total.innerText = n ,
			getMaxPage	: () => this.DOM.showing.maxPage.innerText,
			setMaxPage	: (n) => this.DOM.showing.maxPage.innerText = n ,
			getCurrentPage : () => this.DOM.showing.currentPage.innerText,
			setCurrentPage : (n) => this.DOM.showing.currentPage.innerText = n ,
		}
	}


	this.EVT = {
		handleSelectChange : evt_handleSelectChange.bind(this),
		handleBodyClick : evt_handleBodyClick.bind(this),
		handleSelectChange : evt_handleSelectChange.bind(this)
	}

	this.API = {
		getParams : api_getParams.bind(this),

		openFolder : api_openFolder.bind(this),
		openFolderForNewDocument : api_openFolderForNewDocument.bind(this),

		renderFolder : api_renderFolder.bind(this),
		updateSelectSubject : api_updateSelectSubject.bind(this),
		updateSelectTotal : api_updateSelectTotal.bind(this),
		updateDueDate : api_updateDueDate.bind(this),
		updateCompany : api_updateCompany.bind(this),
		refresh : api_refresh.bind(this),
		clearDocument : api_clearDocument.bind(this),

		displayShowingTotal : api_displayShowingTotal.bind(this),

		movePage : api_movePage.bind(this),
		nonselectTray : api_nonselectTray.bind(this),
	}

	this.SIMULATE = {
		clickNewDocument : simulate_clickNewDocument.bind(this)
	}

	this.STATUS = {
		activeLi : null,
		setActiveLi : (activeLi) => this.STATUS.activeLi = activeLi, 
		getActiveLi : () => this.STATUS.activeLi,
		clearActiveLi : () => this.STATUS.activeLi = null,

		select_on : false,
		setSelect_on : (select_on) => this.STATUS.select_on = select_on,
		getSelect_on : () => this.STATUS.select_on,
		clearSelect_on : () => this.STATUS.select_on = null,

		checkboxes : [],
		setCheckboxes : (checkboxes) => this.STATUS.checkboxes = checkboxes,
		getCheckboxes : () => this.STATUS.checkboxes,
		initCheckboxes : () => this.STATUS.checkboxes = [],

	}

	this.SHOWING = {
		start: 1,

		getStart : () => this.SHOWING.start,
		setStart : (start) => this.SHOWING.start = start,

		end: 1,
		getEnd : () => this.SHOWING.end,
		setEnd : (end) => this.SHOWING.end = end,

		all: 0,
		getAll : () => this.SHOWING.all,
		setAll : (all) => this.SHOWING.all = all,
		addAll : () => this.SHOWING.all++ ,

		folder_list_limit : 25,
		getFolderListLimit : () => this.SHOWING.folder_list_limit ,

		render : showing_render.bind(this),

		rightClick : showing_rightClick.bind(this),
		doubleRightClick : showing_doubleRightClick.bind(this),
		leftClick : showing_leftClick.bind(this),
		doubleLeftClick : showing_doubleLeftClick.bind(this),
	}

	this.AJAX = {
		get : ajax_get.bind(this),
	}


	init.apply(this);

	return this;

	
	function init() {

		this.DOM.header.select.addEventListener('change', this.EVT.handleSelectChange);
		this.DOM.tray.body.addEventListener('click', this.EVT.handleBodyClick);

		const S = this.SHOWING;

		this.DOM.showing.double_right.addEventListener('click',S.doubleRightClick);
		this.DOM.showing.right.addEventListener('click',S.rightClick);
		this.DOM.showing.left.addEventListener('click',S.leftClick);
		this.DOM.showing.double_left.addEventListener('click',S.doubleLeftClick);

	}

	function showing_leftClick() {

		let start = parseInt(this.DOM.showing.getStart());
		let list_limit = this.SHOWING.getFolderListLimit();

		//console.log("rightClick start = "+start);
		if(start <=1 )  {
			return;
		}
		if( start <=  list_limit) {
			start = 1;
		} else {
			start -= list_limit;
		}

		this.DOM.showing.setStart( this.SHOWING.setStart(start) );

		const elem =  FolderWidget.MEM.getActiveFolder();
		const role = elem.getAttribute("data-role");
        const type = elem.getAttribute("data-type");
        const folder = elem.getAttribute("data-folder");
        const archive = elem.getAttribute("data-archive");
			
		this.API.movePage(role, type, folder, archive, start-1) ;
	}

	function showing_doubleLeftClick() {

		//console.log("doubleRightClick");
		let start = parseInt(this.DOM.showing.getStart());

		if(start <=1 )  {
			return;
		}
		//console.log("doubleLightClick start = "+start);

		start = 1;

		this.DOM.showing.setStart( this.SHOWING.setStart(start) );

		const elem =  FolderWidget.MEM.getActiveFolder();
		const role = elem.getAttribute("data-role");
        const type = elem.getAttribute("data-type");
        const folder = elem.getAttribute("data-folder");
        const archive = elem.getAttribute("data-archive");
			
		this.API.movePage(role, type, folder, archive, start-1) ;
	}

	function showing_rightClick() {

		//console.log("leftClick");

		let start = parseInt(this.DOM.showing.getStart());
		let all = parseInt(this.DOM.showing.getAll());
		let list_limit = this.SHOWING.getFolderListLimit();

		if(start+list_limit > all )  {
			return;
		}
		start += list_limit;

		this.DOM.showing.setStart( this.SHOWING.setStart(start) );

		//console.log("leftClick start = "+start);
			
		const elem =  FolderWidget.MEM.getActiveFolder();
		const role = elem.getAttribute("data-role");
        const type = elem.getAttribute("data-type");
        const folder = elem.getAttribute("data-folder");
        const archive = elem.getAttribute("data-archive");
			
		this.API.movePage(role, type, folder, archive, start-1) ;
	}

	function showing_doubleRightClick() {

		//console.log("doubleLeftClick");

		let start = parseInt(this.DOM.showing.getStart());
		let all = parseInt(this.DOM.showing.getAll());
		let list_limit = this.SHOWING.getFolderListLimit();

		let page = parseInt(all / list_limit) + ((all % list_limit)? 1: 0);

		start = (page -1) * list_limit + 1;

		this.DOM.showing.setStart( this.SHOWING.setStart(start) );

		const elem =  FolderWidget.MEM.getActiveFolder();
		const role = elem.getAttribute("data-role");
        const type = elem.getAttribute("data-type");
        const folder = elem.getAttribute("data-folder");
        const archive = elem.getAttribute("data-archive");
			
		this.API.movePage(role, type, folder, archive, start-1) ;
	}

	function api_displayShowingTotal(total) {
			//console.log("displayShowingTotal total="+total);

			if( total == null) {
				this.DOM.showing.setTotal(0);
				
				this.DOM.showing.total.style.visibility = "hidden";
				this.DOM.showing.label_total.style.visibility = "hidden";
				return;
			}

			this.DOM.showing.total.style.visibility = "visible";
			this.DOM.showing.label_total.style.visibility = "visible";

			this.DOM.showing.setTotal(total);

	}

	function api_clearDocument() {

		this.MEM.clearDocument_uuid();

	}

	async function api_refresh() {

		let role, type, folder, archive;

		role = FolderWidget.API.getActiveFolderRole()
		type = FolderWidget.API.getActiveFolderType()
		folder = FolderWidget.API.getActiveFolderFolder()
		archive = FolderWidget.API.getActiveFolderArchive()

		const params = this.MEM.getParams();

		const res = await this.AJAX.get( params , role, folder, archive);

		if(res.err) {
			throw res.msg;
		}

		this.MEM.setResults( res.msg );

		this.API.renderFolder(role, folder, archive);

	}

	function api_getParams() {

		return this.MEM.params;

	}

	function api_updateCompany(txt) {

		//console.log("api_updateCompany");

		let activeLi = this.STATUS.getActiveLi();

		if( activeLi == null) {
			console.log("activeLi == null");
			return;
		}
		if( activeLi.memberData == null) {
			console.log("activeLi.memberData == null");
			return;
		}
		if( activeLi.memberData.dom == null) {
			console.log("activeLi.memberData.dom == null");
			return;
		}
		if( activeLi.memberData.dom.organization == null) {
			console.log("activeLi.memberData.dom.organization == null");
			return;
		}	

		if(txt.length) {
			activeLi.memberData.dom.organization.classList.remove("unset");
			activeLi.memberData.dom.organization.textContent = txt;
		} else {
			activeLi.memberData.dom.organization.classList.add("unset");
			activeLi.memberData.dom.organization.textContent = "Company Name";
		}

	}

	function api_updateDueDate(txt) {

		//console.log("api_updateDueDate");

		let activeLi = this.STATUS.getActiveLi();

		activeLi.memberData.dom.due_by.textContent = "Due by: " + txt;

	}

	function api_updateSelectTotal(txt) {

		//console.log("api_updateSelectTotal");

		let activeLi = this.STATUS.getActiveLi();

		activeLi.memberData.dom.amount.textContent = txt;

	}

	function api_updateSelectSubject(txt) {

		//console.log("api_updateSelectSubject");

		let activeLi = this.STATUS.getActiveLi();

		if(txt.length) {
			activeLi.memberData.dom.subject_line.classList.remove("unset");
			activeLi.memberData.dom.subject_line.textContent = txt;
		} else {
			activeLi.memberData.dom.subject_line.classList.add("unset");
			activeLi.memberData.dom.subject_line.textContent = "Subject Line";
		}

	}

	function evt_handleSelectChange(evt) {

		//console.log("select change!!");

	}

/*
* 
*/
	function evt_handleBodyClick(evt) {
		
		if(this.STATUS.getSelect_on()) {
			return;
		}

		let elem = evt.target;
		while(elem.parentNode && elem.tagName !== "LI") {
			if(elem === this.DOM.tray.body) {
				return;
			}
			elem = elem.parentNode;
		}
		
		if(!elem.memberData) {
			return;
		}


		//console.log("api_handleBodyClick");

		const ACTIVE = "active";

		let activeLi = this.STATUS.getActiveLi();
		if(activeLi) {
			activeLi.classList.remove(ACTIVE);
		}

		this.MEM.setDocument_uuid( elem.memberData.doc.document_uuid );

		elem.classList.add(ACTIVE);
		this.STATUS.setActiveLi( elem );

        const role = FolderWidget.API.getActiveFolderRole();
        const folder = FolderWidget.API.getActiveFolderFolder();
        const archive = FolderWidget.API.getActiveFolderArchive();
		//console.log("folder = "+folder+":archive="+archive);

		DocumentWidget.API.openDocument( elem.memberData.doc.document_uuid , role, folder, archive);

	}

	function api_renderFolder(role, folder, archive) {

		this.DOM.tray.body.innerHTML = '';
		this.STATUS.initCheckboxes();

		let session = SessionWidget.API.getSessionMemory();

		let results = this.MEM.getResults();

		let count=0;
		results.forEach(doc => {
			count++;
	
			const li = document.createElement("li");
			const label = document.createElement("label");

			if(this.MEM.getDocument_uuid() === doc.document_uuid) {
				li.classList.add("active");

				this.STATUS.setActiveLi( li );
			}

			const fixed = document.createElement("div");
			fixed.setAttribute("class", "fixed");
			
			// Then we make the two placeholder divs

			const hold_div = document.createElement("div");
			hold_div.setAttribute("class", "hold");

			const label_div = document.createElement("div");
			label_div.setAttribute("class", "label");

			// First we do the checkbox

			const checkbox = document.createElement("input");
			checkbox.setAttribute("type", "checkbox");
			checkbox.setAttribute("disabled", "disabled");
			label_div.appendChild(checkbox);
			fixed.appendChild(label_div);

			// Row 01

			const div_a = document.createElement("div");
			div_a.setAttribute("class", "row");
			const table_a = document.createElement("table");
			const row_a = table_a.insertRow();
			const cell_a0 = row_a.insertCell();
			const cell_a1 = row_a.insertCell();
			cell_a1.setAttribute('class', 'num');
			div_a.appendChild(table_a);
			hold_div.appendChild(div_a);

			if(!doc.buyer_organization || !doc.buyer_organization.length) {
				cell_a0.classList.add("unset");
				cell_a0.textContent = "Company Name";
			} else {

				if(session.member_did === doc.seller_did) {
					cell_a0.textContent = doc.buyer_organization || "";
				} else {
					cell_a0.textContent = doc.seller_organization || "";
				}

			}

			cell_a1.textContent = doc.created_on.substr(0, 10);
			// Display the last operation time of the sellerer.
			cell_a1.title = "last action : "+doc.seller_last_action.substr(0, 16);
			

			// Row 02

			const div_b = document.createElement("div");
			div_b.setAttribute("class", "row");
			const table_b = document.createElement("table");
			const row_b = table_b.insertRow();
			const cell_b0 = row_b.insertCell();
			const cell_b1 = row_b.insertCell();
			cell_b1.setAttribute('class', 'num');
			div_b.appendChild(table_b);
			hold_div.appendChild(div_b);

			cell_b1.textContent = doc.document_number;

			if(!doc.subject_line.length) {
				cell_b0.classList.add("unset");
				cell_b0.textContent = "Subject Line";
			} else {
				cell_b0.textContent = doc.subject_line;
			}

			// Row 01

			const div_c = document.createElement("div");
			div_c.setAttribute("class", "row");
			const table_c = document.createElement("table");
			const row_c = table_c.insertRow();
			const cell_c0 = row_c.insertCell();
			const cell_c1 = row_c.insertCell();
			cell_c1.setAttribute('class', 'sum');
			div_c.appendChild(table_c);
			hold_div.appendChild(div_c);

			cell_c0.textContent = "Due by: " + doc.due_by.substr(0,10);
			cell_c1.textContent = doc.amount_due;

			// Add all divs to tray body

			fixed.appendChild(hold_div);
			label.appendChild(fixed);
			li.appendChild(label);
			this.DOM.tray.body.appendChild(li);

			const memberData = {
				doc : doc,
				dom : {
					li : li,
					checkbox : checkbox,
					organization : cell_a0,
					last_action : cell_a1,
					subject_line : cell_b0,
					doc_number : cell_b1,
					due_by : cell_c0,
					amount : cell_c1
				}
			}

			li.memberData = memberData;
			checkbox.memberData = memberData;
			this.STATUS.checkboxes.push(checkbox);

		});

// trash or cpmplete
		if(folder == "trash" ||  archive == 1) {
			let  exec = this.SHOWING.render;
			FolderWidget.API.getInvoiceArchiveCount(count, role, folder , archive, exec);
		} else {
			this.SHOWING.render(count) ;
		}

	}

/*
* Showing
*/
	function showing_render(count) {

		//console.log("showing_render="+count)
		

		let limit = this.SHOWING.getFolderListLimit();
		let start = this.SHOWING.getStart();
		let end = start +  count -1;
		if(end == 0) {
			start = 0;
		}

		this.DOM.showing.setStart( this.SHOWING.setStart( start ) );

		this.DOM.showing.setEnd( this.SHOWING.setEnd( end ) );

		let max = FolderWidget.API.getCountOfActiveFolder();

		if( max == null ) {
			max = this.SHOWING.getAll();
		}
		
		if( typeof max =="string") {
			max = parseInt(max);
		}

		this.DOM.showing.setAll( max );
		this.SHOWING.setAll( max );

		let currentPage = parseInt(start / limit) + 1;
		if(end == 0) {
			currentPage = 0;
		}

		this.DOM.showing.setCurrentPage( currentPage );

		let maxPage = parseInt(max / limit) + ((max % limit) ? 1:0);
		if(end == 0) {
			//maxPage = 1;
			maxPage = 0;
		}

		//console.log("maxPage ="+maxPage );

		this.DOM.showing.setMaxPage( maxPage );

	}

	async function ajax_get ( params , role, folder, archive) {

		//console.log("params="+JSON.stringify(params));
		//console.log("ajax_get:"+"folder="+folder+":arcgive="+archive+":role="+role);

		let PATH;
		let args = {
				offset : params.offset,
				limit : params.limit
		}

		switch(folder) {
		case 'draft':
			PATH = '/api/tray/getFolderOfDraft';
		break;
		case 'paid':
			if( archive == 0) {
				args.archive = archive;
				args.folder = folder;
				args.role = role;
				args.type = params.type;
				PATH = '/api/tray/getFolderOfInvoice';
			} else {
				args.archive = archive;
				args.folder = folder;
				args.role = role;
				args.type = params.type;
				PATH = '/api/tray/getFolderOfArchive';
			}
		break;

		case 'trash':
				args.archive = archive;
				args.folder = folder;
				args.role = role;
				args.type = params.type;
				PATH = '/api/tray/getFolderOfArchive';
		break;
		default:
			args.archive = archive;
			args.folder = folder;
			args.role = role;
			args.type = params.type;
			PATH = '/api/tray/getFolderOfInvoice';
		break;
		}

		const url = PATH;

		if(params.order_by == null) {
			delete params.order_by;
		}
		if(params.order == null) {
			delete params.order;
		}

		let response;
        try {
            response = await fetch( url+'?'+new URLSearchParams(
				args
            ).toString());

        } catch(err) {

            throw err;
        }
		
		return await response.json();

	}

	async function api_movePage(role, type, folder, archive, offset) {

		const params = {
			role : role,
			folder : folder,
			type : type,
			archive : archive,
			offset : offset,
			limit : this.SHOWING.getFolderListLimit(),
			order_by : null,
			order : null
		};

		this.MEM.setParams( params );

		const res = await this.AJAX.get( params , role, folder, archive);
		if(res.err) {
			throw res.msg;
		}

		this.MEM.setResults( res.msg );

		this.API.renderFolder(role, folder, archive);

	}

	async function api_openFolder(role, type, folder, archive) {

		const params = {
			role : role,
			folder : folder,
			type : type,
			archive : archive,
			offset : 0,
			limit : this.SHOWING.getFolderListLimit(),
			order_by : null,
			order : null
		};

		this.MEM.setParams( params );

		const res = await this.AJAX.get( params , role, folder, archive );

		if(res.err) {
			throw res.msg;
		}

		this.MEM.setResults( res.msg );

		this.API.renderFolder(role, folder, archive);

	}

/*
* When you create a new Document, first display it on Draft Tray.
* Next, select the created Document.
*/
	async function api_openFolderForNewDocument(role, type, folder, archive) {

		const params = {
			role : role,
			folder : folder,
			type : type,
			archive : archive,
			offset : 0,
			limit : this.SHOWING.getFolderListLimit(),
			order_by : null,
			order : null
		};

		this.MEM.setParams( params );

		const res = await this.AJAX.get( params , role, folder, archive);

		if(res.err) {
			throw res.msg;
		}

		this.MEM.setResults( res.msg );

		this.SIMULATE.clickNewDocument(role, folder, archive);

		this.API.renderFolder(role, folder, archive);

	}

/*
 * When you create a new Document, Simulate clicking on Draft Try List.
*/

	function simulate_clickNewDocument(role, folder, archive) {


		const ACTIVE = "active";

		let elem = this.STATUS.getActiveLi();

		if(elem) {
			elem.classList.remove(ACTIVE);
		}

		elem = this.DOM.tray.body.children[0];

		if( elem == null) {
			return;
		}

		if( elem.tagName != "LI" ) {
			return;
		}


		if( elem.classList.contains(ACTIVE) != false) {
			return;
		}


		this.MEM.setDocument_uuid( elem.memberData.doc.document_uuid );

		elem.classList.add(ACTIVE );
		this.STATUS.setActiveLi( elem );

		DocumentWidget.API.openDocument(elem.memberData.doc.document_uuid, role, folder, archive);
	}

	function evt_handleSelectChange() {

		if(this.DOM.header.select.checked) {
			this.STATUS.setSelect_on( true );

			this.DOM.tray.body.classList.add("select");

			let checkboxes = this.STATUS.getCheckboxes();

			checkboxes.forEach( checkbox => {
				checkbox.removeAttribute("disabled");
			});
		} else {
			this.STATUS.setSelect_on( false );

			this.DOM.tray.body.classList.remove("select");

			let checkboxes = this.STATUS.getCheckboxes();

			checkboxes.forEach( checkbox => {
				checkbox.checked = false;
				checkbox.setAttribute("disabled", "disabled");
			});
		}

	}

	function api_nonselectTray () {
	    const ACTIVE = "active";

        let elem = this.STATUS.getActiveLi();

        if(elem) {
			
			if( elem.classList.contains(ACTIVE) ) {
            	elem.classList.remove(ACTIVE);
				this.STATUS.clearActiveLi();
				this.API.clearDocument();
				return true;
			}
        }

		return false;
	}

}).apply({});
