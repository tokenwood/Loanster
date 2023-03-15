// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;
// pragma abicoder v2;

import "./Supply.sol";
import "./interfaces/IUniUtils.sol";
import "./libraries/SignatureUtils.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

// import "@openzeppelin/contracts/math/Math.sol";

// deposit collateral in ave
contract TroveManager is ERC721Enumerable, ERC721Holder, Ownable, SignUtils {
    using EnumerableSet for EnumerableSet.UintSet;

    address private _supply;
    address private _WETH;
    address private _uniUtils;

    mapping(uint256 => Trove) private _troves;
    mapping(uint256 => EnumerableSet.UintSet) private _troveLoans;
    mapping(address => uint256) private _collateralFactors;
    mapping(address => bool) private _allowedCollateralTokens;
    mapping(address => uint24) private _oraclePoolFees;
    uint256 private _nextTroveId = 1;
    uint256 private constant MAX_INT = 2 ** 256 - 1;
    uint32 private _twapInterval = 300;
    uint256 private constant HUNDRED_PERCENT_BPS = 10000;

    event Debug(string message);
    event DebugAddress(address message);

    event CollateralTokenChange(address token, bool isAllowed);
    event NewTrove(uint256 troveId);

    modifier troveOwner(uint256 troveId) {
        require(msg.sender == ownerOf(troveId), "sender not owner of trove");
        _;
    }

    struct Trove {
        address token;
        uint256 amountOrId;
    }

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

    function getTrove(uint256 troveId) public view returns (Trove memory) {
        return _troves[troveId];
    }

    function addCollateralToken(
        address token,
        uint256 collateralFactorBPS,
        uint24 oraclePoolFee
    ) public onlyOwner {
        _allowedCollateralTokens[token] = true;
        _collateralFactors[token] = collateralFactorBPS;
        _oraclePoolFees[token] = oraclePoolFee;
        ERC20(token).approve(address(this), MAX_INT);
        emit CollateralTokenChange(token, true);
    }

    function removeCollateralToken(address token) public onlyOwner {
        _allowedCollateralTokens[token] = false;
        emit CollateralTokenChange(token, false);
    }

    function openTrove(address token, uint256 amountOrId) public {
        uint256 troveId = _nextTroveId++;
        _safeMint(msg.sender, troveId);

        _troves[troveId] = Trove({token: token, amountOrId: amountOrId});

        require(
            ERC20(token).transferFrom(msg.sender, address(this), amountOrId),
            "transfer failed"
        );

        emit NewTrove(troveId);
    }

    function closeTrove(uint256 troveId) public troveOwner(troveId) {
        closeTroveInternal(troveId);
    }

    function closeTroveInternal(uint256 troveId) private {
        require(
            getNumLoansForTroveId(troveId) == 0,
            "must close loans before withdrawing"
        );

        require(
            ERC20(_troves[troveId].token).transferFrom(
                address(this),
                msg.sender,
                _troves[troveId].amountOrId
            ),
            "transfer failed"
        );

        _burn(troveId);
    }

    function buildMessage(
        Loan calldata loan,
        address signer
    ) public pure returns (bytes32) {
        return
            prefixed(
                keccak256(
                    abi.encodePacked(
                        signer,
                        loan.token,
                        loan.depositId,
                        loan.troveId,
                        loan.start,
                        loan.interestRateBPS
                    )
                )
            );
    }

    function verifySignature(
        Loan calldata loan,
        bytes calldata sig
    ) private view {
        bytes32 message = buildMessage(loan, msg.sender); //  nonce, this ?
        require(recoverSigner(message, sig) == msg.sender);
    }

    function openLoan(
        uint256 troveId,
        uint256 depositId,
        address token,
        uint256 amount,
        uint256 duration
    ) public troveOwner(troveId) {
        uint256 healthFactor = getHealthFactorBPS(troveId, amount, token);

        require(healthFactor > HUNDRED_PERCENT_BPS, "health factor too low");

        // change local state and transfer tokens
        uint256 loanId = Supply(_supply).openLoan(
            token,
            msg.sender,
            depositId,
            amount,
            duration,
            troveId
        );

        _troveLoans[troveId].add(loanId);
    }

    function repayLoan(
        uint256 troveId,
        uint256 loanId,
        uint256 newAmount
    ) public troveOwner(troveId) {
        repayLoanInternal(troveId, loanId, newAmount);
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

    function getTroveLoansValue(
        uint256 troveId,
        uint256 extraAmount,
        address token
    ) public view returns (uint256) {
        uint256 numLoans = getNumLoansForTroveId(troveId);
        uint256 totalOwed;

        for (uint i = 0; i < numLoans; i++) {
            uint256 loanId = getLoanIdByIndexForTroveId(troveId, i);
            (uint256 borrowed, uint256 interest) = Supply(_supply)
                .getLoanAmountAndInterest(loanId);
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

    function getTroveCollateralValue(
        uint256 troveId
    ) public view returns (uint256, uint256) {
        Trove storage trove = _troves[troveId];
        address token = trove.token;

        uint256 collateralValue = IUniUtils(_uniUtils).getTWAPValue(
            trove.amountOrId,
            token,
            _WETH,
            _oraclePoolFees[token],
            _twapInterval
        );
        uint256 collateralFactorBPS = _collateralFactors[token];

        return (collateralValue, collateralFactorBPS);
    }

    function getHealthFactorBPS(
        uint256 troveId,
        uint256 extraAmount,
        address token
    ) public view returns (uint256) {
        (
            uint256 collateralValue,
            uint256 collateralFactorBPS
        ) = getTroveCollateralValue(troveId);

        uint256 loanValue = getTroveLoansValue(troveId, extraAmount, token);

        if (loanValue > 0) {
            return ((collateralValue * collateralFactorBPS) / loanValue); // overflow risk?
        } else {
            return (MAX_INT);
        }
    }
}
