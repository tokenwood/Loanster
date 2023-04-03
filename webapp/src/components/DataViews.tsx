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
import { Token } from "@uniswap/sdk-core";
import { BigNumber, ethers } from "ethers";
import { FullOfferInfo } from "libs/backend";
import {
  formatDate,
  FullLoanInfo,
  // FullDepositInfo,
  // getAmountLoanedForDepositInfo,
} from "libs/unilend_utils";
import { useEffect } from "react";
import { statFontSize, tableRowHoverStyle } from "./Theme";

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
  colData: { [key: string]: string | Token };
  expandedCallback?: (expanded: boolean) => void;
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
      <HStack w={"90%"} padding="3">
        {Object.keys(props.colDims).map((key) => {
          if (props.colData[key] instanceof Token) {
            const token = props.colData[key] as Token;
            return (
              <HStack
                key={key}
                w={getWidth(key, props.colDims)}
                textAlign="left"
                textStyle={"tableRow"}
              >
                <Image
                  src={"token_icons/" + token.address + ".png"}
                  height="30px"
                ></Image>
                <Text>{token.symbol}</Text>
              </HStack>
            );
          } else {
            return (
              <Box
                key={key}
                w={getWidth(key, props.colDims)}
                textAlign="left"
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

function getWidth(key: string, colDims: { [key: string]: number }) {
  let totalWidth = 0;
  for (const key in colDims) {
    totalWidth += colDims[key];
  }
  return (colDims[key] * 100) / totalWidth + "%";
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
