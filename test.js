const Web3 = require('web3');
const cdp = require('./index');

const options = {
  privateKey: 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'
};

async function main() {
  await cdp.open(options);
}

main().catch(e => {
  console.log(e);
});
