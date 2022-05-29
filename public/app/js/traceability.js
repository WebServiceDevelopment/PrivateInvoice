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
//"use strict";

const MAX_ROWS = 10;

const Traceability = new Traceability_class();

function  Traceability_class () {


	this.API = {
		setSign					: api_setSign.bind(this),
		getSign					: api_getSign.bind(this),
		setCredentialSubject	: api_setCredentialSubject.bind(this),
		getCredentialSubject	: api_getCredentialSubject.bind(this),
		init					: api_initCredentialSubject.bind(this),
	}

	this.credentialSubject = new credentialSubject_object();

	function credentialSubject_object () {
		return {
	        "type"					: "Invoice",
			"customerReferenceNumber": "",
			"identifier"			: "",
			"invoiceNumber"			: "",
			"invoiceDate"			: "",
			"purchaseDate"			: "",

			"seller":{
				"type"				: "Organization",
				"name"				: "",
				"taxId"				: "",
				"description"		: "",
				"contactPoint"		: "",
				"address":{
					"type"			: "PostalAddress",
					"streetAddress"	: "",
					"addressLocality": ""
				}
			},

			"buyer":{
				"type"				: "Organization",
				"name"				: "",
				"taxId"				: "",
				"description"		: "",
				"contactPoint"		: "",
				"address" : {
				"type"				: "PostalAddress",
					"streetAddress"	: "",
					"addressLocality": ""
				}
			},

			"itemsShipped"	: [],

			"invoiceSubtotal"		: {
				"type"				: "PriceSpecification",
				"price"				: 0,
				"priceCurrency"		: "Gwei"
			},

			"totalPaymentDue" : {
				"type"				: "PriceSpecification",
				"price"				: 0,
				"priceCurrency"		: "Gwei"
			},

			"comments":[
				""
			]
		}
	}

    this.itemsShipped = function () {
		return {
			"type":"TradeLineItem",
			"description":"",

			"product":{
				"type":"Product",
				"description":"",

				"sizeOrAmount":{
					"type":"QuantitativeValue",
					"unitCode":"kg",
					"value":"0"
				},

				"productPrice":{
					"type":"PriceSpecification",
					"price":0,
					"priceCurrency":"Gwei"
				}
			},

			"lineItemTotalPrice" : {
				"type" : "PriceSpecification",
				"price" : 0,
				"priceCurrency" : "Gwei"
			}
		}
    }

	this.SET = {
		identifier			: set_identifier.bind(this),
		customerReferenceNumber	: set_customerReferenceNumber.bind(this),
        invoiceNumber		: set_invoiceNumber.bind(this),
        invoiceDate			: set_invoiceDate.bind(this),
        purchaseDate		: set_purchaseDate.bind(this),

		seller				: set_seller.bind(this),
		buyer				: set_buyer.bind(this),

    	itemsShipped		: set_itemsShipped.bind(this),

		documentTotal		: set_documentTotal.bind(this),

    	comments			: set_comments.bind(this),
	}

	this.GET = {
		identifier			: get_identifier.bind(this),
		customerReferenceNumber	: get_customerReferenceNumber.bind(this),
        invoiceNumber		: get_invoiceNumber.bind(this),
        invoiceDate			: get_invoiceDate.bind(this),
        purchaseDate		: get_purchaseDate.bind(this),

		seller				: get_seller.bind(this),
		buyer				: get_buyer.bind(this),

    	itemsShipped		: get_itemsShipped.bind(this),

		documentTotal		: get_documentTotal.bind(this),

    	comments			: get_comments.bind(this),

	}

	return this;

	function api_initCredentialSubject() {

		this.credentialSubject = new credentialSubject_object();

	}

	function api_setCredentialSubject ( credentialSubject ) {
		this.credentialSubject = Object.assign({}, credentialSubject);
	}
	function api_getCredentialSubject () {
		return this.credentialSubject;
	}

	function api_setSign (doc) {

		let set = this.SET;

		set.identifier ( doc.document_uuid );
		set.customerReferenceNumber ( doc.subject_line);

        set.invoiceNumber ( doc.document_meta.document_number);
        set.invoiceDate	(doc.created_on );
        set.purchaseDate ( doc.document_meta.due_by);

		set.seller (doc.seller_details);
		set.buyer (doc.buyer_details);

		set.itemsShipped ( doc.document_body );
		set.documentTotal ( doc.document_totals );

    	set.comments ( doc.comments);

		//console.log(doc.comments);

		//console.log(JSON.stringify(this.credentialSubject));
    }

/*
 *
 * getSign (document)
 *
 * Add buyer_uuid and buyer_membername information to
 * DocumentWidget.MEM.document.buyer_details
 */
	function api_getSign (document) {

		let locale = 'ja-JP-u-ca-japanese';

		let get = this.GET;

		let doc = {};
		doc.document_meta = {};

		const opts = DocumentWidget.API.getCurrencyOptions();

		let wk, w, price;

		doc.document_uuid				= get.identifier();
		doc.subject_line 				= get.customerReferenceNumber();

        doc.document_meta.document_number= get.invoiceNumber();
        doc.created_on					= get.invoiceDate();

        doc.document_meta.due_by		= get.purchaseDate();
        doc.document_meta.created_on	= doc.created_on.toLocaleString(locale, { timeZone: 'UTC' }).substr(0,10);

		doc.seller_details				= get.seller();
		doc.buyer_details				= get.buyer();

/* 20220529
		doc.buyer_details.buyer_uuid	= document.buyer_uuid;
		doc.buyer_details.buyer_membername	= document.buyer_membername;
*/
		doc.buyer_details.member_uuid	= document.buyer_uuid;
		doc.buyer_details.membername	= document.buyer_membername;

		console.log("doc.buyer_details.buyer_uuid="+doc.buyer_details.buyer_uuid)
		console.log("doc.buyer_details.buyer_membername="+doc.buyer_details.buyer_membername)

        doc.document_meta.taxId		= doc.seller_details.taxId;


		w = [];
		wk = [...(get.itemsShipped())];
		for(let i in wk) {
			w[i] = {};
			w[i].date = wk[i].description;
			w[i].desc = wk[i].product.description;

			price = wk[i].product.productPrice.price;

			if( price > 0 || price === 0) {
				//w[i].price = price +" "+ wk[i].product.productPrice.priceCurrency;
				opts.symbol = wk[i].product.productPrice.priceCurrency;

				w[i].price = currency(price, opts).format(true);
			} else {
				w[i].price = "";
			}

			w[i].unit = wk[i].product.sizeOrAmount.unitCode;
			w[i].quan = wk[i].product.sizeOrAmount.value;

			price = wk[i].lineItemTotalPrice.price;
			if( price > 0 ||  price === 0 ) {
				//w[i].subtotal = price +" "+ wk[i].lineItemTotalPrice.priceCurrency;
				opts.symbol = wk[i].lineItemTotalPrice.priceCurrency;

				w[i].subtotal = currency(price, opts).format(true);
			} else {
				w[i].subtotal = "";
			}
		}

		doc.document_body				= w;

		doc.document_totals				= {}

		let [subtotal_price, subtotal_currency, total_price, total_currency] = get.documentTotal();

		opts.symbol =subtotal_currency;
		doc.document_totals.subtotal	= currency(subtotal_price, opts).format(true);

		opts.symbol =total_currency;
		doc.document_totals.total		= currency(total_price, opts).format(true);

		doc.comments					= get.comments();

		//console.log("doc.comments="+doc.comments);

		if(doc.seller_details.contactPoint != null && doc.seller_details.contactPoin != "") {
			
			if( doc.seller_details.contactPoint.indexOf("@") !== -1) {
				wk = doc.seller_details.contactPoint.split("@"); 
				doc.seller_membername	= wk[0]; 
				console.log("seller_membername  ="+doc.seller_membername);
			}
		} else {
			console.log("here "+doc.seller_details.contactPoint);
			doc.seller_details.member_name	= ""; 
		}

		if(doc.buyer_details.contactPoint != null && doc.buyer_details.contactPoint != "") {
			
			if( doc.buyer_details.contactPoint.indexOf("@") !== -1) {
				wk = doc.buyer_details.contactPoint.split("@"); 
				doc.buyer_membername	= wk[0]; 
				console.log("buyer_membername  ="+doc.buyer_membername);
			}
		} else {
			console.log("here doc.buyer_details.member_name:"+doc.buyer_details.contactPoint);
			doc.buyer_details.member_name	= "";
		}

		return doc;

    }

//--------------------------- credentialSubject -------------------------------
// identifier

   	function set_identifier (identifier) {
		this.credentialSubject.identifier = identifier;
	}
   	function get_identifier () {
/*
		for(let key in this) {
			console.log(key +":"+this[key]);
		}
*/
		return this.credentialSubject.identifier;
	}

// customerReferenceNumber
	function set_customerReferenceNumber ( customerReferenceNumber ) {
		this.credentialSubject.customerReferenceNumber = customerReferenceNumber;
	}
	function get_customerReferenceNumber () {
		return this.credentialSubject.customerReferenceNumber;
	}

//invoiceNumber
   	function set_invoiceNumber (invocieNumber) {
		this.credentialSubject.invoiceNumber = invocieNumber;
	}
   	function get_invoiceNumber () {
		return this.credentialSubject.invoiceNumber;
	}

// invoiceDate

   	function set_invoiceDate (invocieDate) {
		this.credentialSubject.invoiceDate = invocieDate;
	}
   	function get_invoiceDate () {
		return this.credentialSubject.invoiceDate;
	}

// purchaseDate

   	function set_purchaseDate (purchaseDate) {
		this.credentialSubject.purchaseDate = purchaseDate;
	}
   	function get_purchaseDate () {
		return this.credentialSubject.purchaseDate;
	}

// seller 

	function set_seller ( details ) {

		if(details == null) return;

		let seller = this.credentialSubject.seller;

		seller.name = details.organization_name;

		seller.taxId = details.organization_tax_id;

		seller.description = details.organization_department;

		seller.address.streetAddress = details.organization_address||"";
		seller.address.addressLocality = details.organization_building||"";

		seller.contactPoint = details.contactPoint 
	}

	function get_seller () {

		let seller = this.credentialSubject.seller;

		let obj = {};

		obj.organization_name = seller.name;

		obj.organization_tax_id = seller.taxId;

		obj.organization_department = seller.description;

		obj.organization_address = seller.address.streetAddress;

		obj.organization_building = seller.address.addressLocality;

		obj.contactPoint = seller.contactPoint;

		return obj;

	}

// buyer 

	function set_buyer ( details ) {

		if(details == null) return;

		let buyer = this.credentialSubject.buyer;

		buyer.name = details.organization_name;

		buyer.taxId = details.organization_tax_id;

		buyer.description = details.organization_department;

		buyer.address.streetAddress = details.organization_address||"";
		buyer.address.addressLocality = details.organization_building||"";

		buyer.contactPoint = details.contactPoint 
	}

	function get_buyer () {

		let buyer = this.credentialSubject.buyer;

		let obj = {};

		obj.organization_name = buyer.name;

		obj.organization_tax_id = buyer.taxId;

		obj.organization_department = buyer.description;

		obj.organization_address = buyer.address.streetAddress;

		obj.organization_building = buyer.address.addressLocality;

		obj.contactPoint = buyer.contactPoint;

		return obj;

	}


// invoiceSubtotal & totalPaymentDue

   	function set_documentTotal (document_totals) {

		let price , currency;
		let subtotal = document_totals.subtotal
		let total = document_totals.total

		let CS = this.credentialSubject;

		[price , currency] = _price_priceCurrency (subtotal);

		CS.invoiceSubtotal.price = price;
		CS.invoiceSubtotal.priceCurrency = currency;

		[price , currency] = _price_priceCurrency (total);

		CS.totalPaymentDue.price = price;
		CS.totalPaymentDue.priceCurrency = currency;

		return [subtotal , total];
	}


   	function get_documentTotal () {

		let subtotal_price , subtotal_currency;
		let total_price , total_currency;
		let CS = this.credentialSubject;

		subtotal_price = (CS.invoiceSubtotal.price).toLocaleString();
		subtotal_currency = CS.invoiceSubtotal.priceCurrency


		total_price = (CS.totalPaymentDue.price).toLocaleString();
		total_currency = CS.totalPaymentDue.priceCurrency


		return [subtotal_price, subtotal_currency, total_price, total_currency];
	}

// comments

    function set_comments (comments) {
		if(comments == null) {
			this.credentialSubject.comments = [""];
			return;
		}
		this.credentialSubject.comments = comments;
	}

    function get_comments () {
		let comments = this.credentialSubject.comments;

		if( comments == null) {
			return "";
		}
		if( comments == []) {
			return "";
		}

		if( Array.isArray(comments) == true) {
			return comments.join("\n");
		}

		return comments;
	}

// itemsShipped

    function set_itemsShipped (document_body) {

		let CS = this.credentialSubject;
		const b = document_body;

		let price, currency;

		let itemsShipped = [];

		for(let i=0; i<MAX_ROWS; i++) {
			
			itemsShipped[i] = new this.itemsShipped();

			itemsShipped[i].description = b[i].date;
			itemsShipped[i].product.description = b[i].desc;

			itemsShipped[i].product.sizeOrAmount.unitCode = b[i].unit;
			itemsShipped[i].product.sizeOrAmount.value = b[i].quan;

			
			[price , currency] = _price_priceCurrency (b[i].price);
				
			itemsShipped[i].product.productPrice.price = price;
			itemsShipped[i].product.productPrice.priceCurrency = currency;
			
			[price , currency] = _price_priceCurrency (b[i].subtotal);
				
			itemsShipped[i].lineItemTotalPrice.price = price;
			itemsShipped[i].lineItemTotalPrice.priceCurrency = currency;
		}

		CS.itemsShipped = [...itemsShipped];

		itemsShipped.splice(0,MAX_ROWS);

	}

    function get_itemsShipped () {

		let CS = this.credentialSubject;

		const document_body = [];
		const b = document_body;

		let price, currency;

		let itemsShipped = [];

		itemsShipped = [...CS.itemsShipped];
		for(let i=0; i<MAX_ROWS; i++) {
			
			b[i] = {};

			b[i].date = itemsShipped[i].description;
			b[i].desc =  itemsShipped[i].product.description;

			b[i].unit = itemsShipped[i].product.sizeOrAmount.unitCode;
			b[i].quan = itemsShipped[i].product.sizeOrAmount.value;

			
			price = itemsShipped[i].product.productPrice.price;
			price = price.toLocaleString();
			currency = itemsShipped[i].product.productPrice.priceCurrency
			b[i].price = price + " " + currency;
				
			
				
			price = itemsShipped[i].lineItemTotalPrice.price;
			price = price.toLocaleString();
			currency = itemsShipped[i].lineItemTotalPrice.priceCurrency;
			b[i].subtotal = price + " " + currency;
		}

		return itemsShipped;
	}

	function _price_priceCurrency (p) {
		let price="", currency="", wk;

		if(p == null) {
			return [price, currency];
		}

	
		if( p.indexOf(" ") !== -1) {
			wk = p.split(" ");
			price = wk[0].replace(/,/ , "");
			currency = wk[1];
		} else {
			price = p.replace(/,/ , "");
			currency = 'Gwei';
		}

		return [price, currency];
				
	}

}
