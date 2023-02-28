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
      <VStack>
        <Text width="100%" fontWeight={"semibold"}>
          {props.fullPositionInfo.token0.symbol +
            " / " +
            props.fullPositionInfo.token1.symbol}
        </Text>
        <Text>{"todo"}</Text>
      </VStack>
      <Spacer />
    </Flex>
  );
}
