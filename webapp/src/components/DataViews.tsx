import { Flex, Spacer, Text, VStack } from "@chakra-ui/react";
import { Token } from "@uniswap/sdk-core";
import { BigNumber, ethers } from "ethers";
import { FullPositionInfo } from "libs/uniswap_utils";
import { Address } from "wagmi";

interface TokenBalanceViewProps {
  amount: BigNumber;
  token: Token;
}

export function TokenBalanceView(props: TokenBalanceViewProps) {
  return (
    <Flex w="100%">
      <Text>
        {parseFloat(
          ethers.utils.formatUnits(props.amount, props.token.decimals)
        ).toFixed(2) +
          " " +
          props.token.symbol}
      </Text>
      <Spacer />
    </Flex>
  );
}

interface PositionViewProps {
  fullPositionInfo: FullPositionInfo;
}

export function PositionView(props: PositionViewProps) {
  return (
    <Flex w="100%">
      <VStack alignItems={"left"}>
        <Text fontWeight={"semibold"}>
          {props.fullPositionInfo.token0.symbol +
            " / " +
            props.fullPositionInfo.token1.symbol +
            " " +
            props.fullPositionInfo.fee / 10000 +
            "%"}
        </Text>
        <Text>
          {props.fullPositionInfo.priceUpper +
            " - " +
            props.fullPositionInfo.priceLower +
            " " +
            props.fullPositionInfo.token0.symbol +
            " per " +
            props.fullPositionInfo.token1.symbol}
        </Text>
      </VStack>
      <Spacer></Spacer>

      {/* <Spacer /> */}
      {/* <Text>{"current price : " + props.fullPositionInfo.currentPrice}</Text> */}
      <VStack alignItems={"right"}>
        <Text textAlign={"right"}>
          {(+ethers.utils.formatUnits(
            props.fullPositionInfo.balance0,
            props.fullPositionInfo.token0.decimals
          )).toPrecision(4) +
            " " +
            props.fullPositionInfo.token0.symbol}
        </Text>
        <Text textAlign={"right"}>
          {(+ethers.utils.formatUnits(
            props.fullPositionInfo.balance1,
            props.fullPositionInfo.token1.decimals
          )).toPrecision(4) +
            " " +
            props.fullPositionInfo.token1.symbol}
        </Text>
      </VStack>
    </Flex>
  );
}
