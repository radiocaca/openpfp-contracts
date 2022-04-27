const OpenPFPExchange = artifacts.require('OpenPFPExchange.sol');

module.exports = function (deployer) {
  const royaltyFeeManagerAddress = '0x50B44c44B85268Ee636f157aef722bE3c31B3a4E';
  const currencyManagerAddress = '0x1E8f17f256AFBc5d2Af9395A89a345B47DbB8704';
  const executionManagerAddress = '0xd0eb0FA3436e9FAe604be9376675B44b92f72c7a';
  const wETH = '0xf70949bc9b52deffcda63b0d15608d601e3a7c49';
  const protocolFeeRecipient = '0xF2Aa10E85a5a844d2e27A9F3A612A13a1D0DEEc0';
  deployer.deploy(OpenPFPExchange, currencyManagerAddress, executionManagerAddress, royaltyFeeManagerAddress, wETH, protocolFeeRecipient);
};
