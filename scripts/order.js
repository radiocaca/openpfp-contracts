const ethers = require('ethers');
const { TypedDataUtils } = require('ethers-eip712');

const openPFPExchangeABI = require('../build/contracts/OpenPFPExchangeUpgradeable.json');
const transferSelectorNFTABI = require('../build/contracts/ITransferSelectorNFT.json');
const erc721ABI = require('../build/contracts/IERC721.json');
const erc20ABI = require('../build/contracts/IERC20.json');

const openPFPExchangeAddress = '0xfCf25150873E65F626aAC31f459d2f5b11306D81';
const strategyStandardSaleForFixedPriceAddress = '0xC88822a9D68ebAf396C2B5B39961F706FaD9a3f3';
const transferSelectorNFTAddress = '0xCE41DEDe5421013951Ea5D31209C9EfccbB7B22E';

const caller = '';
const privateKey = '';
const raca = '0x9123A74E7c004b2110b97C4CC3758579B59464d2';
const WETH = '0xf70949Bc9B52DEFfCda63B0D15608d601e3a7C49';

const ropstenNetwork = 'https://ropsten.infura.io/v3/';

const ropstenProvider = new ethers.providers.JsonRpcProvider(ropstenNetwork);
const makerWallet = new ethers.Wallet(privateKey, ropstenProvider);

const testNFT = '0x553f153E23E51E43b54eE8d79cfF4a46c788bF20';
const testAccount01 = '';
const testAccountKey = '';
const takerWallet = new ethers.Wallet(testAccountKey, ropstenProvider);

// Ropsten
const chainId = 3;
const nftPrice = ethers.utils.parseEther('100000');
const nftTokenId = 54;
const nonce = 4;

function SignatureWith712Data(makerOrder) {
  const typedData = {
    types: {
      EIP712Domain: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'version',
          type: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
      ],
      MakerOrder: [
        {
          name: 'isOrderAsk',
          type: 'bool',
        },
        {
          name: 'signer',
          type: 'address',
        },
        {
          name: 'collection',
          type: 'address',
        },
        {
          name: 'price',
          type: 'uint256',
        },
        {
          name: 'tokenId',
          type: 'uint256',
        },
        {
          name: 'amount',
          type: 'uint256',
        },
        {
          name: 'strategy',
          type: 'address',
        },
        {
          name: 'currency',
          type: 'address',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'startTime',
          type: 'uint256',
        },
        {
          name: 'endTime',
          type: 'uint256',
        },
        {
          name: 'minPercentageToAsk',
          type: 'uint256',
        },
        {
          name: 'params',
          type: 'bytes',
        },
      ],
    },
    primaryType: 'MakerOrder',
    domain: {
      name: 'OpenPFPExchange',
      version: '1',
      chainId: chainId,
      verifyingContract: openPFPExchangeAddress,
    },
    message: makerOrder,
  };
  const digest = TypedDataUtils.encodeDigest(typedData);
  const digestHex = ethers.utils.hexlify(digest);

  // const signedMsg = toEthSignedMessageHash(digestHex);
  // console.log(signedMsg);

  const signingKey = new ethers.utils.SigningKey('0x' + privateKey);
  const signature = signingKey.signDigest(digestHex);
  console.log(signature);
  // const joinedSignature = ethers.utils.joinSignature(signature);
  // console.log(joinedSignature);
  return signature;
}

async function approveNFT() {
  const selectorInstance = new ethers.Contract(
    transferSelectorNFTAddress,
    transferSelectorNFTABI.abi,
    makerWallet,
  );
  const transferManager = await selectorInstance.checkTransferManagerForToken(testNFT);
  console.log('transferManager:', transferManager);

  const nftInstance = new ethers.Contract(
    testNFT,
    erc721ABI.abi,
    makerWallet,
  );

  const result = await nftInstance.setApprovalForAll(transferManager, true);
  console.log('approveNFT result:', result);
}

async function approveCurrency() {
  const currencyInstance = new ethers.Contract(
    raca,
    erc20ABI.abi,
    takerWallet,
  );

  const result = await currencyInstance.approve(openPFPExchangeAddress, nftPrice);
  console.log('approveCurrency result:', result);
}

async function matchAskWithTakerBid() {
  const makerOrder = {
    isOrderAsk: true,
    signer: '0x0a0b364093cB37787827E210806f50c30CE4e192',
    collection: testNFT,
    price: nftPrice,
    tokenId: nftTokenId,
    amount: 1,
    strategy: strategyStandardSaleForFixedPriceAddress,
    currency: raca,
    nonce: nonce,
    startTime: 1646108690,
    endTime: 1677644690,
    minPercentageToAsk: 9000,
    params: '0x',
  };

  const makerSig = SignatureWith712Data(makerOrder);
  makerOrder.v = makerSig.v;
  makerOrder.r = makerSig.r;
  makerOrder.s = makerSig.s;

  console.log(makerOrder);

  const takerOrder = {
    isOrderAsk: false,
    taker: testAccount01,
    price: nftPrice,
    tokenId: nftTokenId,
    minPercentageToAsk: 9000,
    params: '0x',
  };

  const openPFPExchangeInstance = new ethers.Contract(
    openPFPExchangeAddress,
    openPFPExchangeABI.abi,
    takerWallet,
  );

  // const result = await openPFPExchangeInstance.matchAskWithTakerBidUsingETHAndWETH(takerOrder, makerOrder, { value: nftPrice });
  const result = await openPFPExchangeInstance.matchAskWithTakerBid(takerOrder, makerOrder);
  console.log('matchAskWithTakerBid result:', result);
}

async function cancelOrder() {
  const openPFPExchangeInstance = new ethers.Contract(
    openPFPExchangeAddress,
    openPFPExchangeABI.abi,
    makerWallet,
  );

  const minNonce = 5;
  const result = await openPFPExchangeInstance.cancelAllOrdersForSender(minNonce);
  console.log('cancelAllOrdersForSender result:', result);

  const orderNonces = [101, 102];
  const result2 = await openPFPExchangeInstance.cancelMultipleMakerOrders(orderNonces);
  console.log('cancelMultipleMakerOrders result:', result2);
}

// 1. seller approve nft to exchange contract
approveNFT();

// 2. buyer approve currency to exchange contract
approveCurrency();

matchAskWithTakerBid();

cancelOrder();
