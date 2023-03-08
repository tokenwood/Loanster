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
import {
  formatDate,
  FullDepositInfo,
  getAmountLoanedForDepositInfo,
} from "libs/unilend_utils";
import { FullPositionInfo, getTokenName } from "libs/uniswap_utils";
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
  data: FullDepositInfo;
}

export function DepositView(props: DepositViewProps) {
  return (
    <Flex w="100%">
      <Stat>
        <StatLabel>{getTokenName(props.data.depositInfo.token)}</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            props.data.depositInfo.amountDeposited,
            props.data.token.decimals
          )}
        </StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Claimable</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            props.data.depositInfo.claimableInterest,
            props.data.token.decimals
          )}
        </StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Loaned</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            getAmountLoanedForDepositInfo(props.data),
            props.data.token.decimals
          )}
        </StatNumber>
      </Stat>
      <Stat>
        <StatLabel>Interest rate</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.data.depositInfo.interestRateBPS.toNumber() / 100 + " %"}
        </StatNumber>
      </Stat>
      <Stat>
        <StatLabel>min/max duration</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.data.depositInfo.minLoanDuration +
            "d / " +
            props.data.depositInfo.maxLoanDuration +
            "d"}
        </StatNumber>
      </Stat>

      <Stat>
        <StatLabel>expiration date</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {formatDate(props.data.depositInfo.expiration)}
        </StatNumber>
      </Stat>
    </Flex>
  );
}
