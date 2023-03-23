import {
  Flex,
  Grid,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Token } from "@uniswap/sdk-core";
import { BigNumber, ethers } from "ethers";
import { FullOfferInfo } from "libs/backend";
import {
  formatDate,
  // FullDepositInfo,
  // getAmountLoanedForDepositInfo,
  getTokenName,
} from "libs/unilend_utils";
import { statFontSize } from "./Theme";

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

interface OfferViewProps {
  data: FullOfferInfo;
}

export function OfferView(props: OfferViewProps) {
  return (
    <Flex w="100%">
      <Stat textAlign={"center"}>
        <StatLabel>Token</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.data.token.symbol}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Borrowed</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            props.data.amountBorrowed,
            props.data.token.decimals
          ) +
            " / " +
            ethers.utils.formatUnits(
              props.data.offer.amount,
              props.data.token.decimals
            )}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Interest rate</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.data.offer.interestRateBPS.toNumber() / 100 + " %"}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Min loan amount</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            props.data.offer.minLoanAmount,
            props.data.token.decimals
          )}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Min/max duration</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.data.offer.minLoanDuration.toNumber() / 3600 / 24 +
            "d / " +
            props.data.offer.maxLoanDuration.toNumber() / 3600 / 24 +
            "d"}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Expiration</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {formatDate(props.data.offer.expiration)}
        </StatNumber>
      </Stat>
    </Flex>
  );
}
