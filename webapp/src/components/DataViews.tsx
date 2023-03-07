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
import { ADDRESS_TO_TOKEN } from "libs/constants";
import { DepositInfo, formatDate } from "libs/unilend_utils";
import { FullPositionInfo, getTokenName } from "libs/uniswap_utils";
import { Address } from "wagmi";
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

interface PositionViewProps {
  fullPositionInfo: FullPositionInfo;
}

export function PositionView(props: PositionViewProps) {
  return (
    <Flex w="100%">
      <Stat>
        <StatLabel>Pool</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.fullPositionInfo.token0.symbol +
            " / " +
            props.fullPositionInfo.token1.symbol +
            " " +
            props.fullPositionInfo.fee / 10000 +
            "%"}
        </StatNumber>
        <StatHelpText>
          current price: {props.fullPositionInfo.currentPrice}
        </StatHelpText>
      </Stat>

      <Stat>
        <StatLabel>Range</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.fullPositionInfo.priceUpper +
            " - " +
            props.fullPositionInfo.priceLower}
        </StatNumber>
        <StatHelpText>
          {props.fullPositionInfo.token0.symbol +
            " per " +
            props.fullPositionInfo.token1.symbol}
        </StatHelpText>
      </Stat>

      <Stat>
        <StatLabel>Liquidity</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {(+ethers.utils.formatUnits(
            props.fullPositionInfo.balance0,
            props.fullPositionInfo.token0.decimals
          )).toPrecision(4) +
            " " +
            props.fullPositionInfo.token0.symbol}
        </StatNumber>
        <StatNumber fontSize={statFontSize}>
          {(+ethers.utils.formatUnits(
            props.fullPositionInfo.balance1,
            props.fullPositionInfo.token1.decimals
          )).toPrecision(4) +
            " " +
            props.fullPositionInfo.token1.symbol}
        </StatNumber>
      </Stat>
    </Flex>
  );
}

interface DepositViewProps {
  depositInfo: DepositInfo;
}

export function DepositView(props: DepositViewProps) {
  return (
    <Flex w="100%">
      <Stat>
        <StatLabel>{getTokenName(props.depositInfo.token)}</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            props.depositInfo.amountDeposited,
            ADDRESS_TO_TOKEN[props.depositInfo.token].decimals
          )}
        </StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Claimable</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            props.depositInfo.claimableInterest,
            ADDRESS_TO_TOKEN[props.depositInfo.token].decimals
          )}
        </StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Loaned</StatLabel>
        <StatNumber fontSize={statFontSize}>todo</StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Interest rate</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.depositInfo.interestRateBPS.toNumber() / 100 + " %"}
        </StatNumber>
      </Stat>
      <Stat>
        <StatLabel>min/max duration</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.depositInfo.minLoanDuration +
            "d / " +
            props.depositInfo.maxLoanDuration +
            "d"}
        </StatNumber>
      </Stat>

      <Stat>
        <StatLabel>expiration date</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {formatDate(props.depositInfo.expiration)}
        </StatNumber>
      </Stat>
    </Flex>
  );
}
