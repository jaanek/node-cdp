const erc20 = require('./ERC20.json');
const dsEthToken = require('./WETH9.json');
const tub = require('./sai-tub.json');

const daiV1 = {
  tub
};

const dappHub = {
  dsEthToken,
};

const general = {
  erc20
};

module.exports = {
  daiV1,
  dappHub,
  general
};
