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
    <VStack w="100%">
      <Flex w="100%">
        <Text width="100%" fontWeight={"semibold"}>
          {props.fullPositionInfo.token0.symbol +
            " / " +
            props.fullPositionInfo.token1.symbol +
            " " +
            props.fullPositionInfo.fee / 10000 +
            "%"}
        </Text>
        <Spacer />
      </Flex>

      <Flex w="100%">
        <Text>
          {props.fullPositionInfo.priceUpper +
            " - " +
            props.fullPositionInfo.priceLower +
            " " +
            props.fullPositionInfo.token0.symbol +
            " per " +
            props.fullPositionInfo.token1.symbol}
        </Text>
        <Spacer />
        {/* <Text>{"current price : " + props.fullPositionInfo.currentPrice}</Text> */}
      </Flex>
    </VStack>
  );
}
