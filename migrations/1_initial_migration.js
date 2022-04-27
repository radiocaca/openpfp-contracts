const CurrencyManager = artifacts.require('CurrencyManager.sol');
const ExecutionManager = artifacts.require('ExecutionManager.sol');
const StrategyStandardSaleForFixedPrice = artifacts.require('StrategyStandardSaleForFixedPrice.sol');
const RoyaltyFeeRegistry = artifacts.require('RoyaltyFeeRegistry.sol');
const RoyaltyFeeSetter = artifacts.require('RoyaltyFeeSetter.sol');
const RoyaltyFeeManager = artifacts.require('RoyaltyFeeManager.sol');

module.exports = function (deployer) {
  // 1. deploy CurrencyManager
  deployer.deploy(CurrencyManager);

  // 2. deploy ExecutionManager
  deployer.deploy(ExecutionManager);
  deployer.deploy(StrategyStandardSaleForFixedPrice, 0);

  // 3. deploy royalty
  deployer.deploy(RoyaltyFeeRegistry, 9500).then(function () {
    deployer.deploy(RoyaltyFeeSetter, RoyaltyFeeRegistry.address);
    return deployer.deploy(RoyaltyFeeManager, RoyaltyFeeRegistry.address);
  });
};
