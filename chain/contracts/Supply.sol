// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
// pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// todo implement fee
// todo optimize with tight variable packing?
// what happens if owner gets compromised?
struct Deposit {
    address token;
    uint256 amountDeposited;
    uint256 interestRateBPS; // 100 = 1%
    uint256 expiration; // timestamp
    uint256 maxLoanDuration; // seconds
    uint256 minLoanDuration; // seconds
    uint256 claimableInterest;
}

struct Loan {
    address token;
    uint256 depositId;
    uint256 troveId;
    uint256 amount;
    uint256 start;
    uint256 interestRateBPS;
}

contract Supply is ERC721Enumerable, Ownable {
    //todo remove EnumerableSet and use mapping as in latest ERC721.sol
    using EnumerableSet for EnumerableSet.UintSet;

    mapping(address => bool) private _allowedDepositTokens;
    mapping(uint256 => Deposit) private _deposits;
    mapping(uint256 => Loan) private _loans;
    mapping(uint256 => EnumerableSet.UintSet) private _depositLoans;

    uint256 private _nextDepositId = 1;
    uint256 private _nextLoanId = 1;
    address private _troveManager;

    uint256 private constant ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;
    uint256 private constant MAX_INT = 2 ** 256 - 1;

    event DepositTokenChange(address token, bool isAllowed);
    event NewDeposit(uint256 depositId);
    event NewLoan(uint256 loanId);

    constructor() ERC721("DepositNFT", "ULD") {}

    function setTroveManager(address troveManager) public {
        // can only be set once
        if (_troveManager == address(0)) {
            _troveManager = troveManager;
        }
    }

    function addDepositToken(address token) public onlyOwner {
        _allowedDepositTokens[token] = true;
        ERC20(token).approve(address(this), MAX_INT); // what if runs out ?
        emit DepositTokenChange(token, true);
    }

    function removeDepositToken(address token) public onlyOwner {
        delete _allowedDepositTokens[token];
        emit DepositTokenChange(token, false);
    }

    function getDeposit(
        uint256 depositId
    ) public view returns (Deposit memory) {
        return (_deposits[depositId]);
    }

    function getNumLoansForDepositId(
        uint256 depositId
    ) public view returns (uint256) {
        return (_depositLoans[depositId].length());
    }

    function getLoanByIndexForDepositId(
        uint256 depositId,
        uint256 index
    ) public view returns (uint256) {
        return (_depositLoans[depositId].at(index));
    }

    function getAmountBorrowedForDepositId(
        uint256 depositId
    ) public view returns (uint256) {
        uint256 numLoans = getNumLoansForDepositId(depositId);
        uint256 amountBorrowed = 0;

        for (uint i = 0; i < numLoans; i++) {
            uint256 loanId = getLoanByIndexForDepositId(depositId, i);
            amountBorrowed += _loans[loanId].amount;
        }
        return amountBorrowed;
    }

    function getLoan(uint256 loanId) public view returns (Loan memory) {
        return _loans[loanId];
    }

    function getLoanAmountAndInterest(
        uint256 loanId
    ) public view returns (uint256, uint256) {
        return (_loans[loanId].amount, getInterestForLoan(loanId));
    }

    function getLoanToken(uint256 loanId) public view returns (address) {
        return (_loans[loanId].token);
    }

    function getInterestForLoan(uint256 loanId) public view returns (uint256) {
        return
            ((block.timestamp - _loans[loanId].start) *
                _loans[loanId].interestRateBPS) / (ONE_YEAR_IN_SECONDS * 10000);
    }

    function openLoan(
        address token,
        address borrower,
        uint256 depositId,
        uint256 amount,
        uint256 duration,
        uint256 troveId
    ) public returns (uint256) {
        require(
            msg.sender == _troveManager,
            "only trove manager can start loan"
        );

        Deposit storage d = _deposits[depositId];

        require(token == d.token, "wrong token");
        require(
            (d.amountDeposited - getAmountBorrowedForDepositId(depositId)) >
                amount,
            "not enough funds available"
        );
        require(
            (block.timestamp + duration) < d.expiration,
            "supply expiration reached"
        );
        require((duration < d.maxLoanDuration), "max duration reached");

        uint256 loanId = _nextLoanId++;
        _loans[loanId] = Loan({
            token: token,
            depositId: depositId,
            troveId: troveId,
            amount: amount,
            start: block.timestamp,
            interestRateBPS: d.interestRateBPS
        });
        _depositLoans[depositId].add(loanId);

        require(
            ERC20(token).transferFrom(address(this), borrower, amount),
            "transfer failed"
        );

        emit NewLoan(loanId);
        return loanId;
    }

    function repayLoan(
        address borrower,
        uint256 loanId,
        uint256 newAmount
    ) public {
        require(
            msg.sender == _troveManager,
            "only trove manager can repay loan"
        );

        Loan storage l = _loans[loanId];
        Deposit storage d = _deposits[l.depositId];

        uint256 interest = getInterestForLoan(loanId);

        require(
            newAmount < l.amount,
            "new amount larger or equal to current loan amount"
        );

        uint256 amountToTransfer = l.amount + interest - newAmount;

        d.claimableInterest += interest;
        l.amount = newAmount;
        l.start = block.timestamp;

        if (newAmount == 0) {
            _depositLoans[l.depositId].remove(loanId);
        }

        require(
            ERC20(d.token).transferFrom(
                borrower,
                address(this),
                amountToTransfer
            ),
            "transfer failed"
        );
    }

    function getDepositId() public view returns (uint256) {
        return (_nextDepositId);
    }

    function makeDeposit(
        address token,
        uint256 amount,
        uint256 interestRateBPS,
        uint256 expiration,
        uint256 maxLoanDuration,
        uint256 minLoanDuration
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
            expiration: expiration,
            maxLoanDuration: maxLoanDuration,
            minLoanDuration: minLoanDuration,
            interestRateBPS: interestRateBPS,
            claimableInterest: 0
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

        ERC20 token = ERC20(deposit.token);

        uint256 amountDeposited = deposit.amountDeposited;
        deposit.amountDeposited = newAmount;

        if (newAmount > amountDeposited) {
            uint256 amountToAdd = newAmount - amountDeposited;
            require(
                token.transferFrom(msg.sender, address(this), amountToAdd),
                "transfer failed"
            );
        } else {
            require(
                newAmount >= getAmountBorrowedForDepositId(depositId),
                "attempting to withdraw borrowed funds"
            );
            uint256 amountToRemove = amountDeposited - newAmount;
            if (newAmount == 0) {
                _burn(depositId);
            }
            require(
                token.transferFrom(address(this), msg.sender, amountToRemove),
                "transfer failed"
            );
        }
    }
}
