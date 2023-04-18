import { Box, Text } from "@chakra-ui/react";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { BigNumber } from "ethers";
import { getTokenPrice } from "libs/fetchers";
import { TokenAmount } from "libs/types";
import { Address, useProvider } from "wagmi";
import { DataLoader } from "./DataLoaders";

interface PriceProps {
  token: Token;
  amount: BigNumber;
}

export default function Price(props: PriceProps) {
  const provider = useProvider();

  return (
    <DataLoader
      fetcher={() =>
        getTokenPrice(provider, props.token.address as Address, props.amount)
      }
      makeChildren={(props) => {
        return <Text>$ {props.data.toFixed(2)}</Text>;
      }}
    ></DataLoader>
  );
}
