// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "./Supply.sol";
import "./interfaces/IUniUtils.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "hardhat/console.sol";

contract TroveManager is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    address private _supply;
    address private _uniUtils;

    // mapping(uint256 => Trove) private _troves;
    mapping(address => mapping(address => uint256)) _depositAmounts;
    mapping(address => EnumerableSet.AddressSet) _depositTokens;

    mapping(address => mapping(uint256 => uint256)) private _accountLoansMap;
    mapping(address => uint256) private _accountLoansLength;
    mapping(uint256 => uint256) private _accountLoanIndex; // loan id to index in map

    mapping(address => uint256) private _collateralFactorsBPS;
    mapping(address => uint256) private _borrowFactorsBPS;
    mapping(address => bool) private _allowedCollateralTokens;
    mapping(address => bool) private _allowedSupplyTokens;

    mapping(address => uint24) private _oraclePoolFees;

    uint256 private constant MAX_INT = 2 ** 256 - 1;
    uint32 private _twapInterval = 300;
    uint256 private constant HUNDRED_PERCENT_BPS = 10000;

    event SupplyTokenChanged(address token, bool isAllowed);
    event CollateralTokenChange(address token, bool isAllowed);
    event NewLoan(
        address lender,
        uint256 offerId,
        uint256 loanId,
        address borrower
    );

    // init functions

    constructor(address supply, address uniUtils) {
        _uniUtils = uniUtils;
        _supply = supply;

        Supply(_supply).setTroveManager(address(this));
    }

    function addCollateralToken(
        address token,
        uint256 collateralFactorBPS,
        uint24 oraclePoolFee
    ) public onlyOwner {
        _allowedCollateralTokens[token] = true;
        _collateralFactorsBPS[token] = collateralFactorBPS;
        _oraclePoolFees[token] = oraclePoolFee;
        ERC20(token).approve(address(this), MAX_INT);
        emit CollateralTokenChange(token, true);
    }

    function removeCollateralToken(address token) public onlyOwner {
        _allowedCollateralTokens[token] = false;
        emit CollateralTokenChange(token, false);
    }

    function addSupplyToken(
        address token,
        uint256 borrowFactorBPS,
        uint24 oraclePoolFee
    ) public onlyOwner {
        _allowedSupplyTokens[token] = true;
        _borrowFactorsBPS[token] = borrowFactorBPS;
        _oraclePoolFees[token] = oraclePoolFee;
        ERC20(token).approve(address(this), MAX_INT); // what if runs out ?
        emit SupplyTokenChanged(token, true);
    }

    function removeSupplyToken(address token) public onlyOwner {
        delete _allowedSupplyTokens[token];
        emit SupplyTokenChanged(token, false);
    }

    // state changes public

    function deposit(address token, uint256 amount) public {
        // should there be a minimum deposit amount?
        require(
            _allowedCollateralTokens[token],
            "collateral token not allowed"
        );

        _depositAmounts[msg.sender][token] += amount;
        _depositTokens[msg.sender].add(token);

        require(
            IERC20(token).balanceOf(msg.sender) >= amount,
            "Insufficient WETH balance"
        );
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "transfer failed"
        );
    }

    function withdraw(address token, uint256 newAmount) public {
        uint256 withdrawAmount = _depositAmounts[msg.sender][token] - newAmount;
        _depositAmounts[msg.sender][token] = newAmount;
        if (newAmount == 0) {
            _depositTokens[msg.sender].remove(token);
        }
        _healthCheck(msg.sender, address(0), 0);
        require(
            IERC20(token).transferFrom(
                address(this),
                msg.sender,
                withdrawAmount
            ),
            "transfer failed"
        );
    }

    function openLoans(
        LoanOffer[] calldata loanOffers,
        bytes[] calldata signatures,
        uint256 amount,
        uint256 duration,
        bool allowPartialExecution
    ) public {
        address token = loanOffers[0].token;
        _healthCheck(msg.sender, token, amount);

        uint256 toBorrow = amount;
        for (uint i = 0; i < loanOffers.length && toBorrow > 0; i++) {
            require(
                loanOffers[i].token == token,
                "offers have different tokens"
            );
            uint256 offerAmount = min(toBorrow, loanOffers[i].amount);

            _openLoan(
                loanOffers[i],
                signatures[i],
                amount,
                duration,
                msg.sender
            );

            toBorrow -= offerAmount;
        }
        if (allowPartialExecution == false) {
            require(toBorrow == 0, "could not borrow enough");
        }
    }

    function openLoan(
        LoanOffer calldata loanOffer,
        bytes calldata signature,
        uint256 amount,
        uint256 duration
    ) public {
        _healthCheck(msg.sender, loanOffer.token, amount); //94k gas
        _openLoan(loanOffer, signature, amount, duration, msg.sender);
    }

    // state changes private

    function _healthCheck(
        address account,
        address token,
        uint256 amount
    ) private view {
        uint256 healthFactor = getHealthFactorBPS(account, amount, token);
        require(healthFactor > HUNDRED_PERCENT_BPS, "health factor too low");
    }

    function _openLoan(
        LoanOffer calldata loanOffer,
        bytes calldata signature,
        uint256 amount,
        uint256 duration,
        address account
    ) private {
        require(
            _allowedSupplyTokens[loanOffer.token],
            "supply token not allowed"
        );

        //reentrancy attack: must change state before sending tokens.
        uint256 loanId = Supply(_supply).openLoan(
            loanOffer,
            signature,
            amount,
            duration,
            account
        );

        _addLoanToAccountEnumeration(account, loanId); //65k gas
        emit NewLoan(loanOffer.owner, loanOffer.offerId, loanId, account);
    }

    function _addLoanToAccountEnumeration(
        address account,
        uint256 loanId
    ) private {
        uint256 length = _accountLoansLength[account];
        _accountLoansMap[account][length] = loanId;
        _accountLoanIndex[loanId] = length;
        _accountLoansLength[account] = length + 1;
    }

    function _removeLoanFromAccountEnumeration(
        address account,
        uint256 loanId
    ) private {
        uint256 lastTokenIndex = _accountLoansLength[account] - 1;
        _accountLoansLength[account] = lastTokenIndex;
        uint256 loanIndex = _accountLoanIndex[loanId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (loanIndex != lastTokenIndex) {
            uint256 lastLoanId = _accountLoansMap[account][lastTokenIndex];
            _accountLoansMap[account][loanIndex] = lastLoanId; // Move the last token to the slot of the to-delete token
            _accountLoanIndex[lastLoanId] = loanIndex; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array. necessary?
        delete _accountLoanIndex[loanId];
        delete _accountLoansMap[account][lastTokenIndex];
    }

    function repayLoan(uint256 loanId, uint256 newAmount) public {
        require(
            _accountLoansMap[msg.sender][_accountLoanIndex[loanId]] == loanId,
            "msg.sender not owner of loan"
        );
        repayLoanInternal(msg.sender, msg.sender, loanId, newAmount);
    }

    // todo split excess between liquidator and owner, handle bad debt
    function liquidateAccount(address account) public {
        uint256 healthFactor = getHealthFactorBPS(account, 0, address(0));

        require(healthFactor < HUNDRED_PERCENT_BPS, "account is healthy");

        uint256 numLoans = getNumLoansForAccount(account);
        for (uint i = 0; i < numLoans; i++) {
            uint256 loanId = getLoanIdByIndexForAccount(account, i);
            repayLoanInternal(account, msg.sender, loanId, 0);
        }
    }

    function repayLoanInternal(
        address borrower,
        address repayer,
        uint256 loanId,
        uint256 newAmount
    ) private {
        if (newAmount == 0) {
            _removeLoanFromAccountEnumeration(borrower, loanId); // is this necessary? 3k gas
        }
        Supply(_supply).repayLoan(repayer, loanId, newAmount);
    }

    // view functions
    function getNumDepositsForAccount(
        address account
    ) public view returns (uint256) {
        return _depositTokens[account].length();
    }

    function getDepositByIndexForAccount(
        address account,
        uint256 index
    ) public view returns (address, uint256) {
        address token = _depositTokens[account].at(index);
        return (token, _depositAmounts[account][token]);
    }

    function getNumLoansForAccount(
        address account
    ) public view returns (uint256) {
        return (_accountLoansLength[account]);
    }

    function getLoanIdByIndexForAccount(
        address account,
        uint256 index
    ) public view returns (uint256) {
        return (_accountLoansMap[account][index]);
    }

    function getLoanValueEth(
        address token,
        uint256 amount
    ) public view returns (uint, uint) {
        uint256 loanValue = IUniUtils(_uniUtils).getTWAPValueEth(
            amount,
            token,
            _oraclePoolFees[token],
            _twapInterval
        );
        return (loanValue, (loanValue * 10000) / _borrowFactorsBPS[token]);
    }

    // could there be so many loans that health becomes impossible to calculate without running out of gas?
    function getAccountLoansValueEth(
        address account
    ) public view returns (uint256, uint256) {
        uint256 numLoans = getNumLoansForAccount(account);
        uint256 totalDebt;
        uint256 adjustedTotalDebt;

        //todo gas optim: how expensive is twap call ? could be aggregated by tokens first
        for (uint i = 0; i < numLoans; i++) {
            uint256 loanId = getLoanIdByIndexForAccount(account, i);
            (address token, uint256 borrowed, uint256 interest) = Supply(
                _supply
            ).getLoanAmountAndMinInterest(loanId);
            (uint256 loanValue, uint256 adjustedLoanValue) = getLoanValueEth(
                token,
                borrowed + interest
            );
            totalDebt += loanValue;
            adjustedTotalDebt += adjustedLoanValue;
        }

        return (totalDebt, adjustedTotalDebt);
    }

    function getAccountCollateralValueEth(
        address account
    ) public view returns (uint256, uint256) {
        uint256 collateralValue;
        uint256 adjustedCollateralValue;
        for (uint i = 0; i < _depositTokens[account].length(); i++) {
            address token = _depositTokens[account].at(i);
            (uint value, uint adjustedValue) = getCollateralValueEth(
                token,
                _depositAmounts[account][token]
            );
            collateralValue += value;
            adjustedCollateralValue += adjustedValue;
        }

        return (collateralValue, adjustedCollateralValue);
    }

    function getCollateralValueEth(
        address token,
        uint256 amount
    ) public view returns (uint256, uint256) {
        uint256 value = IUniUtils(_uniUtils).getTWAPValueEth(
            amount,
            token,
            _oraclePoolFees[token],
            _twapInterval
        );
        return (value, (value * _collateralFactorsBPS[token]) / 10000);
    }

    function getHealthFactorBPS(
        address account,
        uint256 extraAmount,
        address token
    ) public view returns (uint256) {
        (, uint256 adjustedCollateralValueEth) = getAccountCollateralValueEth(
            account
        );
        (, uint256 adjustedLoanValueEth) = getAccountLoansValueEth(account);

        if (extraAmount > 0) {
            (, uint256 adjustedNewLoanValue) = getLoanValueEth(
                token,
                extraAmount
            );
            adjustedLoanValueEth += adjustedNewLoanValue;
        }

        if (adjustedLoanValueEth > 0) {
            return ((adjustedCollateralValueEth * 10000) /
                (adjustedLoanValueEth));
        } else {
            return (MAX_INT);
        }
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a >= b ? b : a;
    }
}
