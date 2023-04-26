import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  Grid,
  HStack,
  Spacer,
  Image,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  IconButton,
  useBoolean,
} from "@chakra-ui/react";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { timeStamp } from "console";
import { BigNumber, ethers } from "ethers";
import { FullOfferInfo } from "libs/backend";
import { eventEmitter, EventId } from "libs/eventEmitter";
import { getTokenIconPath } from "libs/fetchers";
import {
  bigNumberString,
  BNToPrecision,
  formatDate,
  formatTimeRemaining,
} from "libs/helperFunctions";
import { FullLoanInfo, Timestamp, TokenAmount } from "libs/types";
import { ReactNode, useEffect } from "react";
import Price from "./Price";
import { statFontSize, tableRowHoverStyle } from "./Theme";

export interface ColSpecs {
  size?: number;
  align?: "left" | "right" | "center";
}

interface TableHeaderViewProps {
  colSpecs: { [key: string]: ColSpecs };
  tableRowWidthPct?: number;
}

export const TABLE_ROW_WIDTH_PCT = 95;
export const TABLE_ROW_PADDING_LEFT = "3";

export function TableHeaderView(props: TableHeaderViewProps) {
  return (
    <Flex w={"100%"} layerStyle={"tableHeader"}>
      <HStack
        w={(props.tableRowWidthPct ?? TABLE_ROW_WIDTH_PCT) + "%"}
        paddingLeft={TABLE_ROW_PADDING_LEFT}
      >
        {Object.keys(props.colSpecs).map((key) => {
          return (
            <Box
              key={key}
              w={getWidth(key, props.colSpecs)}
              textAlign={props.colSpecs[key].align ?? "left"}
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
  colSpecs: { [key: string]: ColSpecs };
  colData: {
    [key: string]:
      | string
      | Token
      | TokenAmount
      | Timestamp
      | (() => JSX.Element);
  };
}

function isTokenAmount(obj: any) {
  return (
    obj !== undefined &&
    typeof obj === "object" &&
    "amount" in obj &&
    "token" in obj
  );
}
function isTimestamp(obj: any) {
  return obj !== undefined && typeof obj === "object" && "timestamp" in obj;
}

export function TableRowView(props: TableRowViewProps) {
  return (
    <Flex w="100%">
      <HStack w={"100%"} paddingLeft={TABLE_ROW_PADDING_LEFT} paddingY="1.5">
        {Object.keys(props.colSpecs).map((key) => {
          if (props.colData[key] instanceof Token) {
            const token = props.colData[key] as Token;
            return (
              <HStack
                key={key}
                w={getWidth(key, props.colSpecs)}
                textAlign={props.colSpecs[key].align ?? "left"}
                textStyle={"tableRow"}
              >
                <Image src={getTokenIconPath(token)} height="30px"></Image>
                <Text>{token.symbol}</Text>
              </HStack>
            );
          } else if (isTokenAmount(props.colData[key])) {
            const tokenAmount = props.colData[key] as TokenAmount;
            return (
              <VStack
                key={key + tokenAmount.amount.toString()}
                w={getWidth(key, props.colSpecs)}
                spacing={0}
              >
                <Text
                  w={"100%"}
                  textAlign={props.colSpecs[key].align ?? "left"}
                  textStyle={"tableRow"}
                >
                  {bigNumberString(tokenAmount.amount, tokenAmount.token)}
                </Text>
                <Price
                  key={tokenAmount.amount.toString()}
                  token={tokenAmount.token}
                  amount={tokenAmount.amount}
                  textAlign={props.colSpecs[key].align ?? "left"}
                  textStyle={"price"}
                  w={"100%"}
                ></Price>
              </VStack>
            );
          } else if (isTimestamp(props.colData[key])) {
            const timestamp = (props.colData[key] as Timestamp).timestamp;
            return (
              <VStack key={key} w={getWidth(key, props.colSpecs)} spacing={0}>
                <Text
                  w={"100%"}
                  textAlign={props.colSpecs[key].align ?? "left"}
                  textStyle={"tableRow"}
                >
                  {formatDate(timestamp)}
                </Text>
                <Text
                  textAlign={props.colSpecs[key].align ?? "left"}
                  textStyle={"price"}
                  w={"100%"}
                >
                  in {formatTimeRemaining(timestamp * 1000)}
                </Text>
              </VStack>
            );
          } else if (typeof props.colData[key] == "function") {
            const element = props.colData[key] as () => JSX.Element;
            return (
              <Box
                key={key}
                w={getWidth(key, props.colSpecs)}
                textAlign={props.colSpecs[key].align ?? "left"}
              >
                {element()}
              </Box>
            );
          } else {
            return (
              <Box
                key={key}
                w={getWidth(key, props.colSpecs)}
                textAlign={props.colSpecs[key].align ?? "left"}
                textStyle={"tableRow"}
              >
                {props.colData[key] as string}
              </Box>
            );
          }
        })}
      </HStack>
      <Spacer />
    </Flex>
  );
}

interface LoanInfoViewProps {
  loanInfo: FullLoanInfo;
}

export function LoanInfoView(props: LoanInfoViewProps) {
  return (
    <HStack
      spacing={10}
      alignSelf="start"
      paddingTop={0}
      margin={-3}
      paddingLeft={5}
      paddingBottom={2}
    >
      <Stat textAlign={"left"}>
        <StatLabel>Principal</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {ethers.utils.formatUnits(
            props.loanInfo.loan.amount,
            props.loanInfo.token.decimals
          )}
        </StatNumber>
      </Stat>
      <Stat textAlign={"left"}>
        <StatLabel>Interest</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {Number(
            ethers.utils.formatUnits(
              props.loanInfo.interest,
              props.loanInfo.token.decimals
            )
          ).toFixed(4)}
        </StatNumber>
      </Stat>
      <Stat textAlign={"left"} w="300px">
        <StatLabel>Loan Start Date</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {formatDate(props.loanInfo.loan.startTime)}
        </StatNumber>
      </Stat>
      <Stat textAlign={"left"} w="300px">
        <StatLabel>Min Loan Term</StatLabel>
        <StatNumber fontSize={statFontSize}>
          {formatDate(props.loanInfo.loan.minRepayTime)}
        </StatNumber>
      </Stat>
    </HStack>
  );
}

function getWidth(key: string, colDims: { [key: string]: ColSpecs }) {
  let totalWidth = 0;
  for (const key in colDims) {
    totalWidth += colDims[key].size ?? 1;
  }
  return ((colDims[key].size ?? 1) * 100) / totalWidth + "%";
}

interface AccountViewProps {
  data: FullLoanInfo;
}

export function AccountView(props: AccountViewProps) {
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

export interface SimpleRowProps {
  name: string;
  value: string;
}

export function SimpleRow(props: SimpleRowProps) {
  return (
    <Flex w="100%">
      <Text>{props.name}</Text>
      <Spacer></Spacer>
      <Text>{props.value}</Text>
    </Flex>
  );
}
