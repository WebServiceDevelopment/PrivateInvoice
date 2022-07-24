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
	connect					: seller_connect,
	unconfirm				: seller_unconfirm,
	paymentReservation		: seller_paymentReservation,
	cancelPaymentReservation: seller_cancelPaymentReservation,

	rollbackReturnToSent	: seller_rollbackReturnToSent,
	rollbackConfirmToSent	: seller_rollbackConfirmToSent,
	rollbackSentToConfirm	: seller_rollbackSentToConfirm,
	rollbackPaidToConfirm	: seller_rollbackPaidToConfirm,

	getAccountOfSellerWallet: _getAccountOfSellerWallet,
}

//------------------------------- export modules -------------------------------

/*
 * getAccountOfSellerWallet
 */
async function _getAccountOfSellerWallet(seller_host, seller_did, buyer_did) {

    const  url = `${seller_host}/api/message/tellMeYourWalletAccount`;

    const params = {
        method : 'post',
        url : url,
        data : {
            seller_did,
            buyer_did
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
 * seller_connect
 */
async function seller_connect(seller_host, document_uuid, buyer_did) {

    const  url = `${seller_host}/api/message/sellerToConnect`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_did
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
 * seller_unconfirm
 */
async function seller_unconfirm(seller_host, document_uuid, buyer_did) {

    const url = `${seller_host}/api/message/sellerToUnconfirm`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_did
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
* paymentReservation
*/
async function seller_paymentReservation(seller_host, document_uuid, buyer_did) {

    const url = `${seller_host}/api/message/sellerToPaymentReservation`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_did
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
* cancelPaymentReservation
*/
async function seller_cancelPaymentReservation(seller_host, document_uuid, buyer_did) {

    const url = `${seller_host}/api/message/sellerToCancelPaymentReservation`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_did
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
async function seller_rollbackReturnToSent(seller_host, document_uuid, buyer_did) {

    const url = `${seller_host}/api/message/sellerRollbackReturnToSent`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_did
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
async function seller_rollbackConfirmToSent(seller_host, document_uuid, buyer_did) {

    const url = `${seller_host}/api/message/sellerRollbackConfirmToSent`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_did
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
async function seller_rollbackSentToConfirm(seller_host, document_uuid, buyer_did) {

    const url = `${seller_host}/api/message/sellerRollbackSentToConfirm`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_did
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
async function seller_rollbackPaidToConfirm(seller_host, document_uuid, buyer_did) {

    const url = `${seller_host}/api/message/sellerRollbackPaidToConfirm`;

    const params = {
        method : 'post',
        url : url,
        data : {
            document_uuid,
            buyer_did
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
