const Web3 = require('web3');

// Transfer イベントを取得するための最低限の ABI
const TOKEN_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]

// Settings
const TOKEN_ADDRESS = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0"  // トークンコントラクトのアドレス
const EOA_ADDRESS = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"    // EOA のアドレス
const FROM_BLOCK = 0
const TO_BLOCK = 1000000
const PROVIDER = 'http://192.168.1.122:9545'

// Web3 初期化
const web3 = new Web3(PROVIDER)
console.log(web3.version)

async function getTokenTransferHistory(tokenAbi, tokenContractAddress, fromAddress, fromBlock, toBlock) {
  const contract = new web3.eth.Contract(tokenAbi, tokenContractAddress)
  const events = await contract.getPastEvents("Transfer", {
    fromBlock: fromBlock,
    toBlock: toBlock,
    filter: {from: fromAddress}
  })

  if (events) {
    for (let event of events) {
      data = {
        from: event.returnValues.from,
        to: event.returnValues.to,
        value: web3.utils.fromWei(event.returnValues.value)
      }
      console.log(data)
    }
  }

}

getTokenTransferHistory(TOKEN_ABI, TOKEN_ADDRESS, EOA_ADDRESS, FROM_BLOCK, TO_BLOCK)

