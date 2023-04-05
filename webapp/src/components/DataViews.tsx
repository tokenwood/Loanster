import {
  Box,
  Flex,
  Grid,
  HStack,
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
  FullLoanInfo,
  // FullDepositInfo,
  // getAmountLoanedForDepositInfo,
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
        ).toPrecision(3) +
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
          {props.data.offer.interestRateBPS / 100 + " %"}
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
          {props.data.offer.minLoanDuration / 3600 / 24 +
            "d / " +
            props.data.offer.maxLoanDuration / 3600 / 24 +
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

interface LoanViewProps {
  data: FullLoanInfo;
}

export function LoanView(props: LoanViewProps) {
  return (
    <Flex w="100%">
      <Stat textAlign={"center"}>
        <StatLabel>Token</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.data.token.symbol}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Debt</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            props.data.loan.amount.add(props.data.interest),
            props.data.token.decimals
          )}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Claimable</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            props.data.claimable,
            props.data.token.decimals
          )}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Interest rate</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {props.data.loan.interestRateBPS / 100 + " %"}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Min Repayment Date</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {formatDate(props.data.loan.minRepayTime)}
        </StatNumber>
      </Stat>
      <Stat textAlign={"center"}>
        <StatLabel>Due Date</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {formatDate(props.data.loan.expiration)}
        </StatNumber>
      </Stat>
    </Flex>
  );
}
interface TableHeaderViewProps {
  colDims: { [key: string]: number };
}

export function TableHeaderView(props: TableHeaderViewProps) {
  return (
    <Flex w={"100%"} layerStyle={"level2"}>
      <HStack
        w={"90%"}
        // paddingRight={"58px"}

        paddingLeft="3"
        paddingRight="3"
        // padding="3"
      >
        {Object.keys(props.colDims).map((key) => {
          return (
            <Box
              key={key}
              w={getWidth(key, props.colDims)}
              textAlign="left"
              textStyle={"tableHeader"}
            >
              {key}
            </Box>
          );
        })}
      </HStack>
      <Spacer />
    </Flex>
  );
}

interface TableRowViewProps {
  colDims: { [key: string]: number };
  colData: { [key: string]: string };
}

export function TableRowView(props: TableRowViewProps) {
  return (
    <HStack w={"100%"} layerStyle={"level2"} padding="3">
      {Object.keys(props.colDims).map((key) => {
        return (
          <Box
            key={key}
            w={getWidth(key, props.colDims)}
            textAlign="left"
            textStyle={"tableRow"}
          >
            {props.colData[key]}
          </Box>
        );
      })}
    </HStack>
  );
}

function getWidth(key: string, colDims: { [key: string]: number }) {
  let totalWidth = 0;
  for (const key in colDims) {
    totalWidth += colDims[key];
  }
  return (colDims[key] * 100) / totalWidth + "%";
}
