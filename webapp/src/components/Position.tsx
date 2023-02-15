import React, { useEffect, useState, useMemo } from "react";
import {
  Text,
  Button,
  CardBody,
  CardHeader,
  StackDivider,
  Stack,
  Card,
  Heading,
  Flex,
  Spacer,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { Box } from "@chakra-ui/layout";
import { useContractRead, useContractReads } from "wagmi";
import { nonfungiblePositionManagerABI as managerABI } from "abi/NonfungiblePositionManagerABI";
import { PositionInfo, getTokenName } from "libs/uniswap_utils";
import { BigNumber } from "ethers";

// import {PositionInfo} from "@uniswap/lib/liquidity"

interface Props {
  posManager: `0x${string}` | undefined;
  account: `0x${string}` | undefined;
  positionId: BigNumber | undefined;
}

export default function Position(props: Props) {
  const [headerText, setHeaderText] = useState<string>("position info");
  const [bodyText, setBodyText] = useState<string>("position info");

  const { data: positionInfo, refetch: refetchPositionInfo } = useContractRead({
    address: props.posManager,
    abi: managerABI,
    functionName: "positions",
    args: [props.positionId],
    enabled: true,
    onSuccess(positionInfo: PositionInfo) {
      setHeaderText(
        getTokenName(positionInfo.token0) +
          " / " +
          getTokenName(positionInfo.token1)
      );
      setBodyText(" liquidity: " + positionInfo.liquidity);
    },
    onError(error) {
      console.log("error fetching positionInfo");
      console.log(error);
    },
  });

  return (
    <Card w="100%">
      <CardBody margin="-2">
        <Flex>
          <VStack align={"left"}>
            <Heading size="xs">{headerText}</Heading>
            <Text>{bodyText}</Text>
          </VStack>

          <Spacer />
          <Button colorScheme="gray" size="xs" alignSelf={"center"}>
            Deposit
          </Button>
        </Flex>
      </CardBody>
    </Card>
  );
}
