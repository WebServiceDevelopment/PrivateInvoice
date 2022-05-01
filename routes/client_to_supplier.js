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
const axios                 = require('axios')


// Database


// Exports
module.exports = {
	connect					: supplier_connect,
	confirm 				: supplier_confirm,
	unconfirm				: supplier_unconfirm,
	paymentReservation		: supplier_paymentReservation,
	makePayment				: supplier_makePayment,
	return					: supplier_return,

	rollbackReturnToSent	: supplier_rollbackReturnToSent,
	rollbackConfirmToSent	: supplier_rollbackConfirmToSent,
	rollbackSentToConfirm	: supplier_rollbackSentToConfirm,
	rollbackPaidToConfirm	: supplier_rollbackPaidToConfirm,

}


async function supplier_connect(supplier_host, document_uuid, client_uuid) {

    const  url = `${supplier_host}/api/message/supplierToConnect`;

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
        if(err.responce) {
            response = {
                status : err.response.status,
                data : err.message
            }
        } else {
            response = {
                status : 500,
                data : null
            }
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

/*
* sent to confirm
*/
async function supplier_confirm(supplier_host, document_uuid, client_uuid) {

    const url = `${supplier_host}/api/message/supplierToConfirm`;

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



async function supplier_unconfirm(supplier_host, document_uuid, client_uuid) {

    const url = `${supplier_host}/api/message/supplierToUnconfirm`;

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

async function supplier_makePayment(supplier_host, document_uuid, client_uuid) {

    const url = `${supplier_host}/api/message/supplierToMakePayment`;

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

async function supplier_paymentReservation(supplier_host, document_uuid, client_uuid) {

    const url = `${supplier_host}/api/message/supplierToPaymentReservation`;

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

/*
* sent to return
*/
async function supplier_return(supplier_host, document_uuid, client_uuid) {

    const url = `${supplier_host}/api/message/supplierToReturn`;

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

/*
*  return to sent
*/
async function supplier_rollbackReturnToSent(supplier_host, document_uuid, client_uuid) {

    const url = `${supplier_host}/api/message/supplierRollbackReturnToSent`;

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

/*
* confirm to sent
*/
async function supplier_rollbackConfirmToSent(supplier_host, document_uuid, client_uuid) {

    const url = `${supplier_host}/api/message/supplierRollbackConfirmToSent`;

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

/*
* sent to confirm
*/
async function supplier_rollbackSentToConfirm(supplier_host, document_uuid, client_uuid) {

    const url = `${supplier_host}/api/message/supplierRollbackSentToConfirm`;

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

/*
* paid to confirm
*/
async function supplier_rollbackPaidToConfirm(supplier_host, document_uuid, client_uuid) {

    const url = `${supplier_host}/api/message/supplierRollbackPaidToConfirm`;

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
