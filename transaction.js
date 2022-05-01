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

const configStr = fs.readFileSync('config.json').toString();
const config = JSON.parse(configStr);
config.DATABASE.database = process.env.DATABASE_NAME;
const SALT_ROUNDS = 10;


module.exports = {
	beginTransaction : _beginTransaction,
	commit			: _commit,
	connection		: _connection,
	delete			: _delete,
	insert			: _insert,
	query			: _query,
	rollback		: _rollback,
	selectOne		: _selectOne,
	selectAll		: _selectAll,
	update			: _update,
}

function _beginTransaction(connection) {
	return new Promise((resolve, reject) => {
		connection.beginTransaction((err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
}

function _commit (connection) {
 	return new Promise((resolve, reject) => {
		connection.commit((err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});
}

function _connection () {
	return mysql.createConnection(config.DATABASE);
}

function _delete (connection, sql, args) {
    return new Promise ((resolve, reject) => {
        connection.query(sql, args, (err, result) => {
            if(err) {
                return reject (err);
            }
            resolve(result);
        });
    });
}

function _insert (connection, sql, args) {
    return new Promise ((resolve, reject) => {
        connection.query(sql, args, (err, result) => {
            if(err) {
                return reject (err);
            }
            resolve(result);
        });
    });
}

function _query (connection, statement, params) {
	return new Promise((resolve, reject) => {
		connection.query(statement, params, (err, results, fields) => {
			if (err) {
				reject(err);
			}
			resolve([results, fields]);
		});
	});
}

function _rollback (connection, err) {
	return new Promise((resolve, reject) => {
		connection.rollback(() => {
			if (err) {
				reject(err);
			}
			resolve();
		});
	});
}

function _selectOne (connection, sql, args) {
    return new Promise ((resolve, reject) => {
        connection.query(sql, args, (err, row) => {
            if(err) {
                return reject (err);
            }
            resolve(row[0]);
        });
    });
}

function _selectAll (connection, sql, args) {
    return new Promise( (resolve, reject) => {
        connection.query(sql, args, (err, rows) => {
            if(err) {
                return reject (err);
            }
            resolve(rows);
        });
    });
}

function _update (connection, sql, args) {
    return new Promise ((resolve, reject) => {
        connection.query(sql, args, (err, result) => {
            if(err) {
                return reject (err);
            }
            resolve(result);
        });
   });
}

