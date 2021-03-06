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

const Randomize = (function() {

	this.MEM = {}

	this.DOM = {
		company : document.getElementById('Randomize.company'),
		member : document.getElementById('Randomize.member'),
	}

	this.EVT = {
		handleCompanyClick : evt_handleCompanyClick.bind(this),
		handleMemberClick : evt_handleMemberClick.bind(this),
	}

	this.API = {
		generateRandomCompany : api_generateRandomCompany.bind(this),
		generateRandomTaxId : api_generateRandomTaxId.bind(this),
		generatePassword : api_generatePassword.bind(this),
		generateDepartment : api_generateDepartment.bind(this),
		generatePostcode : api_generatePostcode.bind(this),
		generateLine1 : api_generateLine1.bind(this),
		generateLine2 : api_generateLine2.bind(this),
	}

	init.apply(this);
	return this;

	function init() {
		
		this.DOM.company.addEventListener('click', this.EVT.handleCompanyClick);
		this.DOM.member.addEventListener('click', this.EVT.handleMemberClick);

	}

	async function evt_handleCompanyClick() {

		let req;

		req = await fetch('data/usaCities.json');
		const cities = await req.json();
		const { city, state } = cities[Math.floor(cities.length * Math.random())];

		const data = {
			company_name : this.API.generateRandomCompany(),
			company_tax_id : this.API.generateRandomTaxId(),
			department: this.API.generateDepartment(),
			country : "USA",
			state: state,
			city: city,
			postcode : this.API.generatePostcode(),
			line1 : this.API.generateLine1(),
			line2 : this.API.generateLine2()
		}

		SignupForm.API.setCompanyData(data);

	}

	async function evt_handleMemberClick() {
		
		let req;

		req = await fetch('data/names.json');
		const names = await req.json();
		const name = names[Math.floor(names.length * Math.random())];

		req = await fetch('data/jobtitles.json');
		const titles = await req.json();
		const title = titles[Math.floor(titles.length * Math.random())];

		const data = {
			member_name : name.toLowerCase(),
			job_title : title,
			contact_email : `${name.toLowerCase()}@example.com`,
			password : this.API.generatePassword()
		}
		
		SignupForm.API.setMemberData(data);

	}

	function api_generateRandomCompany() {

		const prefix = [
			"Jammy Jellyfish",
			"Impish Indri",
			"Focal Fossa",
			"Bionic Beaver",
			"Xenial Xerus",
			"Trusty Tahr",
			"Kinetic Kudu",
			"Hirsute Hippo",
			"Groovy Gorilla",
			"Eoan Ermine",
			"Disco Dingo",
			"Cosmic Cuttlefish",
			"Artful Aardvark",
			"Zesty Zapus",
			"Yakkety Yak",
			"Wily Werewolf",
			"Vivid Vervet",
			"Utopic Unicorn",
			"Saucy Salamander",
			"Raring Ringtail",
			"Quantal Quetzal",
			"Precise Pangolin",
			"Oneiric Ocelot",
			"Natty Narwhal",
			"Maverick Meerkat",
			"Lucid Lynx",
			"Karmic Koala",
			"Jaunty Jackalope",
			"Intrepid Ibex",
			"Hardy Heron",
			"Gutsy Gibbon",
			"Feisty Fawn",
			"Edgy Eft",
			"Dapper Drake",
			"Breezy Badger",
			"Hoary Hedgehog",
			"Warty Warthog"
		];

		const postfix = [
			"Systems",
			"International",
			"Co.",
			"Inc.", 
			"Partners",
			"Software",
			"Ltd.",
			"Corp.",
			"Foods",
			"Goods",
			"Services"
		];

		const a = prefix[Math.floor(Math.random()*prefix.length)];
		const b = postfix[Math.floor(Math.random()*postfix.length)];
		return `${a} ${b}`;
	}
	
	function api_generateRandomTaxId() {

		let prefix = Math.floor(Math.random() * 100).toString();
		while(prefix.length < 2) {
			prefix = "0" + prefix;
		}

		let postfix = Math.floor(Math.random() * 10000000).toString();
		while(postfix.length < 7) {
			postfix = "0" + postfix;
		}

		return `${prefix}-${postfix}`;

	}

	function api_generatePassword() {

		const length = 8;
		const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let pass = "";
		for (let i = 0, n = charset.length; i < length; ++i) {
			pass += charset.charAt(Math.floor(Math.random() * n));
		}
		return pass;

	}

	function api_generateDepartment() {

		const dept = [
			"Administration",
			"Marketing",
			"Transportation",
			"Shipping",
			"Human Resources",
			"Operations",
			"Inventory",
			"Sales",
			"Finance",
			"Documentation",
			"Billing",
			"Control And Credit"
		]

		return dept[Math.floor(Math.random()*dept.length)]

	}

	function api_generatePostcode() {

		let prefix = Math.floor(Math.random() * 1000).toString();
		while(prefix.length < 3) {
			prefix = "0" + prefix;
		}

		let postfix = Math.floor(Math.random() * 10000).toString();
		while(postfix.length < 4) {
			postfix = "0" + postfix;
		}

		return `${prefix}-${postfix}`;

	}

	function api_generateLine1() {

		let no = Math.floor(Math.random() * 1000).toString();
		while(no.length < 3) {
			no = "0" + prefix;
		}

		const suffix = [
			'Way',
			'Road',
			'Lane',
			'Drive',
			'Grove',
			'Gardens',
			'Circus' ,
			'Square',
			'Hill',
			'Avenue'
		]
		const c = suffix[Math.floor(Math.random()*suffix.length)];

		const names = [
			'Main',
			'Pine',
			'Oak',
			'Elm',
			'Church',
			'Maple',
			'Walnut',
			'Washington',
			'Park',
			'Center',
			'Cedar',
			'Chestnut',
			'Mill',
			'Cherry',
			'Meadow',
			'Spruce',
			'Jackson',
			'Shady',
			'Lincoln',
		]
		const b = names[Math.floor(Math.random()*names.length)];

		return `${no} ${b} ${c}`;

	}

	function api_generateLine2() {

		if (Math.random() < 0.5) {
			return '';
		}

		const suffix = [
			'Unit',
			'Suite',
			'Room No.',
			'Space No.',
			'Apartment',
			'Floor'
		]

		const a = Math.floor(Math.random() * 10);
		const b = Math.floor(Math.random() * 10);
		const c = suffix[Math.floor(Math.random()*suffix.length)];

		if(c === 'Floor') {
			return `${c} ${a}`;
		}
		
		return `${c} ${a}0${b}`;

	}

}).apply({});
