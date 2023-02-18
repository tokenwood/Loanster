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
import { Address, erc20ABI, useBalance, useContractRead } from "wagmi";
import { BigNumber } from "ethers";
import {
  getSupplyAddress,
  floatToBigNumber,
  getSupplyABI,
} from "libs/unilend_utils";
import { ethers } from "ethers";
import { DEFAULT_SIZE } from "libs/constants";
import { ContractCallButton } from "./BaseComponents";

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

  const { data: allowance, refetch: allowanceRefetch } = useContractRead({
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

  const { data: balanceData, refetch: balanceRefetch } = useBalance({
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
            size={DEFAULT_SIZE}
            onClick={setIsDepositing.toggle}
            alignSelf="center"
          >
            {isDepositing ? "Cancel" : "Deposit"}
          </Button>

          {hasEnoughAllowance(allowance, amountToDeposit) ? (
            <ContractCallButton
              contractAddress={getSupplyAddress()}
              abi={getSupplyABI()}
              functionName={"makeDeposit"}
              args={[
                props.tokenAddress,
                amountToDeposit,
                BigNumber.from(0),
                BigNumber.from(0),
              ]}
              hidden={!isDepositing}
              enabled={canConfirm()}
              callback={() => onDepositConfirmed()}
            ></ContractCallButton>
          ) : (
            <ContractCallButton
              contractAddress={props.tokenAddress}
              abi={erc20ABI}
              functionName={"approve"}
              args={[getSupplyAddress(), ethers.constants.MaxUint256]}
              hidden={!isDepositing}
              enabled={canConfirm()}
              callback={() => allowanceRefetch()}
              buttonText="approve"
            ></ContractCallButton>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
}
