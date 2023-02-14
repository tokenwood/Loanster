// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Supply is ERC721, Ownable {
    mapping(address => bool) private _allowedDepositTokens;

    mapping(uint256 => Deposit) private _deposits;
    uint256 private _nextDepositId = 1;

    event DepositTokenChange(address token, bool isAllowed);
    event NewDeposit(uint256 depositId);

    struct Deposit {
        address token;
        uint256 amountDeposited;
        uint256 amountBorrowed;
        uint256 expiration;
        uint256 interestRateBPS;
    }

    constructor() ERC721("DepositNFT", "ULD") {}

    function getDeposit(
        uint256 depositId
    )
        public
        view
        returns (
            address token,
            uint256 amountDeposited,
            uint256 amountBorrowed,
            uint256 expiration,
            uint256 interestRateBPS
        )
    {
        return (
            _deposits[depositId].token,
            _deposits[depositId].amountDeposited,
            _deposits[depositId].amountBorrowed,
            _deposits[depositId].expiration,
            _deposits[depositId].interestRateBPS
        );
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

    function getDepositId() public view returns (uint256) {
        return (_nextDepositId);
    }

    function makeDeposit(
        address token,
        uint256 amount,
        uint256 expiration,
        uint256 interestRateBPS
    ) public {
        require(_allowedDepositTokens[token], "unauthorized deposit token");
        require(
            ERC20(token).transferFrom(msg.sender, address(this), amount),
            "transfer failed"
        );

        uint256 depositId = _nextDepositId++;

        _safeMint(msg.sender, depositId);

        _deposits[depositId] = Deposit({
            token: token,
            amountDeposited: amount,
            amountBorrowed: 0,
            expiration: expiration,
            interestRateBPS: interestRateBPS
        });

        emit NewDeposit(depositId);
    }

    function changeAmountDeposited(
        uint256 depositId,
        uint256 newAmount
    ) public {
        Deposit storage deposit = _deposits[depositId];
        require(
            ownerOf(depositId) == msg.sender,
            "sender is not owner of deposit"
        );
        // require(deposit.expiration <= block.timestamp, "sender is not owner of deposit");
        ERC20 token = ERC20(deposit.token);

        if (newAmount > deposit.amountDeposited) {
            // adding
            uint256 amountToAdd = newAmount - deposit.amountDeposited;
            require(
                token.transferFrom(msg.sender, address(this), amountToAdd),
                "transfer failed"
            );
        } else {
            // removing
            require(
                newAmount >= deposit.amountBorrowed,
                "attempting to withdraw borrowed funds"
            );
            uint256 amountToRemove = deposit.amountDeposited - newAmount;
            require(
                token.transferFrom(address(this), msg.sender, amountToRemove),
                "transfer failed"
            );
        }
        deposit.amountDeposited = newAmount;
        // burn if new amount is 0 ?
    }
}
