const rfpModule= {}


rfpModule.createDidElement = (mnemonic, hdpath) => {

	// didUtil.js -> _createDidKey
	
}

rfpModule.createDidElement = (mnemonic, hdpath) => {

	// didUtil.js -> _createDidElem
	
}

rfpModule.issueCredential = (did, mnemonic, hdpath, unsignedCredential) => {
	
	// sign_your_credentials.js -> _signBusinessCard
	// sign_your_credentials.js -> _signInvoice
	// sign_your_credentials.js -> _signStatusMessage

}

rfpModule.verifyCredential = (signedCredential) => {

	// ./verify_utils.js verifyCredential

}

rfpModule.preparePresentation = (did, mnemonic, hdpath, unsignedPresentation) => {

	// sign_your_credentials.js -> signPresentation

}

rfpModule.sendEthereum = (mnemonic, hdpath, amount) => {
	
	// web3_eth.js -> _sendTransaction
	// web3_eth.js -> _sendSignedTransaction

	
}

rfpModule.checkEthereumBalance = (mnemonic, hdpath, amount) => {

	// web3_eth.js -> _getBalance
	
}


module.exports = rfpModule
