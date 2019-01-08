const Wallet = require('ethereumjs-wallet');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const config = require('./config.js');
const abi = require('./contracts/abi');
const addressesJson = require('./contracts/addresses.json');

const TUB_ABI = abi.daiV1.tub;

// open a new CDP
async function open(options) {
  const web3 = getWeb3(options);
  const contractAddress = getContractAddress(getNetworkId(options), 'TUB');
  console.log(`open. contract address: ${contractAddress}`);
  const contract = new web3.eth.Contract(TUB_ABI, contractAddress);
  const data = contract.methods.open().encodeABI();
  const from = getAddressFromPrivateKey(options.privateKey);
  const tx = await createSignedTx(from, contractAddress, 0, options.privateKey, data, options);
  const receipt = await sendSignedTransaction(tx.tx, options);
  console.log(`open. tx receipt: `, receipt);
  return receipt;
}

async function balance(options) {
  return await getWeb3(options).eth.getBalance(getAddressFromPrivateKey(options.privateKey));
}

// utility functions
function getAddressFromPrivateKey(privateKey) {
  const wallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  return wallet.getChecksumAddressString();
}

function getContractAddress(networkId, contractName) {
  return addressesJson[networkId][contractName];
}

function getNetworkId(options) {
  return options.networkId ? String(options.networkId) : String(config.DEFAULT_NETWORK_ID);
}

function getWeb3(options) {
  if (options.web3) {
    return options.web3;
  }
  if (options.network === 'mainnet') {
    return new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/'));
  } else {
    return new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/'));
  }
}

async function sendSignedTransaction(tx, options) {
  return await getWeb3(options).eth.sendSignedTransaction('0x' + tx.toString('hex'));
}

async function createSignedTx(src, dst, value, privateKey, data, options) {
  const web3 = getWeb3(options);
  const nonce = web3.utils.numberToHex(await web3.eth.getTransactionCount(src, 'pending'));
  const gasPriceHex = web3.utils.numberToHex(options.gasPrice || await web3.eth.getGasPrice());
  const gasLimitHex = web3.utils.numberToHex(options.gasLimit || config.DEFAULT_GAS_LIMIT);
  const valueHex = web3.utils.numberToHex(web3.utils.toWei(String(value), config.DEFAULT_VALUE_UNIT));
  const params = {
    gasPrice: gasPriceHex,
    gasLimit: gasLimitHex,
    from: src,
    to: dst,
    value: valueHex,
    nonce: nonce
  };
  if (data) {
    params.data = data;
  }
  const tx = new Tx(params);
  tx.sign(Buffer.from(privateKey, 'hex'));

  return {
    tx: tx.serialize(),
    params: params
  };
}

module.exports = {
  open,
  balance,
  getWeb3
};
