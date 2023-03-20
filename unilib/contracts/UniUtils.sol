// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";
import "@uniswap/v3-core/contracts/libraries/FullMath.sol";
import "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol";

/// @title Provides functions for deriving a pool address from the factory, tokens, and the fee
library UniUtils {
    address internal constant NONFUNGIBLE_POSITION_MANAGER =
        0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
    address internal constant FACTORY =
        0x1F98431c8aD98523631AE4a59f267346ea31F984;

    // returns value of "amount token" in "refToken" based on price in token/reftoken pool with fee poolFee
    function getTWAPValue(
        uint256 amount,
        address token,
        address refToken,
        uint24 poolFee,
        uint32 twapInterval
    ) public view returns (uint256) {
        if (token == refToken) {
            return FixedPoint96.Q96; // is this correct?
        }
        PoolAddress.PoolKey memory key = PoolAddress.getPoolKey(
            token,
            refToken,
            poolFee
        );
        address pool = PoolAddress.computeAddress(FACTORY, key);

        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = twapInterval;
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives, ) = IUniswapV3Pool(pool).observe(
            secondsAgos
        );

        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(
            int24((tickCumulatives[1] - tickCumulatives[0]) / twapInterval)
        );

        uint256 priceX96 = FullMath.mulDiv(
            sqrtPriceX96,
            sqrtPriceX96,
            FixedPoint96.Q96
        );

        if (token < refToken) {
            return FullMath.mulDiv(amount, priceX96, FixedPoint96.Q96);
        } else {
            return FullMath.mulDiv(amount, FixedPoint96.Q96, priceX96);
        }
    }
}