import React, { ReactNode, useState } from "react";
import { Button, Card, CardBody, Flex, Spacer } from "@chakra-ui/react";
import { useBoolean } from "@chakra-ui/react";
import { Box, VStack } from "@chakra-ui/layout";
import { Address, erc20ABI, useBalance, useContractRead } from "wagmi";
import { BigNumber } from "ethers";
import { getSupplyAddress, floatToBigNumber } from "libs/unilend_utils";
import { FetchBalanceResult } from "@wagmi/core";
import { ethers } from "ethers";
import { DEFAULT_SIZE } from "libs/constants";
import { ContractCallButton } from "./BaseComponents";

export interface InputsProps {
  balanceData: FetchBalanceResult;
  callback: (name: string, value: any) => any;
}

export interface ContractCallProps {
  tokenAddress: Address;
  amount: BigNumber;
  enabled: boolean;
  expiration?: number;
  maxDuration?: number;
  callback: () => any;
}

interface TokenBalanceProps {
  account: Address;
  tokenAddress: Address;
  approvalAddress: Address;
  contractCallComponent: (callProps: ContractCallProps) => ReactNode;
  inputsComponent: (inputsProps: InputsProps) => ReactNode;
}

export default function TokenBalance(props: TokenBalanceProps) {
  const [text, setText] = useState<string>("balance not loaded");
  const [isDepositing, setIsDepositing] = useBoolean();

  const { data: balanceData, refetch: balanceRefetch } = useBalance({
    token: props.tokenAddress,
    address: props.account,
    onError(error) {
      console.log(error);
      setText("Balance error");
    },
    onSuccess(data) {
      setText(
        "Balance: " + parseFloat(data.formatted).toFixed(2) + " " + data.symbol
      );
    },
  });

  const onDepositConfirmed = () => {
    setIsDepositing.off();
    balanceRefetch();
  };

  return (
    <Card w="100%">
      <CardBody margin={-2}>
        <VStack>
          <Flex w="100%">
            <Box fontWeight={isDepositing ? "bold" : undefined}>
              {isDepositing ? "Deposit" : text}
            </Box>
            <Spacer />
            <Button
              colorScheme="gray"
              size={DEFAULT_SIZE}
              onClick={setIsDepositing.toggle}
              alignSelf="right"
            >
              {isDepositing ? "Cancel" : "Deposit"}
            </Button>
          </Flex>

          {isDepositing ? (
            <DepositInputs
              account={props.account}
              tokenAddress={props.tokenAddress}
              approvalAddress={props.approvalAddress}
              balanceData={balanceData!} // todo disable deposit when not loaded
              contractCallComponent={props.contractCallComponent}
              inputsComponent={props.inputsComponent}
              callback={onDepositConfirmed}
            ></DepositInputs>
          ) : (
            <></>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

export interface DepositInputsProps {
  account: Address;
  tokenAddress: Address;
  balanceData: FetchBalanceResult;
  approvalAddress: Address;
  contractCallComponent: (callProps: ContractCallProps) => ReactNode;
  inputsComponent: (inputsProps: InputsProps) => ReactNode;
  callback: () => any;
}

export function DepositInputs(props: DepositInputsProps) {
  const [amountToDeposit, setAmountToDeposit] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const { data: allowance, refetch: allowanceRefetch } = useContractRead({
    address: props.tokenAddress as Address,
    abi: erc20ABI,
    functionName: "allowance",
    args: [props.account, props.approvalAddress],
  });

  const hasEnoughAllowance = (
    allowance: BigNumber | undefined,
    amountToDeposit: BigNumber
  ) => {
    return allowance && allowance.gte(amountToDeposit);
  };

  const canConfirm = () => {
    return (
      BigNumber.from(0).lt(amountToDeposit) &&
      amountToDeposit.lte(props.balanceData.value)
    );
  };

  return (
    <VStack w="100%">
      {props.inputsComponent({
        balanceData: props.balanceData,
        callback: (name: string, value: any) => {
          if (name == "amount") {
            setAmountToDeposit(value);
          }
        },
      })}
      <Flex w="100%">
        <Spacer></Spacer>
        {hasEnoughAllowance(allowance, amountToDeposit) ? (
          props.contractCallComponent({
            tokenAddress: props.tokenAddress,
            amount: amountToDeposit,
            enabled: canConfirm(),
            callback: () => {
              setAmountToDeposit(BigNumber.from(0));
              props.callback();
            },
          })
        ) : (
          <ContractCallButton
            contractAddress={props.tokenAddress}
            abi={erc20ABI}
            functionName={"approve"}
            args={[props.approvalAddress, ethers.constants.MaxUint256]}
            enabled={canConfirm()}
            callback={() => allowanceRefetch()}
            buttonText="Approve"
          ></ContractCallButton>
        )}
      </Flex>
    </VStack>
  );
}
