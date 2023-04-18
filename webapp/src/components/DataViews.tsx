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
import { BigNumber, ethers } from "ethers";
import { FullOfferInfo } from "libs/backend";
import {
  bigNumberString,
  BNToPrecision,
  formatDate,
} from "libs/helperFunctions";
import { FullLoanInfo, TokenAmount } from "libs/types";
import { ReactNode, useEffect } from "react";
import Price from "./Price";
import { statFontSize, tableRowHoverStyle } from "./Theme";

export interface ColSpecs {
  size?: number;
  align?: "left" | "right" | "center";
}

interface TableHeaderViewProps {
  colSpecs: { [key: string]: ColSpecs };
}

const TABLE_ROW_WIDTH = "95%";

export function TableHeaderView(props: TableHeaderViewProps) {
  return (
    <Flex w={"100%"} layerStyle={"level2"}>
      <HStack w={TABLE_ROW_WIDTH} paddingLeft="3" paddingRight="3">
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
    [key: string]: string | Token | TokenAmount | (() => JSX.Element);
  };
  expandedCallback?: (expanded: boolean) => void;
}

function isTokenAmount(obj: any) {
  const val =
    obj !== undefined &&
    typeof obj === "object" &&
    "amount" in obj &&
    "token" in obj;
  return val;
}

export function TableRowView(props: TableRowViewProps) {
  const [expanded, setExpanded] = useBoolean();

  useEffect(() => {
    if (props.expandedCallback !== undefined) {
      props.expandedCallback(expanded);
    }
  }, [expanded]);
  return (
    <Flex
      w="100%"
      layerStyle={"level2"}
      borderBottom={expanded ? "2px" : undefined}
      borderBottomColor={expanded ? "white" : undefined}
      borderBottomRadius={expanded ? 0 : undefined}
      // bg="red"
      onClick={setExpanded.toggle}
      cursor={"pointer"}
      _hover={expanded ? undefined : tableRowHoverStyle}
      alignItems="center"
    >
      <HStack w={TABLE_ROW_WIDTH} paddingX="3" paddingY="1.5">
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
                <Image
                  src={"token_icons/" + token.address + ".png"}
                  height="30px"
                ></Image>
                <Text>{token.symbol}</Text>
              </HStack>
            );
          } else if (isTokenAmount(props.colData[key])) {
            const tokenAmount = props.colData[key] as TokenAmount;
            return (
              <VStack key={key} w={getWidth(key, props.colSpecs)} spacing={0}>
                <Text
                  w={"100%"}
                  textAlign={props.colSpecs[key].align ?? "left"}
                  textStyle={"tableRow"}
                >
                  {bigNumberString(tokenAmount.amount, tokenAmount.token)}
                </Text>
                <Price
                  token={tokenAmount.token}
                  amount={tokenAmount.amount}
                  textAlign={props.colSpecs[key].align ?? "left"}
                  textStyle={"price"}
                  w={"100%"}
                ></Price>
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
      {expanded ? (
        <ChevronUpIcon boxSize={6} marginRight={3} />
      ) : (
        <ChevronDownIcon boxSize={6} marginRight={3} />
      )}
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
