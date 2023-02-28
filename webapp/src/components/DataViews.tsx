import { Flex, Spacer, Text, VStack } from "@chakra-ui/react";
import { Token } from "@uniswap/sdk-core";
import { BigNumber, ethers } from "ethers";
import { Address } from "wagmi";

interface TokenBalanceViewProps {
  amount: BigNumber;
  symbol: string;
  decimals: number;
}

export function TokenBalanceView(props: TokenBalanceViewProps) {
  return (
    <Flex w="100%">
      <Text>
        {ethers.utils.formatUnits(props.amount, props.decimals) +
          " " +
          props.symbol}
      </Text>
      <Spacer />
    </Flex>
  );
}

interface PositionViewProps {
  token0: Token;
  token1: Token;
  liquidity: number;
  //   amount0: BigNumber;
  //   amount1: BigNumber;
}

export function PositionView(props: PositionViewProps) {
  return (
    <Flex w="100%">
      <VStack>
        <Text>{props.token0.symbol + " / " + props.token1.symbol}</Text>
        <Text>{"liquidity: " + props.liquidity}</Text>
      </VStack>
      <Spacer />
    </Flex>
  );
}
