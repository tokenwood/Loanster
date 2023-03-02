import React, { useState } from "react";
import { Box, Flex, Spacer } from "@chakra-ui/react";
import { VStack } from "@chakra-ui/layout";
import { Address, erc20ABI, useContractRead } from "wagmi";
import { BigNumber } from "ethers";
import {
  getSupplyAddress,
  TokenBalanceInfo,
  getTroveManagerABI,
  getTroveManagerAddress,
  getSupplyABI,
} from "libs/unilend_utils";
import { ethers } from "ethers";
import { ContractCallButton } from "./BaseComponents";
import { DateInput, MyNumberInput, TokenAmountInput } from "./InputFields";
import { eventEmitter, EventType } from "libs/eventEmitter";

export interface InputsProps {
  balanceData: TokenBalanceInfo;
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

export interface DepositInputsProps {
  account: Address;
  balanceData: TokenBalanceInfo;
  approvalAddress: Address;
  callback: () => any;
}

export function CollateralDepositInputs(props: DepositInputsProps) {
  const [amountToDeposit, setAmountToDeposit] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const { data: allowance, refetch: allowanceRefetch } = useContractRead({
    address: props.balanceData.token.address as Address,
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
      amountToDeposit.lte(props.balanceData.amount)
    );
  };

  return (
    <VStack w="100%" layerStyle={"level3"} spacing={0} padding="2">
      {/* <VStack w="100%" layerStyle={"level3"} padding="5px"> */}
      <TokenAmountInput
        balanceData={props.balanceData}
        callback={(amount: BigNumber) => {
          setAmountToDeposit(amount);
        }}
      />
      {/* </VStack> */}
      <Flex w="100%">
        <Spacer></Spacer>
        {hasEnoughAllowance(allowance, amountToDeposit) ? (
          <ContractCallButton
            contractAddress={getTroveManagerAddress()}
            abi={getTroveManagerABI()}
            functionName={"openTrove"}
            args={[props.balanceData.token.address, amountToDeposit]}
            enabled={canConfirm()}
            callback={() => {
              props.callback();
            }}
          ></ContractCallButton>
        ) : (
          <ContractCallButton
            contractAddress={props.balanceData.token.address as Address}
            abi={erc20ABI}
            functionName={"approve"}
            args={[props.approvalAddress, ethers.constants.MaxUint256]}
            enabled={canConfirm()}
            callback={allowanceRefetch}
            buttonText="Approve"
          ></ContractCallButton>
        )}
      </Flex>
    </VStack>
  );
}

export function SupplyDepositInputs(props: DepositInputsProps) {
  const [amountToDeposit, setAmountToDeposit] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const [expirationDate, setExpirationDate] = useState<number>();
  const [interestRate, setInterestRate] = useState<number>();
  const [maxDuration, setMaxDuration] = useState<number>();

  const { data: allowance, refetch: allowanceRefetch } = useContractRead({
    address: props.balanceData.token.address as Address,
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
      amountToDeposit.lte(props.balanceData.amount)
    );
  };

  return (
    <VStack w="100%" spacing={0} layerStyle={"level3"} padding={3}>
      <TokenAmountInput
        balanceData={props.balanceData}
        callback={(amount: BigNumber) => {
          setAmountToDeposit(amount);
        }}
      />
      <MyNumberInput
        name="Interest rate (%)"
        callback={(rate: number) => {
          setInterestRate(rate);
        }}
      ></MyNumberInput>
      <MyNumberInput
        name="Max duration (days)"
        callback={(value: number) => {
          setMaxDuration(value);
        }}
      ></MyNumberInput>
      <DateInput
        callback={(timestamp: number) => {
          setExpirationDate(timestamp);
        }}
      />
      <Flex w="100%" paddingTop={2}>
        <Spacer></Spacer>
        {hasEnoughAllowance(allowance, amountToDeposit) ? (
          <ContractCallButton
            contractAddress={getSupplyAddress()}
            abi={getSupplyABI()}
            functionName={"makeDeposit"}
            args={[
              props.balanceData.token.address,
              amountToDeposit,
              BigNumber.from(0), //interest rate
              BigNumber.from(0), //expiration timestamp
              BigNumber.from(0), //max loan duration
            ]}
            enabled={canConfirm()}
            callback={() => {
              eventEmitter.dispatch({
                eventType: EventType.SUPPLY_TOKEN_DEPOSITED,
              });
              props.callback();
            }}
          ></ContractCallButton>
        ) : (
          <ContractCallButton
            contractAddress={props.balanceData.token.address as Address}
            abi={erc20ABI}
            functionName={"approve"}
            args={[props.approvalAddress, ethers.constants.MaxUint256]}
            enabled={canConfirm()}
            callback={() => allowanceRefetch()}
            buttonText="Approve"
          />
        )}
      </Flex>
    </VStack>
  );
}
