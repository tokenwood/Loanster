// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// import "@uniswap/v3-periphery/contracts/interfaces/INonFungiblePositionManager.sol";

contract Supply is ERC721, Ownable {
    mapping(uint256 => Deposit) private _deposits;
    uint256 private _nextDepositId = 1;
    mapping(address => bool) private _allowedDepositTokens;
    address nonfungiblePositionManager;

    event DepositTokenChange(address token, bool isAllowed);

    struct Deposit {
        address token;
        uint256 amountDeposited;
        uint256 amountBorrowed;
        uint256 expiration;
        uint256 interestRateBPS;
    }

    constructor(address nonfungiblePositionManager_) ERC721("DepositNFT", "ULD") {
        nonfungiblePositionManager = nonfungiblePositionManager_;
    }

    function addDepositToken(address token) public onlyOwner {
        _allowedDepositTokens[token] = true;
        ERC20(token).approve(address(this), 2 ** 256 - 1);
        emit DepositTokenChange(token, true);
    }

    function removeDepositToken(address token) public onlyOwner {
        delete _allowedDepositTokens[token];
        emit DepositTokenChange(token, false);
    }

    function makeDeposit(address token, uint256 amount, uint256 expiration, uint256 interestRateBPS)
        public
        returns (uint256)
    {
        require(_allowedDepositTokens[token], "unauthorized deposit token");
        require(ERC20(token).transferFrom(msg.sender, address(this), amount), "transfer failed");

        uint256 nextDepositId = _nextDepositId++;

        _safeMint(msg.sender, nextDepositId);

        _deposits[nextDepositId] = Deposit({
            token: token,
            amountDeposited: amount,
            amountBorrowed: 0,
            expiration: expiration,
            interestRateBPS: interestRateBPS
        });

        return (nextDepositId);
    }

    function changeAmountDeposited(uint256 depositId, uint256 newAmount) public {
        Deposit memory deposit = _deposits[depositId];
        require(ownerOf(depositId) == msg.sender);
        require(deposit.expiration <= block.timestamp);
        ERC20 token = ERC20(deposit.token);

        if (newAmount > deposit.amountDeposited) {
            // adding
            uint256 amountToAdd = newAmount - deposit.amountDeposited;
            require(token.transferFrom(msg.sender, address(this), amountToAdd), "transfer failed");
        } else {
            // removing
            require(newAmount > deposit.amountBorrowed);
            uint256 amountToRemove = deposit.amountDeposited - newAmount;
            require(token.transferFrom(address(this), msg.sender, amountToRemove), "transfer failed");
        }
        deposit.amountDeposited = newAmount;

        // burn if new amount is 0 ?
    }

    function depositPosition(uint256 positionId) public {}

    function withdrawPosition(uint256 positionId) public {}
}
