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

'use strict'

// Import sub

// Import Router

// Libraries

const axios = require('axios')

// Database

// Exports
module.exports = {
    connect: buyer_connect,
    rollbackReturnToSent: buyer_rollbackReturnToSent,
}

//------------------------------- export modules ------------------------------

/*
 * buyer_connect
 */
async function buyer_connect(buyer_host, seller_did, buyer_did) {
    console.log(buyer_host)
    const url = `${buyer_host}/api/message/buyerToConnect`

    const params = {
        method: 'post',
        url: url,
        data: {
            seller_did,
            buyer_did,
        },
    }

    let response
    try {
        response = await axios(params)
    } catch (err) {
        if (err.responce) {
            response = {
                status: err.response.status,
                data: err.message,
            }
        } else {
            response = {
                status: 400,
                data: 'Not found.',
            }
        }
    }

    return [response.status, response.data]
}

/*
 *  buyer_rollbackReturnToSent
 */
async function buyer_rollbackReturnToSent(
    buyer_host,
    document_uuid,
    buyer_did
) {
    const url = `${buyer_host}/api/message/buyerRollbackReturnToSent`

    const params = {
        method: 'post',
        url: url,
        data: {
            document_uuid,
            buyer_did,
        },
    }

    let response
    try {
        response = await axios(params)
    } catch (err) {
        if (err.code === 'ECONNRESET') {
            response = {
                status: 500,
                data: 'ECONNRESET',
            }
        } else {
            response = err.response
        }
    }
    if (response == null) {
        let msg = 'Not Found.'
        response = {
            status: 404,
            data: msg,
        }
    }

    return [response.status, response.data]
}
