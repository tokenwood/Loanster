// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "./Supply.sol";
import "./interfaces/IUniUtils.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract TroveManager is ERC721Enumerable, Ownable {
    using EnumerableSet for EnumerableSet.UintSet;

    address private _supply;
    address private _WETH;
    address private _uniUtils;

    mapping(uint256 => Trove) private _troves;
    mapping(uint256 => EnumerableSet.UintSet) private _troveLoans;
    mapping(address => uint256) private _collateralFactorsBPS;
    mapping(address => uint256) private _borrowFactorsBPS;
    mapping(address => bool) private _allowedCollateralTokens;
    mapping(address => bool) private _allowedSupplyTokens;

    mapping(address => uint24) private _oraclePoolFees;

    uint256 private _nextTroveId = 1;
    uint256 private constant MAX_INT = 2 ** 256 - 1;
    uint32 private _twapInterval = 300;
    uint256 private constant HUNDRED_PERCENT_BPS = 10000;

    event Debug(string message);
    event DebugAddress(address message);
    event SupplyTokenChanged(address token, bool isAllowed);
    event CollateralTokenChange(address token, bool isAllowed);
    event NewTrove(uint256 troveId);
    event NewLoan(uint256 troveId, uint256 loanId);

    struct Trove {
        address collateralToken;
        uint256 amount;
    }

    modifier troveOwner(uint256 troveId) {
        require(msg.sender == ownerOf(troveId), "sender not owner of trove");
        _;
    }

    // init functions

    constructor(
        address WETH,
        address supply,
        address uniUtils
    ) ERC721("TroveNFT", "ULT") {
        _uniUtils = uniUtils;
        _supply = supply;
        _WETH = WETH;

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

    function openTrove(address token, uint256 amount) public {
        require(
            _allowedCollateralTokens[token],
            "collateral token not allowed"
        );

        uint256 troveId = _nextTroveId++;
        _safeMint(msg.sender, troveId);

        _troves[troveId] = Trove({collateralToken: token, amount: amount});

        require(
            IERC20(token).balanceOf(msg.sender) >= amount,
            "Insufficient WETH balance"
        );
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "transfer failed"
        );

        emit NewTrove(troveId);
    }

    function closeTrove(uint256 troveId) public troveOwner(troveId) {
        closeTroveInternal(troveId);
    }

    function openLoans(
        LoanOffer[] calldata loanOffers,
        bytes[] calldata signatures,
        uint256 amount,
        uint256 duration,
        uint256 troveId,
        bool allowPartialExecution
    ) public troveOwner(troveId) {
        uint256 toBorrow = amount;
        for (uint i = 0; i < loanOffers.length && toBorrow > 0; i++) {
            uint256 offerAmount = min(toBorrow, loanOffers[i].amount);

            openLoan(
                loanOffers[i],
                signatures[i],
                offerAmount,
                duration,
                troveId
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
        uint256 duration,
        uint256 troveId
    ) public troveOwner(troveId) {
        require(
            _allowedSupplyTokens[loanOffer.token],
            "supply token not allowed"
        );

        uint256 healthFactor = getHealthFactorBPS(
            troveId,
            amount,
            loanOffer.token
        );
        require(healthFactor > HUNDRED_PERCENT_BPS, "health factor too low");

        // change local state and transfer tokens
        uint256 loanId = Supply(_supply).openLoan(
            loanOffer,
            signature,
            amount,
            duration,
            _ownerOf(troveId)
        );

        _troveLoans[troveId].add(loanId);
        emit NewLoan(loanId, troveId);
    }

    function repayLoan(
        uint256 troveId,
        uint256 loanId,
        uint256 newAmount
    ) public troveOwner(troveId) {
        repayLoanInternal(troveId, loanId, newAmount);
    }

    function liquidateTrove(uint256 troveId) public {
        uint256 healthFactor = getHealthFactorBPS(troveId, 0, address(0));

        require(healthFactor < HUNDRED_PERCENT_BPS, "trove is healthy");

        uint256 numLoans = getNumLoansForTroveId(troveId);
        for (uint i = 0; i < numLoans; i++) {
            uint256 loanId = getLoanIdByIndexForTroveId(troveId, i);
            repayLoanInternal(troveId, loanId, 0);
        }

        // todo split excess between liquidator and owner, handle bad debt
        closeTroveInternal(troveId);
    }

    // state changes private

    function closeTroveInternal(uint256 troveId) private {
        require(
            getNumLoansForTroveId(troveId) == 0,
            "must close loans before withdrawing"
        );

        require(
            ERC20(_troves[troveId].collateralToken).transferFrom(
                address(this),
                msg.sender,
                _troves[troveId].amount
            ),
            "transfer failed"
        );

        _burn(troveId);
    }

    function repayLoanInternal(
        uint256 troveId,
        uint256 loanId,
        uint256 newAmount
    ) private {
        if (newAmount == 0) {
            _troveLoans[troveId].remove(loanId);
        }
        Supply(_supply).repayLoan(msg.sender, loanId, newAmount);
    }

    // view functions
    function getTrove(uint256 troveId) public view returns (Trove memory) {
        return _troves[troveId];
    }

    function getNumLoansForTroveId(
        uint256 troveId
    ) public view returns (uint256) {
        return (_troveLoans[troveId].length());
    }

    function getLoanIdByIndexForTroveId(
        uint256 troveId,
        uint256 index
    ) public view returns (uint256) {
        return (_troveLoans[troveId].at(index));
    }

    // could there be so many loans that health becomes impossible to calculate without running out of gas?
    function getTroveLoansValueEth(
        uint256 troveId,
        uint256 extraAmount,
        address token
    ) public view returns (uint256) {
        uint256 numLoans = getNumLoansForTroveId(troveId);
        uint256 totalOwed;

        for (uint i = 0; i < numLoans; i++) {
            uint256 loanId = getLoanIdByIndexForTroveId(troveId, i);
            (uint256 borrowed, uint256 interest) = Supply(_supply)
                .getLoanAmountAndMinInterest(loanId);
            totalOwed += borrowed + interest;
            if (i == 0) {
                address borrowedToken = Supply(_supply).getLoanToken(loanId);
                require(
                    token == borrowedToken,
                    "trying to borrow 2 different tokens"
                );
            }
        }

        uint256 total = totalOwed + extraAmount;

        uint256 loanValue = IUniUtils(_uniUtils).getTWAPValue(
            total,
            token,
            _WETH,
            _oraclePoolFees[token],
            _twapInterval
        );
        return loanValue;
    }

    function getTroveCollateralValueEth(
        uint256 troveId
    ) public view returns (uint256, uint256) {
        address token = _troves[troveId].collateralToken;

        uint256 collateralValue = IUniUtils(_uniUtils).getTWAPValue(
            _troves[troveId].amount,
            token,
            _WETH,
            _oraclePoolFees[token],
            _twapInterval
        );
        uint256 collateralFactorBPS = _collateralFactorsBPS[token];

        return (collateralValue, collateralFactorBPS);
    }

    function getHealthFactorBPS(
        uint256 troveId,
        uint256 extraAmount,
        address token
    ) public view returns (uint256) {
        (
            uint256 collateralValueEth,
            uint256 collateralFactorBPS
        ) = getTroveCollateralValueEth(troveId);

        uint256 loanValue = getTroveLoansValueEth(troveId, extraAmount, token);
        uint256 borrowFactorBPS = _borrowFactorsBPS[token];

        if (loanValue > 0) {
            return ((collateralValueEth *
                collateralFactorBPS *
                borrowFactorBPS) / (loanValue * 10000));
        } else {
            return (MAX_INT);
        }
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a >= b ? b : a;
    }
}
