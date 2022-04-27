const ProxyAdmin = artifacts.require('ProxyAdmin.sol');
const TransparentUpgradeableProxy = artifacts.require('TransparentUpgradeableProxy.sol');
const OpenPFPExchangeUpgradeable = artifacts.require('OpenPFPExchangeUpgradeable.sol');

module.exports = function (deployer) {
  // 1. deploy proxy admin
  deployer.deploy(ProxyAdmin);

  // 2. deploy logic contract
  deployer.deploy(OpenPFPExchangeUpgradeable).then(function () {
    // 3. deploy proxy contract, params：[logic、 admin、logic initialize function]
    return deployer.deploy(TransparentUpgradeableProxy, OpenPFPExchangeUpgradeable.address, ProxyAdmin.address, '0x8129fc1c');
  });
};
