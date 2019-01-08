const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const Wallet = require('ethereumjs-wallet');
const config = require('./config.js');
const networks = require('./contracts/networks');

// open a new CDP
async function open(options) {
  const web3 = getWeb3(options);
  const ci = getContractInfo('SAI_TUB', options);
  console.log(`open! address: ${ci.address}, abi: `, ci.abi, ci.length);
  const contract = new web3.eth.Contract(ci.abi, ci.address);
  const data = contract.methods.open().encodeABI();
  const from = getAddressFromPrivateKey(options.privateKey);
  console.log(`open. from: ${from}, to: ${ci.address}, data: `, data);
  const tx = await createSignedTx(from, ci.address, 0, options.privateKey, data, options);
  const receipt = await sendSignedTransaction(tx.tx, options);
  console.log(`open. tx receipt: `, receipt);
  return receipt;
}

// utility functions
function getContractInfo(name, options) {
  const networkName = options.network ? String(options.network) : String(config.DEFAULT_NETWORK);
  const network = networks[networkName] ? networks[networkName] : networks[config.DEFAULT_NETWORK];
  return network.contracts[name];
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

function getAddressFromPrivateKey(privateKey) {
  const wallet = Wallet.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  return wallet.getChecksumAddressString();
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

async function balance(options) {
  return await getWeb3(options).eth.getBalance(getAddressFromPrivateKey(options.privateKey));
}

async function generatePrivateKey() {
  const wallet = Wallet.generate();
  return wallet.getPrivateKeyString();
}

module.exports = {
  open,
  balance,
  getWeb3,
  generatePrivateKey,
  getAddressFromPrivateKey
};
