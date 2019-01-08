const tokens = require('./tokens');
const contracts = require('./contracts');
const kovanAddresses = require('./kovan.json');
const mainnetAddresses = require('./mainnet.json');
const abis = require('./abi');

function contractInfo(network) {
  let addresses;
  switch (network) {
  case 'mainnet':
    addresses = mainnetAddresses;
    break;
  default:
    addresses = kovanAddresses;
    break;
  }

  return {
    [tokens.DAI]: {
      version: 1,
      address: addresses.SAI,
      abi: abis.general.erc20,
      decimals: 18
    },
    [tokens.WETH]: {
      version: 1,
      address: addresses.GEM,
      abi: abis.dappHub.dsEthToken,
      decimals: 18
    },
    [tokens.PETH]: {
      version: 1,
      address: addresses.SKR,
      abi: abis.general.erc20,
      decimals: 18
    },

    // SAI
    [contracts.SAI_TUB]: { version: 1, address: addresses.TUB, abi: abis.daiV1.tub },
  };
}

module.exports = {
  mainnet: { name: 'mainnet', networkId: 1, contracts: contractInfo('mainnet') },
  kovan: { name: 'kovan', networkId: 42, contracts: contractInfo('kovan') }
};
