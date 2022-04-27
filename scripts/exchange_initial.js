const ethers = require('ethers');

const royaltyFeeRegistryABI = require('../build/contracts/RoyaltyFeeRegistry.json');
const currencyManagerABI = require('../build/contracts/CurrencyManager.json');
const executionManagerABI = require('../build/contracts/ExecutionManager.json');
const openPFPExchangeABI = require('../build/contracts/OpenPFPExchangeUpgradeable.json');

const royaltyFeeRegistryAddress = '0x9f18709F7D3A50350745514aeca7696d489A3Fa3';
const royaltyFeeSetterAddress = '0xDb09f406A67D5726dd255c8b61c5dC93472056C3';
const royaltyFeeManagerAddress = '0x50B44c44B85268Ee636f157aef722bE3c31B3a4E';

const currencyManagerAddress = '0x1E8f17f256AFBc5d2Af9395A89a345B47DbB8704';
const executionManagerAddress = '0xd0eb0FA3436e9FAe604be9376675B44b92f72c7a';
const strategyStandardSaleForFixedPriceAddress = '0xC88822a9D68ebAf396C2B5B39961F706FaD9a3f3';

const transferManagerNonCompliantERC721Address = '0xf7A583F8A08537a359942dFaB3B3566E88bD6497';
const transferManagerERC1155Address = '0x570D7406b9C394F1446fB531aC7cfbE29b30731F';
const transferSelectorNFTAddress = '0xCE41DEDe5421013951Ea5D31209C9EfccbB7B22E';

// const proxyAdminAddress = '0x1D83aC0b74A9BdCA5E4C5FAaD39585542E22E3Df';
// const OpenPFPExchangeUpgradeableAddress = '0x06E33205363ea489830919910FdabbE065D9EF77';
// const transparentUpgradeableProxyAddress = '0xfCf25150873E65F626aAC31f459d2f5b11306D81';
const openPFPExchangeAddress = '0xfCf25150873E65F626aAC31f459d2f5b11306D81';

const wETH = '0xf70949bc9b52deffcda63b0d15608d601e3a7c49';
const protocolFeeRecipient = '0xF2Aa10E85a5a844d2e27A9F3A612A13a1D0DEEc0';

const caller = '';
const privateKey = '';
const raca = '0x9123A74E7c004b2110b97C4CC3758579B59464d2';

const ropstenNetwork = 'https://ropsten.infura.io/v3/';

const ropstenProvider = new ethers.providers.JsonRpcProvider(ropstenNetwork);
const ethWallet = new ethers.Wallet(privateKey, ropstenProvider);

function wait (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function initRoyalty () {
  const royaltyFeeRegistryInstance = new ethers.Contract(
    royaltyFeeRegistryAddress,
    royaltyFeeRegistryABI.abi,
    ethWallet,
  );

  console.log('old royaltyFeeRegistry owner:', await royaltyFeeRegistryInstance.owner());

  // const options = {
  //   gasPrice: ethers.utils.parseUnits('5', 'gwei'),
  //   gasLimit: 500000,
  //   nonce: nonce,
  // };
  const result = await royaltyFeeRegistryInstance.transferOwnership(royaltyFeeSetterAddress);
  console.log('transferOwnership result:', result);

  await wait(20000);
  console.log('new royaltyFeeRegistry owner:', await royaltyFeeRegistryInstance.owner());
}

async function initCurrencyManager () {
  const currencyManagerInstance = new ethers.Contract(
    currencyManagerAddress,
    currencyManagerABI.abi,
    ethWallet,
  );

  const result = await currencyManagerInstance.addCurrency(raca);
  console.log('addCurrency result:', result);

  await wait(20000);
  console.log('isCurrencyWhitelisted:', await currencyManagerInstance.isCurrencyWhitelisted(raca));
}

async function initExecutionManager () {
  const executionManagerInstance = new ethers.Contract(
    executionManagerAddress,
    executionManagerABI.abi,
    ethWallet,
  );

  const result = await executionManagerInstance.addStrategy(strategyStandardSaleForFixedPriceAddress);
  console.log('addStrategy result:', result);

  await wait(20000);
  console.log('isStrategyWhitelisted:',
    await executionManagerInstance.isStrategyWhitelisted(strategyStandardSaleForFixedPriceAddress));
}

async function initOpenPFPExchange () {
  const openPFPExchangeInstance = new ethers.Contract(
    openPFPExchangeAddress,
    openPFPExchangeABI.abi,
    ethWallet,
  );

  const result = await openPFPExchangeInstance.setParams(currencyManagerAddress, executionManagerAddress,
    royaltyFeeManagerAddress, wETH, protocolFeeRecipient);
  console.log('updateTransferSelectorNFT result:', result);

  const result2 = await openPFPExchangeInstance.updateTransferSelectorNFT(transferSelectorNFTAddress);
  console.log('updateTransferSelectorNFT result:', result2);

  await wait(20000);
  console.log('transferSelectorNFT:', await openPFPExchangeInstance.transferSelectorNFT());
}

async function main () {
  await initCurrencyManager();
  await initExecutionManager();
  await initRoyalty();
  await initOpenPFPExchange();
}

main();
