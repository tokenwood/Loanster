import { Box, Text } from "@chakra-ui/react";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { BigNumber } from "ethers";
import { getTokenPrice } from "libs/fetchers";
import { dollarString, splitThousands } from "libs/helperFunctions";
import { TokenAmount } from "libs/types";
import { Address, useProvider } from "wagmi";
import { DataLoader } from "./DataLoaders";

interface PriceProps {
  token: Token;
  amount: BigNumber;
  textAlign?: "left" | "right" | "center";
  textStyle?: string;
  w?: string;
}

export default function Price(props: PriceProps) {
  const provider = useProvider();

  return (
    <DataLoader
      fetcher={() =>
        getTokenPrice(provider, props.token.address as Address, props.amount)
      }
      makeChildren={(childProps) => {
        return (
          <Text
            textAlign={props.textAlign}
            textStyle={props.textStyle}
            w={props.w ?? undefined}
          >
            {dollarString(childProps.data)}
          </Text>
        );
      }}
    ></DataLoader>
  );
}
