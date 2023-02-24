// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.6;
pragma abicoder v2;

import "./Supply.sol";
import "./libraries/UniUtils.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-periphery/contracts/libraries/LiquidityAmounts.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";

// deposit collateral in ave
contract TroveManager is ERC721, ERC721Holder, Ownable {
    using EnumerableSet for EnumerableSet.UintSet;

    address private _supply;
    address private _WETH;

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
        address token; // ERC721 or ERC20 token
        uint256 amountOrId;
    }

    constructor(address WETH, address supply) ERC721("TroveNFT", "ULT") {
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

        if (token == UniUtils.NONFUNGIBLE_POSITION_MANAGER) {
            INonfungiblePositionManager(UniUtils.NONFUNGIBLE_POSITION_MANAGER)
                .safeTransferFrom(msg.sender, address(this), amountOrId);
        } else {
            require(
                ERC20(token).transferFrom(
                    msg.sender,
                    address(this),
                    amountOrId
                ),
                "transfer failed"
            );
        }

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

        if (_troves[troveId].token == UniUtils.NONFUNGIBLE_POSITION_MANAGER) {
            INonfungiblePositionManager(UniUtils.NONFUNGIBLE_POSITION_MANAGER)
                .safeTransferFrom(
                    address(this),
                    msg.sender,
                    _troves[troveId].amountOrId
                );
        } else {
            require(
                ERC20(_troves[troveId].token).transferFrom(
                    address(this),
                    msg.sender,
                    _troves[troveId].amountOrId
                ),
                "transfer failed"
            );
        }
        _burn(troveId);
    }

    function openLoan(
        uint256 troveId,
        uint256 depositId,
        address token,
        uint256 amount,
        uint256 duration
    ) public troveOwner(troveId) {
        (address _token, uint256 healthFactor) = getHealthFactorBPS(
            troveId,
            amount
        );

        require(healthFactor > HUNDRED_PERCENT_BPS, "health factor too low");

        if (_token != address(0)) {
            require(_token == token, "trove has loan with other token");
        }

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
        (, uint256 healthFactor) = getHealthFactorBPS(troveId, 0);

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

    function getAmountBorrowedForTroveId(
        uint256 troveId
    ) public view returns (address, uint256, uint256) {
        uint256 numLoans = getNumLoansForTroveId(troveId);
        uint256 totalBorrowed;
        uint256 totalInterest;
        address token;

        for (uint i = 0; i < numLoans; i++) {
            uint256 loanId = getLoanIdByIndexForTroveId(troveId, i);
            (uint256 borrowed, uint256 interest) = Supply(_supply)
                .getLoanAmountAndInterest(loanId);
            totalBorrowed += borrowed;
            totalInterest += interest;
            if (i == 0) {
                token = Supply(_supply).getLoanToken(loanId);
            }
        }
        return (token, totalBorrowed, totalInterest);
    }

    function getTroveCollateralValue(
        uint256 troveId
    ) private view returns (uint256, uint256) {
        Trove storage trove = _troves[troveId];
        address token = trove.token;

        uint256 collateralValue;
        uint256 collateralFactorBPS;
        if (token == UniUtils.NONFUNGIBLE_POSITION_MANAGER) {
            (
                collateralValue,
                collateralFactorBPS
            ) = positionValueAndCollateralRatio(trove.amountOrId);
        } else {
            collateralValue = UniUtils.getTWAPValue(
                trove.amountOrId,
                token,
                _WETH,
                _oraclePoolFees[token],
                _twapInterval
            );
            collateralFactorBPS = _collateralFactors[token];
        }
        return (collateralValue, collateralFactorBPS);
    }

    function positionValueAndCollateralRatio(
        uint256 positionId
    ) private view returns (uint256, uint256) {
        (
            address token0,
            uint256 amount0,
            address token1,
            uint256 amount1
        ) = UniUtils.getTokenAmounts(positionId);
        uint256 priceX960 = UniUtils.getTWAPValue(
            amount0,
            token0,
            _WETH,
            _oraclePoolFees[token0],
            _twapInterval
        );
        uint256 priceX961 = UniUtils.getTWAPValue(
            amount1,
            token1,
            _WETH,
            _oraclePoolFees[token0],
            _twapInterval
        );
        return (
            priceX960 + priceX961,
            Math.min(_collateralFactors[token0], _collateralFactors[token1])
        );
    }

    function getHealthFactorBPS(
        uint256 troveId,
        uint256 extraAmount
    ) private view returns (address, uint256) {
        (
            uint256 collateralValue,
            uint256 collateralFactorBPS
        ) = getTroveCollateralValue(troveId);

        (
            address token,
            uint256 borrowed,
            uint256 interest
        ) = getAmountBorrowedForTroveId(troveId);

        uint256 total = borrowed + interest + extraAmount;

        uint256 loanValue = UniUtils.getTWAPValue(
            total,
            token,
            _WETH,
            _oraclePoolFees[token],
            _twapInterval
        );

        if (total > 0) {
            return (
                token,
                FullMath.mulDiv(collateralValue, collateralFactorBPS, loanValue)
            );
        } else {
            return (token, MAX_INT);
        }
    }
}
