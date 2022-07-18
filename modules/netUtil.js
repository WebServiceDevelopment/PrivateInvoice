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

//
const os					= require('os');
const net					= os.networkInterfaces();


// Database Libraries

// Exports 
module.exports = {
	getLocalIp 				: _getLocalIp,
}

// Constant



//------------------------------- export modules ------------------------------

/*
 * _getLocalIp
 * Find ipv4 addres for own node.
 */

function _getLocalIp (_mask) {
	const mask = _mask || 24;
	
    for(let key in net) {
        for(let key2 in net[key]) {
            for(let key3 in net[key][key2]) {
                if(key3 == "cidr") {
                    if(net[key][key2][key3].indexOf("/") !==-1) {
                        let ip = net[key][key2][key3].split("/");
                        if(ip[1] == mask) {
                            return ip[0];
                        }
                    }
                }
            }
        }
    }
}
