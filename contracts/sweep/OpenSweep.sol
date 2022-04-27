// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../libraries/OrderTypes.sol";

interface IOpenPFP {
    function matchAskWithTakerBidUsingETHAndWETH(
        OrderTypes.TakerOrder calldata takerBid,
        OrderTypes.MakerOrder calldata makerAsk
    ) external payable;

    function matchAskWithTakerBid(
        OrderTypes.TakerOrder calldata takerBid,
        OrderTypes.MakerOrder calldata makerAsk
    ) external;
}

contract OpenSweep is Ownable, ReentrancyGuard {
    struct OpenseaTrades {
        uint256 value;
        bytes tradeData;
    }

    struct ERC20Details {
        address[] tokenAddrs;
        uint256[] amounts;
    }

    struct ConverstionDetails {
        bytes conversionData;
    }

    address public openPFP;
    address public converter;

    constructor(address _converter, address _openPFP) {
        converter = _converter;
        openPFP = _openPFP;
    }

    // @audit This function is used to approve specific tokens to specific market contracts with high volume.
    // This is done in very rare cases for the gas optimization purposes.
    function setOneTimeApproval(
        IERC20 token,
        address operator,
        uint256 amount
    ) external onlyOwner {
        token.approve(operator, amount);
    }

    function setConverter(address _converter) external onlyOwner {
        converter = _converter;
    }

    function _transferEth(address _to, uint256 _amount) internal {
        bool callStatus;
        assembly {
            // Transfer the ETH and store if it succeeded or not.
            callStatus := call(gas(), _to, _amount, 0, 0, 0, 0)
        }
        require(callStatus, "_transferEth: Eth transfer failed");
    }

    function _checkCallResult(bool _success) internal pure {
        if (!_success) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }

    function _conversionHelper(ConverstionDetails[] memory _converstionDetails)
        internal
    {
        for (uint256 i = 0; i < _converstionDetails.length; i++) {
            // convert to desired asset
            (bool success, ) = converter.delegatecall(
                _converstionDetails[i].conversionData
            );
            // check if the call passed successfully
            _checkCallResult(success);
        }
    }

    function _returnDust(address[] memory _tokens) internal {
        // return remaining ETH (if any)
        assembly {
            if gt(selfbalance(), 0) {
                let callStatus := call(
                    gas(),
                    caller(),
                    selfbalance(),
                    0,
                    0,
                    0,
                    0
                )
            }
        }
        // return remaining tokens (if any)
        for (uint256 i = 0; i < _tokens.length; i++) {
            if (IERC20(_tokens[i]).balanceOf(address(this)) > 0) {
                _tokens[i].call(
                    abi.encodeWithSelector(
                        0xa9059cbb,
                        msg.sender,
                        IERC20(_tokens[i]).balanceOf(address(this))
                    )
                );
            }
        }
    }

    function _buyAssetForEth(
        OrderTypes.TakerOrder calldata _takerBid,
        OrderTypes.MakerOrder calldata _makerAsk,
        bool _revertIfTrxFails
    ) internal {
        bytes memory _data = abi.encodeWithSelector(
            IOpenPFP.matchAskWithTakerBidUsingETHAndWETH.selector,
            _takerBid,
            _makerAsk
        );
        (bool success, ) = openPFP.call{value: _makerAsk.amount}(_data);
        if (!success && _revertIfTrxFails) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }

    function _buyAssetForERC20(
        OrderTypes.TakerOrder calldata _takerBid,
        OrderTypes.MakerOrder calldata _makerAsk
    ) internal {
        bytes memory _data = abi.encodeWithSelector(
            IOpenPFP.matchAskWithTakerBid.selector,
            _takerBid,
            _makerAsk
        );
        (bool success, ) = openPFP.call(_data);

        // check if the call passed successfully
        _checkCallResult(success);
    }

    function batchBuyWithETH(
        OrderTypes.TakerOrder[] calldata _takerBids,
        OrderTypes.MakerOrder[] calldata _makerAsks,
        bool _revertIfTrxFails
    ) external payable nonReentrant {
        require(
            _takerBids.length == _makerAsks.length,
            "makerOrders not match takerOrders"
        );

        // execute trades
        for (uint256 i = 0; i < _takerBids.length; i++) {
            _buyAssetForEth(_takerBids[i], _makerAsks[i], _revertIfTrxFails);
        }

        // return remaining ETH (if any)
        assembly {
            if gt(selfbalance(), 0) {
                let callStatus := call(
                    gas(),
                    caller(),
                    selfbalance(),
                    0,
                    0,
                    0,
                    0
                )
            }
        }
    }

    function batchBuyWithERC20s(
        ERC20Details calldata erc20Details,
        OrderTypes.TakerOrder[] calldata _takerBids,
        OrderTypes.MakerOrder[] calldata _makerAsks,
        ConverstionDetails[] calldata converstionDetails,
        address[] calldata dustTokens
    ) external payable nonReentrant {
        require(
            _takerBids.length == _makerAsks.length,
            "makerOrders not match takerOrders"
        );

        // transfer ERC20 tokens from the sender to this contract
        for (uint256 i = 0; i < erc20Details.tokenAddrs.length; i++) {
            erc20Details.tokenAddrs[i].call(
                abi.encodeWithSelector(
                    0x23b872dd,
                    msg.sender,
                    address(this),
                    erc20Details.amounts[i]
                )
            );
        }

        // Convert any assets if needed
        _conversionHelper(converstionDetails);

        // execute trades
        for (uint256 i = 0; i < _takerBids.length; i++) {
            _buyAssetForERC20(_takerBids[i], _makerAsks[i]);
        }

        // return dust tokens (if any)
        _returnDust(dustTokens);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) public virtual returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external virtual returns (bytes4) {
        return 0x150b7a02;
    }

    // Used by ERC721BasicToken.sol
    function onERC721Received(
        address,
        uint256,
        bytes calldata
    ) external virtual returns (bytes4) {
        return 0xf0b9e5ba;
    }

    function supportsInterface(bytes4 interfaceId)
        external
        view
        virtual
        returns (bool)
    {
        return interfaceId == this.supportsInterface.selector;
    }

    receive() external payable {}

    // Emergency function: In case any ETH get stuck in the contract unintentionally
    // Only owner can retrieve the asset balance to a recipient address
    function rescueETH(address recipient) external onlyOwner {
        _transferEth(recipient, address(this).balance);
    }

    // Emergency function: In case any ERC20 tokens get stuck in the contract unintentionally
    // Only owner can retrieve the asset balance to a recipient address
    function rescueERC20(address asset, address recipient) external onlyOwner {
        asset.call(
            abi.encodeWithSelector(
                0xa9059cbb,
                recipient,
                IERC20(asset).balanceOf(address(this))
            )
        );
    }

    // Emergency function: In case any ERC721 tokens get stuck in the contract unintentionally
    // Only owner can retrieve the asset balance to a recipient address
    function rescueERC721(
        address asset,
        uint256[] calldata ids,
        address recipient
    ) external onlyOwner {
        for (uint256 i = 0; i < ids.length; i++) {
            IERC721(asset).transferFrom(address(this), recipient, ids[i]);
        }
    }

    // Emergency function: In case any ERC1155 tokens get stuck in the contract unintentionally
    // Only owner can retrieve the asset balance to a recipient address
    function rescueERC1155(
        address asset,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        address recipient
    ) external onlyOwner {
        for (uint256 i = 0; i < ids.length; i++) {
            IERC1155(asset).safeTransferFrom(
                address(this),
                recipient,
                ids[i],
                amounts[i],
                ""
            );
        }
    }
}
