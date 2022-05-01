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

// Import sub

// Import Router

// Libraries

const axios					= require('axios');

// Database 


// Exports
module.exports = {
	connect					: client_connect,
	sendInvoice				: client_sendInvoice,
	recreate				: client_recreate,
	withdraw				: client_withdraw,
	archive					: client_archive,
	trash					: client_trash,
	rollbackReturnToSent	: client_rollbackReturnToSent,
}


async function client_connect(client_host, supplier_uuid, client_uuid) {

    const url = `${client_host}/api/message/clientToConnect`;

    const params = {
        method : 'post',
        url : url,
        data : {
            supplier_uuid,
            client_uuid
        }
    };

    let response;
    try {
        response = await axios(params);
    } catch(err) {
        if(err.responce) {
            response = {
                status : err.response.status,
                data : err.message
            }
        } else {
            response = {
                status : 400,
                data : "Not found."
            }
        }
    }

    return [ response.status, response.data ];

}

async function client_sendInvoice(client_host, document, status) {

	const url = `${client_host}/api/message/clientToSend`;

    document.editable = 0;
    status.document_folder = 'sent';

    const params = {
        method : 'post',
        url : url,
        data : {
            document,
            status
        }
    };

    let response;
    try {
        response = await axios(params);
    } catch(err) {
        if(err.code === 'ECONNRESET') {
            response = {
                status : 500,
                data : 'ECONNRESET'
            }
        } else {
            response = {
                status : 400,
                data : "Not found."
            }
        }
    }

    return [ response.status, response.data ];

}

async function  client_recreate(client_host, document_uuid, supplier_uuid) {

	const url = `${client_host}/api/message/clientToRecreate`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            supplier_uuid
        }
    };

    let response;
    try {
        response = await axios(params);
    } catch(err) {
        if(err.code === 'ECONNRESET') {
            response = {
                status : 500,
                data : 'ECONNRESET'
            }
        } else {
            response = {
                status : 400,
                data : "Not found."
            }
        }
    }

    return [ response.status, response.data ];

}

async function  client_withdraw(client_host, document_uuid, client_uuid, document_folder) {

	const url = `${client_host}/api/message/clientToWithdraw`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            client_uuid,
			document_folder
        }
    };

    let response;
    try {
        response = await axios(params);
    } catch(err) {
        if(err.code === 'ECONNRESET') {
            response = {
                status : 500,
                data : 'ECONNRESET'
            }
        } else {
            response = {
                status : 400,
                data : "Not found."
            }
        }
    }

    return [ response.status, response.data ];

}


async function  client_archive(client_host, document_uuid, client_uuid) {

	const url = `${client_host}/api/message/clientToArchive`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            client_uuid
        }
    };

    let response;
    try {
        response = await axios(params);
    } catch(err) {
        if(err.code === 'ECONNRESET') {
            response = {
                status : 500,
                data : 'ECONNRESET'
            }
        } else {
            response = {
                status : 400,
                data : "Not found."
            }
        }
    }

    return [ response.status, response.data ];

}

async function  client_trash(client_host, document_uuid, client_uuid) {

    const params = {
        method : 'post',
        url : `${client_host}/api/message/clientToTrash`,
        data : {
            document_uuid,
            client_uuid
        }
    };

    let response;
    try {
        response = await axios(params);
    } catch(err) {
        if(err.code === 'ECONNRESET') {
            response = {
                status : 500,
                data : 'ECONNRESET'
            }
        } else {
            response = {
                status : 400,
                data : "Not found."
            }
        }
    }

    return [ response.status, response.data ];

}

/*
*  return to sent
*/
async function client_rollbackReturnToSent (client_host, document_uuid, client_uuid) {

    const url = `${client_host}/api/message/clientRollbackReturnToSent`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            client_uuid
        }
    };

    let response;
    try {
        response = await axios(params);
    } catch(err) {
        if(err.code === 'ECONNRESET') {
            response = {
                status : 500,
                data : 'ECONNRESET'
            }
        } else {
            response = err.response;
        }
    }
    if ( response == null) {
        let msg = "Not Found."
        response = {
            status : 404,
            data : msg
        }
    }

    return [ response.status, response.data ];

}

