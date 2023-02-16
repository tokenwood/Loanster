import React, { useState } from "react";
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
import {
  erc721ABI,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
} from "wagmi";
import { nonfungiblePositionManagerABI as managerABI } from "abi/NonfungiblePositionManagerABI";
import { PositionInfo, getTokenName } from "libs/uniswap_utils";
import { BigNumber } from "ethers";
import {
  DEFAULT_SIZE,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
} from "libs/constants";
import { getCollateralAddress } from "libs/unilend_utils";
import collateralContractJSON from "../../../chain/artifacts/contracts/CollateralVault.sol/CollateralVault.json";
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
    args: [props.positionId!],
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
    <Card w="100%">
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

          {allowance && allowance == getCollateralAddress() ? (
            <DepositPosition
              hidden={!isDepositing}
              enabled={isDepositing}
              positionId={props.positionId}
              callback={() => {
                console.log("deposited");
                props.callback();
              }}
            />
          ) : (
            <AllowPosition
              hidden={!isDepositing}
              enabled={isDepositing} //{allowance !== undefined}
              positionId={props.positionId}
              callback={function () {
                allowanceRefetch();
              }}
            />
          )}
        </Flex>
      </CardBody>
    </Card>
  );
}

interface DepositProps {
  hidden: boolean;
  enabled: boolean;
  positionId: BigNumber;
  callback: () => any;
}

export function DepositPosition(props: DepositProps) {
  const { config, isError } = usePrepareContractWrite({
    address: getCollateralAddress(),
    abi: collateralContractJSON.abi,
    functionName: "depositPosition",
    enabled: props.enabled,
    args: [props.positionId],
    onError(error) {
      console.log("prepare position deposit error");
      console.log(error);
    },
  });

  const { writeAsync } = useContractWrite(config);

  async function asyncDeposit() {
    try {
      const response = await writeAsync!();
      console.log("position deposit response");
      console.log(response);
      props.callback();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Button
      colorScheme="green"
      size={DEFAULT_SIZE}
      hidden={props.hidden}
      alignSelf="center"
      isDisabled={!props.enabled || !writeAsync || isError}
      onClick={asyncDeposit}
    >
      Confirm
    </Button>
  );
}

interface AllowPositionProps {
  hidden: boolean;
  enabled: boolean;
  positionId: BigNumber;
  callback: () => any;
}

export function AllowPosition(props: AllowPositionProps) {
  const { config, error, isError } = usePrepareContractWrite({
    address: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    abi: erc721ABI,
    functionName: "approve",
    enabled: props.enabled,
    args: [getCollateralAddress(), props.positionId],
    onError(error) {
      console.log("allow position error");
      console.log(error);
    },
  });

  const { writeAsync } = useContractWrite(config);

  async function asyncAllow() {
    try {
      const response = await writeAsync!();
      props.callback();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Button
      colorScheme="green"
      size={DEFAULT_SIZE}
      hidden={props.hidden}
      alignSelf="center"
      isDisabled={!props.enabled || !writeAsync || isError}
      onClick={asyncAllow}
    >
      Allow
    </Button>
  );
}
