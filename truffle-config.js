const HDWalletProvider = require('@truffle/hdwallet-provider');

const privatekey = '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*',
    },
    ropsten: {
      provider: () => new HDWalletProvider([privatekey], 'https://ropsten.infura.io/v3/'),
      network_id: '3',
      gas: 8000000,
      gasPrice: 10000000000,
      skipDryRun: true,
    },
    live: {
      provider: () => new HDWalletProvider([privatekey], 'https://mainnet.infura.io/v3/'),
      network_id: '1',
      gas: 8000000,
      skipDryRun: true,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.8.11', // Fetch exact version from solc-bin (default: truffle's version)
      settings: { // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 100,
        },
        evmVersion: 'istanbul',
      },
    },
  },
  plugins: ['truffle-plugin-verify'],
  api_keys: {
    etherscan: ETHERSCAN_API_KEY,
  },
};
