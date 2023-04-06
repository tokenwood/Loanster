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

function getWidth(key: string, colDims: { [key: string]: number }) {
  let totalWidth = 0;
  for (const key in colDims) {
    totalWidth += colDims[key];
  }
  return (colDims[key] * 100) / totalWidth + "%";
}
