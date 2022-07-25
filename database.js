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

"use script";

const fs = require('fs');
const mysql = require('mysql');
const bcrypt = require('bcrypt');

const configStr = fs.readFileSync('config.json').toString();
const config = JSON.parse(configStr);

const DATABASE = {
		"connectionLimit" : 4,
		"host" : "localhost",
		"user" : process.env.DATABASE_USER,
		"password" : process.env.DATABASE_PASS,
		"database" : process.env.DATABASE_NAME
	}
const pool = mysql.createPool(DATABASE);


const SALT_ROUNDS = 10;

module.exports = {
	insert		: _insert,
	update		: _update,
	delete		: _delete,
	selectOne	: _selectOne,
	selectAll	: _selectAll, 
	hash		: _hash,
	compare		: _compare
}

function _insert (sql, args) {
	
	return new Promise ((resolve, reject) => {
		pool.query(sql, args, (err, result) => {
			if(err) {
				return reject (err);
			}
			resolve(result);
		});
	});

}

function _update(sql, args) {
	
	return new Promise ((resolve, reject) => {
		pool.query(sql, args, (err, result) => {
			if(err) {
				return reject (err);
			}
			resolve(result);
		});
	});

}

function _delete(sql, args) {
	
	return new Promise ((resolve, reject) => {
		pool.query(sql, args, (err, result) => {
			if(err) {
				return reject (err);
			}
			resolve(result);
		});
	});

}

function _selectOne(sql, args) {
		
	return new Promise ((resolve, reject) => {
		pool.query(sql, args, (err, row) => {
			if(err) {
				return reject (err);
			}
			resolve(row[0]);
		});
	});

}

function _selectAll(sql, args) {
		
	return new Promise( (resolve, reject) => {
		pool.query(sql, args, (err, rows) => {
			if(err) {
				return reject (err);
			}
			resolve(rows);
		});
	});

}

function _hash(raw) {

	return new Promise( (resolve, reject) => {
		bcrypt.hash(raw, SALT_ROUNDS, (err, hash) => {
			if(err) {
				return reject(err);
			}
			resolve(hash);
		});
	});

}

function _compare(raw, hash) {

	return new Promise( (resolve, reject) => {
		bcrypt.compare(raw, hash, (err, result) => {
			if(err) {
				return reject(err);
			}
			resolve(result);
		});
	});
}
