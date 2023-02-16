import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Flex,
  HStack,
  NumberInput,
  NumberInputField,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useBoolean } from "@chakra-ui/react";
import { Box } from "@chakra-ui/layout";
import {
  Address,
  erc20ABI,
  useBalance,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import supplyContractJSON from "../../../chain/artifacts/contracts/Supply.sol/Supply.json";
import { BigNumber } from "ethers";
import { getSupplyAddress, floatToBigNumber } from "libs/unilend_utils";
import { ethers } from "ethers";
import { DEFAULT_SIZE } from "libs/constants";

interface Props {
  account: Address;
  tokenAddress: Address;
}

export default function Balance(props: Props) {
  const [text, setText] = useState<string>("balance not loaded");
  const [isDepositing, setIsDepositing] = useBoolean();
  const [amountToDeposit, setAmountToDeposit] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const [balance, setBalance] = useState<BigNumber>();

  const {
    data: allowance,
    isError: allowanceIsError,
    isLoading: allowanceIsLoading,
    refetch: allowanceRefetch,
  } = useContractRead({
    address: props.tokenAddress as Address,
    abi: erc20ABI,
    functionName: "allowance",
    args: [props.account, getSupplyAddress()],
  });

  const numberChanged = (valueAsString: string, valueAsNumber: number) => {
    if (valueAsString == "") {
      setAmountToDeposit(BigNumber.from(0));
    } else {
      setAmountToDeposit(
        floatToBigNumber(valueAsString, balanceData!.decimals)
      );
    }
  };

  const {
    data: balanceData,
    isError,
    isLoading,
    isIdle,
    refetch: balanceRefetch,
  } = useBalance({
    token: props.tokenAddress,
    address: props.account,
    onError(error) {
      console.log(error);
      setText("Balance error");
    },
    onSuccess(data) {
      setBalance(data.value);
      setText(
        "Balance: " + parseFloat(data.formatted).toFixed(2) + " " + data.symbol
      );
    },
  });

  const onMaxClicked = () => {
    setAmountToDeposit(balance!);
  };

  const hasEnoughAllowance = (
    allowance: BigNumber | undefined,
    amountToDeposit: BigNumber
  ) => {
    return allowance && allowance.gte(amountToDeposit);
  };

  const canConfirm = () => {
    if (balance) {
      return (
        BigNumber.from(0).lt(amountToDeposit) && amountToDeposit.lte(balance!)
      );
    } else {
      return false;
    }
  };

  const onDepositConfirmed = () => {
    setAmountToDeposit(BigNumber.from(0));
    setIsDepositing.off();
    balanceRefetch();
  };

  const onClickConfirm = () => {
    console.log("hello");
  };

  return (
    <Card w="100%">
      <CardBody margin={-2}>
        <Flex>
          {isDepositing ? (
            <HStack>
              <Text>Deposit {balanceData?.symbol}</Text>
              <NumberInput
                value={
                  amountToDeposit.isZero()
                    ? ""
                    : Number(
                        ethers.utils.formatUnits(
                          amountToDeposit,
                          balanceData?.decimals
                        )
                      )
                }
                size={DEFAULT_SIZE}
                onChange={numberChanged}
                hidden={!isDepositing}
              >
                <NumberInputField />
              </NumberInput>
              <Button
                size={DEFAULT_SIZE}
                colorScheme={"blue"}
                onClick={onMaxClicked}
              >
                Max
              </Button>
            </HStack>
          ) : (
            <Box alignSelf="center">{text}</Box>
          )}

          <Spacer />
          <Button
            colorScheme="gray"
            // h={"100%"}
            size={DEFAULT_SIZE}
            onClick={setIsDepositing.toggle}
            alignSelf="center"
          >
            {isDepositing ? "Cancel" : "Deposit"}
          </Button>

          {hasEnoughAllowance(allowance, amountToDeposit) ? (
            <Deposit
              hidden={!isDepositing}
              enabled={canConfirm()}
              tokenAddress={props.tokenAddress}
              amount={amountToDeposit}
              expiration={BigNumber.from(0)}
              interestRateBPS={BigNumber.from(0)}
              callback={() => {
                onDepositConfirmed();
              }}
            />
          ) : (
            <Allow
              hidden={!isDepositing}
              enabled={canConfirm()}
              tokenAddress={props.tokenAddress}
              callback={() => allowanceRefetch()}
            ></Allow>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
}

interface DepositProps {
  hidden: boolean;
  enabled: boolean;
  tokenAddress: string;
  amount: BigNumber;
  expiration: BigNumber;
  interestRateBPS: BigNumber;
  callback: () => any;
}

export function Deposit(props: DepositProps) {
  const { config, isError } = usePrepareContractWrite({
    address: getSupplyAddress(),
    abi: supplyContractJSON.abi,
    functionName: "makeDeposit",
    enabled: props.enabled,
    args: [
      props.tokenAddress,
      props.amount,
      props.expiration,
      props.interestRateBPS,
    ],
    onError(error) {
      console.log("prepare deposit error");
      console.log(error);
    },
  });

  const { writeAsync } = useContractWrite(config);

  async function asyncDeposit() {
    try {
      await writeAsync!();
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

interface AllowProps {
  hidden: boolean;
  enabled: boolean;
  tokenAddress: Address;
  callback: () => any;
}

export function Allow(props: AllowProps) {
  const { config, error, isError } = usePrepareContractWrite({
    address: props.tokenAddress as Address,
    abi: erc20ABI,
    functionName: "approve",
    enabled: props.enabled,
    args: [getSupplyAddress(), ethers.constants.MaxUint256],
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
      isDisabled={!props.enabled || !writeAsync}
      onClick={asyncAllow}
    >
      Allow
    </Button>
  );
}
