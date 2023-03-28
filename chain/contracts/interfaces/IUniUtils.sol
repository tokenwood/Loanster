// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IUniUtils {
    function getTWAPValueEth(
        uint256 amount,
        address token,
        uint24 poolFee,
        uint32 twapInterval
    ) external view returns (uint256);
}
