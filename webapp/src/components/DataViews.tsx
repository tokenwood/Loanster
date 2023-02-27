import { Flex, Spacer, Text } from "@chakra-ui/react";
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
