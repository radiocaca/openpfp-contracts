// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ITransferManagerNFT} from "../interfaces/ITransferManagerNFT.sol";

/**
 * @title TransferManagerNonCompliantERC721
 * @notice It allows the transfer of ERC721 tokens without safeTransferFrom.
 */
contract TransferManagerNonCompliantERC721 is ITransferManagerNFT {
    address public immutable OPEN_PFP_EXCHANGE;

    /**
     * @notice Constructor
     * @param _openPFPExchange address of the OpenPFP exchange
     */
    constructor(address _openPFPExchange) {
        OPEN_PFP_EXCHANGE = _openPFPExchange;
    }

    /**
     * @notice Transfer ERC721 token
     * @param collection address of the collection
     * @param from address of the sender
     * @param to address of the recipient
     * @param tokenId tokenId
     */
    function transferNonFungibleToken(
        address collection,
        address from,
        address to,
        uint256 tokenId,
        uint256
    ) external override {
        require(
            msg.sender == OPEN_PFP_EXCHANGE,
            "Transfer: Only OpenPFP Exchange"
        );
        IERC721(collection).transferFrom(from, to, tokenId);
    }
}
