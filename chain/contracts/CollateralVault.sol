// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

contract CollateralVault is IERC721Receiver {
    address private _nonfungiblePositionManager;
    mapping(uint256 => address) private _positionOwners;

    event Debug(string message);
    event DebugAddress(address message);

    constructor(address nonfungiblePositionManager) {
        _nonfungiblePositionManager = nonfungiblePositionManager;
    }

    function depositPosition(uint256 positionId) public {
        INonfungiblePositionManager(_nonfungiblePositionManager)
            .safeTransferFrom(msg.sender, address(this), positionId);
        _positionOwners[positionId] = msg.sender;
    }

    function withdrawPosition(uint256 positionId) public {
        require(
            msg.sender == _positionOwners[positionId],
            "sender not owner of position"
        );
        INonfungiblePositionManager(_nonfungiblePositionManager)
            .safeTransferFrom(address(this), msg.sender, positionId);
        delete _positionOwners[positionId];
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        // emit Debug("erc721 received");
        // emit DebugAddress(from);
        // emit DebugAddress(operator);
        return IERC721Receiver.onERC721Received.selector;
    }
}
