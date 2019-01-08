const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const Wallet = require('ethereumjs-wallet');
const ethers = require('ethers');
const BigNumber = require('bignumber.js');
const config = require('./config.js');
const networks = require('./contracts/networks');
const {RAY} = require('./constants');

// open a new CDP
async function open(options) {
  const contract = getContract('SAI_TUB', options);
  const data = contract.methods.open().encodeABI();
  const from = getAddressFromPrivateKey(options.privateKey);
  console.log(`open. from: ${from}, to: ${contract._address}, data: `, data);
  const tx = await createSignedTx(from, contract._address, 0, options.privateKey, data, options);
  const receipt = await sendSignedTransaction(tx.tx, options);
  console.log(`open. tx receipt: `, receipt);
  return receipt;
}

// create weth
async function createWeth(amount, options) {
  const contract = getContract('WETH', options);
  const data = contract.methods.deposit().encodeABI();
  const from = getAddressFromPrivateKey(options.privateKey);
  console.log(`create weth. from: ${from}, to: ${contract._address}, data: `, data);
  const tx = await createSignedTx(from, contract._address, amount, options.privateKey, data, options);
  const receipt = await sendSignedTransaction(tx.tx, options);
  console.log(`create weth. tx receipt: `, receipt);
  return receipt;
}

async function getWethBalance(options) {
  const contract = getContract('WETH', options);
  const from = getAddressFromPrivateKey(options.privateKey);
  const balance = await contract.methods.balanceOf(from).call({from: from});
  return balance;
  // return new BigNumber(bn.toString()).dividedBy(RAY).toNumber();
}

async function getWethToPethRatio(options) {
  const contract = getContract('SAI_TUB', options);
  const from = getAddressFromPrivateKey(options.privateKey);
  const bn = await contract.methods.per().call({from: from});
  return new BigNumber(bn.toString()).dividedBy(RAY).toNumber();
}

async function tubAsk(amount, options) {
  const value = '0x' + BigNumber(amount).shiftedBy(18).toString(16);
  console.log(`join. value: `, value);
  const contract = getContract('SAI_TUB', options);
  const from = getAddressFromPrivateKey(options.privateKey);
  const bn = await contract.methods.ask(value).call({from: from});
  return new BigNumber(bn.toString()).dividedBy(RAY).toNumber();
}

// create peth from weth
async function join(amount, options) {
  const value = BigNumber(amount).shiftedBy(18).toString();
  console.log(`join. value: `, value);
  const contract = getContract('SAI_TUB', options);
  const data = contract.methods.join(value).encodeABI();
  const from = getAddressFromPrivateKey(options.privateKey);
  console.log(`join. from: ${from}, to: ${contract._address}, data: `, data);
  const tx = await createSignedTx(from, contract._address, 0, options.privateKey, data, options);
  const receipt = await sendSignedTransaction(tx.tx, options);
  console.log(`join. tx receipt: `, receipt);
  return receipt;
}

// lock peth
async function lockPeth(cdpId, amount, options) {
  const hexCdpId = numberToBytes32(cdpId);
  const value = toEthersBigNumber(BigNumber(amount), 'wei');
  const contract = getContract('SAI_TUB', options);
  const data = contract.methods.lock(hexCdpId, value).encodeABI();
  const from = getAddressFromPrivateKey(options.privateKey);
  console.log(`lockPeth. from: ${from}, to: ${contract._address}, data: `, data);
  const tx = await createSignedTx(from, contract._address, 0, options.privateKey, data, options);
  const receipt = await sendSignedTransaction(tx.tx, options);
  console.log(`lockPeth. tx receipt: `, receipt);
  return receipt;
}

// draw dai
async function drawDai(cdpId, amount, options) {
  const hexCdpId = numberToBytes32(cdpId);
  const value = toEthersBigNumber(BigNumber(amount), 'wei');
  const contract = getContract('SAI_TUB', options);
  const data = contract.methods.draw(hexCdpId, value).encodeABI();
  const from = getAddressFromPrivateKey(options.privateKey);
  console.log(`drawDai. from: ${from}, to: ${contract._address}, data: `, data);
  const tx = await createSignedTx(from, contract._address, 0, options.privateKey, data, options);
  const receipt = await sendSignedTransaction(tx.tx, options);
  console.log(`drawDai. tx receipt: `, receipt);
  return receipt;
}

// utility functions
function getContract(name, options) {
  const web3 = getWeb3(options);
  const networkName = options.network ? String(options.network) : String(config.DEFAULT_NETWORK);
  const network = networks[networkName] ? networks[networkName] : networks[config.DEFAULT_NETWORK];
  const ci = network.contracts[name];
  return new web3.eth.Contract(ci.abi, ci.address);
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

async function tokenBalance(options) {
  const contract = getContract('SAI_TUB', options);
  const from = getAddressFromPrivateKey(options.privateKey);
  const address = await contract.methods.gem().call({from: from});
  return address;
}

async function balance(options) {
  return await getWeb3(options).eth.getBalance(getAddressFromPrivateKey(options.privateKey));
}

async function generatePrivateKey() {
  const wallet = Wallet.generate();
  return wallet.getPrivateKeyString();
}

function toEthersBigNumber(amount, shift = 0) {
  if (shift === 'wei') shift = 18;
  if (shift === 'ray') shift = 27;

  // always round down so that we never attempt to spend more than we have
  const val = amount.shiftedBy(shift).integerValue(BigNumber.ROUND_DOWN).toFixed();
  try {
    return ethers.utils.bigNumberify(val);
  } catch (err) {
    throw new Error(`couldn't bigNumberify ${val}`);
  }
}

function numberToBytes32(num) {
  const bn = ethers.utils.bigNumberify(num);
  return ethers.utils.hexlify(ethers.utils.padZeros(bn, 32));
}

module.exports = {
  open,
  createWeth,
  getWethToPethRatio,
  tubAsk,
  join,
  balance,
  getWethBalance,
  getWeb3,
  generatePrivateKey,
  getAddressFromPrivateKey,
  tokenBalance
};
