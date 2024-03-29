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
 
 Author: Kousei Ogawa (kogawa@wsd.co.jp)

**/

'use strict'

const wallet = require('@sidetree/wallet')

const Web3 = require('web3')
const web3 = new Web3(process.env.GANACHE_ADDRESS)
const { eth } = web3

/*
did:key Return Type
{
  id: 'did:key:zQ3shrDYhuSEm8mC1P7wT4MFgnJQDj614CQhsVi8Rozgmz4o5#zQ3shrDYhuSEm8mC1P7wT4MFgnJQDj614CQhsVi8Rozgmz4o5',
  type: 'JsonWebKey2020',
  controller: 'did:key:zQ3shrDYhuSEm8mC1P7wT4MFgnJQDj614CQhsVi8Rozgmz4o5',
  publicKeyJwk: {
    kty: 'EC',
    crv: 'secp256k1',
    x: 'rAGlFqQT_nE4UPVZ53DNK4bIBs5IZtI7tj3B0eaWaCQ',
    y: '6V0x2XNWJ5iyoVoa6mOzDPvLglRlmABTXtM6FKmcqMk'
  },
  privateKeyJwk: {
    kty: 'EC',
    crv: 'secp256k1',
    x: 'rAGlFqQT_nE4UPVZ53DNK4bIBs5IZtI7tj3B0eaWaCQ',
    y: '6V0x2XNWJ5iyoVoa6mOzDPvLglRlmABTXtM6FKmcqMk',
    d: 'mmQy6rbP_Bvcl3U9ZLqnnXDVYf6n7di1ey60Ya_LgQs'
  },
  '@context': [ 'https://w3id.org/wallet/v1' ],
  name: 'Sidetree Key',
  image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  description: 'Generated by @sidetree/wallet.',
  tags: []
}
*/

const createDidKey = async (
    mnemonic, //string
    hdPathIndex // number
) => {
    const keyType = 'Ed25519'
    const hdPath = `m/44'/60'/0'/0/${hdPathIndex}`
    const key = await wallet.toKeyPair(mnemonic, keyType, hdPath)
    return key
}

const insertFunds = async (
    memberAddress // string
) => {
    // 0.1 ETH in Wei
    const UNIT_VALUE = 100000000000000000
    const AMOUNT = Math.floor(Math.random() * 3) + 2
    const WEI_TO_SEND = UNIT_VALUE * AMOUNT

    const accounts = await eth.getAccounts()
    const [sourceAddress] = accounts
    const gasPrice = await eth.getGasPrice()

    const sourceBalanceStart = await eth.getBalance(sourceAddress)
    console.log('Source Balance(start): ', sourceBalanceStart)

    const transactionObj = {
        from: sourceAddress,
        to: memberAddress,
        value: WEI_TO_SEND,
    }

    const transaction = await eth.sendTransaction(transactionObj)

    const sourceBalanceEnd = await eth.getBalance(sourceAddress)
    console.log('Source Balance(end): ', sourceBalanceEnd)

    const memberBalance = await eth.getBalance(memberAddress)
    console.log('Member Balance: ', memberBalance)
}

module.exports = {
    createDidKey,
    insertFunds,
}
