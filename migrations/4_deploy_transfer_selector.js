const TransferManagerNonCompliantERC721 = artifacts.require('TransferManagerNonCompliantERC721.sol');
const TransferManagerERC1155 = artifacts.require('TransferManagerERC1155.sol');
const TransferSelectorNFT = artifacts.require('TransferSelectorNFT.sol');

module.exports = function (deployer) {
  const openPFPExchangeAddress = '0xfCf25150873E65F626aAC31f459d2f5b11306D81';

  deployer.deploy(TransferManagerNonCompliantERC721, openPFPExchangeAddress);
  deployer.deploy(TransferManagerERC1155, openPFPExchangeAddress).then(function () {
    return deployer.deploy(TransferSelectorNFT, TransferManagerNonCompliantERC721.address, TransferManagerERC1155.address);
  });
};
