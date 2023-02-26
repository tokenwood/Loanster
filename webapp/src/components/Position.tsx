import React from "react";
import {
  Text,
  Button,
  CardBody,
  Card,
  Heading,
  Flex,
  Spacer,
  VStack,
  useBoolean,
} from "@chakra-ui/react";
import { erc721ABI, useContractRead } from "wagmi";
import { nonfungiblePositionManagerABI as managerABI } from "abi/NonfungiblePositionManagerABI";
import { PositionInfo, getTokenName } from "libs/uniswap_utils";
import { BigNumber } from "ethers";
import {
  DEFAULT_SIZE,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
} from "libs/constants";
import { getTroveManagerABI, getTroveManagerAddress } from "libs/unilend_utils";

import { ContractCallButton } from "./BaseComponents";
// import { Position } from "@uniswap/v3-sdk";

interface Props {
  account: `0x${string}` | undefined;
  positionId: BigNumber;
  callback: () => any;
}

export default function Position(props: Props) {
  const [isDepositing, setIsDepositing] = useBoolean();

  const { data: allowance, refetch: allowanceRefetch } = useContractRead({
    address: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    abi: erc721ABI,
    functionName: "getApproved",
    args: [props.positionId],
    enabled: false,
  });

  const { data: positionInfo } = useContractRead({
    address: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    abi: managerABI,
    functionName: "positions",
    args: [props.positionId],
    onSuccess(positionInfo: PositionInfo) {
      console.log("loaded position info");
    },
    onError(error) {
      console.log("error fetching positionInfo");
      console.log(error);
    },
  });

  const getHeaderText = (positionInfo: PositionInfo | undefined) => {
    if (positionInfo) {
      return (
        getTokenName(positionInfo.token0) +
        " / " +
        getTokenName(positionInfo.token1)
      );
    } else {
      return "position info not loaded";
    }
  };

  const getBodyText = (positionInfo: PositionInfo | undefined) => {
    if (positionInfo) {
      return " liquidity: " + positionInfo.liquidity;
    } else {
      return "";
    }
  };

  return (
    <Card w="100%" layerStyle={"level2"}>
      <CardBody margin="-2">
        <Flex>
          {isDepositing ? (
            <Text>Deposit position {getHeaderText(positionInfo)}</Text>
          ) : (
            <VStack align={"left"}>
              <Heading size="xs">{getHeaderText(positionInfo)}</Heading>
              <Text>{getBodyText(positionInfo)}</Text>
            </VStack>
          )}

          <Spacer />
          <Button
            colorScheme="gray"
            size={DEFAULT_SIZE}
            alignSelf={"center"}
            onClick={setIsDepositing.toggle}
          >
            {isDepositing ? "Cancel" : "Deposit"}
          </Button>

          {allowance && allowance == getTroveManagerAddress() ? (
            <ContractCallButton
              contractAddress={getTroveManagerAddress()}
              abi={getTroveManagerABI()}
              functionName={"openTrove"}
              args={[
                NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
                props.positionId,
              ]}
              hidden={!isDepositing}
              enabled={isDepositing}
              callback={() => props.callback()}
            ></ContractCallButton>
          ) : (
            <ContractCallButton
              contractAddress={NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS}
              abi={erc721ABI}
              functionName={"approve"}
              args={[getTroveManagerAddress(), props.positionId]}
              hidden={!isDepositing}
              enabled={isDepositing}
              callback={() => allowanceRefetch()}
              buttonText="Approve"
            ></ContractCallButton>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
}
