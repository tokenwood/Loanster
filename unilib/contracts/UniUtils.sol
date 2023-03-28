// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";
import "@uniswap/v3-core/contracts/libraries/FullMath.sol";
import "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol";

library UniUtils {
    address internal constant FACTORY =
        0x1F98431c8aD98523631AE4a59f267346ea31F984;

    address internal constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    function getTWAPValueEth(
        uint256 amount,
        address token,
        uint24 poolFee,
        uint32 twapInterval
    ) public view returns (uint256) {
        if (token == WETH) {
            return amount;
        }
        PoolAddress.PoolKey memory key = PoolAddress.getPoolKey(
            token,
            WETH,
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
            uint(sqrtPriceX96),
            uint(sqrtPriceX96),
            FixedPoint96.Q96
        );

        if (token < WETH) {
            return FullMath.mulDiv(amount, priceX96, FixedPoint96.Q96);
        } else {
            return FullMath.mulDiv(amount, FixedPoint96.Q96, priceX96);
        }
    }
}
