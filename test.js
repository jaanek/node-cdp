const Web3 = require('web3');
const cdp = require('./index');

const options = {
  // privateKey: 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  privateKey: 'dd2c18527205b13a2bdb34707ed0f7a52440e5752f98e3c3642228305542f02d'
};

async function main() {
  // const privateKey = cdp.generatePrivateKey();
  // const address = cdp.getAddressFromPrivateKey(options.privateKey);
  // const ethBalance = await cdp.balance(options);
  // console.log(`Eth balance: `, cdp.getWeb3(options).utils.fromWei(String(ethBalance)));

  await cdp.open(options);
  // cdpId: 4550

}

main().catch(e => {
  console.log(e);
});
