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
	connect					: buyer_connect,
	sendInvoice				: buyer_sendInvoice,
	recreate				: buyer_recreate,
	withdraw				: buyer_withdraw,
	archive					: buyer_archive,
	trash					: buyer_trash,
	rollbackReturnToSent	: buyer_rollbackReturnToSent,
}

//------------------------------- export modules ------------------------------

/*
 * buyer_connect
 */
async function buyer_connect(buyer_host, seller_uuid, buyer_uuid) {

    const url = `${buyer_host}/api/message/buyerToConnect`;

    const params = {
        method : 'post',
        url : url,
        data : {
            seller_uuid,
            buyer_uuid
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

/*
 * buyer_sendInvoice
 */
async function buyer_sendInvoice(buyer_host, document, status) {

	const url = `${buyer_host}/api/message/buyerToSend`;

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

/*
 * buyer_recreate
 */
async function  buyer_recreate(buyer_host, document_uuid, seller_uuid) {

	const url = `${buyer_host}/api/message/buyerToRecreate`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            seller_uuid
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
 * buyer_withdraw
 */
async function  buyer_withdraw(buyer_host, document_uuid, buyer_uuid, document_folder) {

	const url = `${buyer_host}/api/message/buyerToWithdraw`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_uuid,
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

/*
 * buyer_archive
 */
async function  buyer_archive(buyer_host, document_uuid, buyer_uuid) {

	const url = `${buyer_host}/api/message/buyerToArchive`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_uuid
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
 * buyer_trash
 */
async function  buyer_trash(buyer_host, document_uuid, buyer_uuid) {

    const params = {
        method : 'post',
        url : `${buyer_host}/api/message/buyerToTrash`,
        data : {
            document_uuid,
            buyer_uuid
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
*  buyer_rollbackReturnToSent
*/
async function buyer_rollbackReturnToSent (buyer_host, document_uuid, buyer_uuid) {

    const url = `${buyer_host}/api/message/buyerRollbackReturnToSent`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_uuid
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

