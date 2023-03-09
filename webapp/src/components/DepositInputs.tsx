import React, { useEffect, useState } from "react";
import { Box, Flex, Select, Spacer, Text } from "@chakra-ui/react";
import { VStack } from "@chakra-ui/layout";
import { Address, erc20ABI, useContractRead, useProvider } from "wagmi";
import { BigNumber } from "ethers";
import {
  getSupplyAddress,
  TokenBalanceInfo,
  getTroveManagerABI,
  getTroveManagerAddress,
  getSupplyABI,
  getSupplyTokenAddresses,
  getSupplyTokens,
  floatToBigNumber,
  getTroveIds,
} from "libs/unilend_utils";
import { ethers } from "ethers";
import { ContractCallButton } from "./BaseComponents";
import { DateInput, MyNumberInput, TokenAmountInput } from "./InputFields";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { DataLoader } from "./DataLoaders";
import { LoanParameters } from "libs/market_utils";

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
  const [expirationDate, setExpirationDate] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [maxDuration, setMaxDuration] = useState<number>(0);
  const [minDuration, setMinDuration] = useState<number>(0);

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
    <VStack w="65%" spacing={0} layerStyle={"level3"} padding={3}>
      <TokenAmountInput
        balanceData={props.balanceData}
        callback={(amount: BigNumber) => {
          setAmountToDeposit(amount);
        }}
      />
      <MyNumberInput
        name="Interest rate (%)"
        precision={2}
        callback={(rate: number) => {
          setInterestRate(rate);
        }}
      ></MyNumberInput>
      <MyNumberInput
        name="Max duration (days)"
        precision={0}
        placeHolder="0"
        callback={(value: number) => {
          setMaxDuration(value);
        }}
      ></MyNumberInput>
      <MyNumberInput
        name="Min duration (days)"
        precision={0}
        placeHolder="0"
        callback={(value: number) => {
          setMinDuration(value);
        }}
      ></MyNumberInput>
      <DateInput
        name="Expiration"
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
              BigNumber.from(Math.round(interestRate * 100)), // interest rate
              BigNumber.from(expirationDate), // expiration timestamp
              BigNumber.from(maxDuration), // max loan duration
              BigNumber.from(minDuration), // min loan duration
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

interface BorrowInputProps {
  account: Address;
  callback: (params: LoanParameters) => any;
}

export function BorrowInputs(props: BorrowInputProps) {
  const [tokenToBorrow, setTokenToBorrow] = useState<Address>();
  const [amountToBorrow, setAmountToBorrow] = useState<number>(0);
  const [term, setTerm] = useState<number>();
  const [minDuration, setMinDuration] = useState<number>();
  const provider = useProvider();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTokenToBorrow(event.target.value as Address);
  };

  useEffect(() => {
    props.callback({
      tokenAddress: tokenToBorrow!,
      amount: amountToBorrow,
      term: 0,
    });
  }, [tokenToBorrow, amountToBorrow]);

  return (
    <VStack w="100%" spacing={0} layerStyle={"level3"} padding={3}>
      <DataLoader
        fetcher={() => getSupplyTokens(provider)}
        defaultValue={[]}
        dataLoaded={(tokens) => {
          if (tokenToBorrow == undefined) {
            setTokenToBorrow(tokens[0].address as Address);
          }
        }}
        makeChildren={(childProps) => {
          return (
            <Flex w="100%">
              <Text alignSelf={"center"} ml="0">
                {"Token"}
              </Text>
              <Spacer />
              <Select
                width={"100px"}
                textAlign={"right"}
                // placeholder="Select"
                value={tokenToBorrow}
                onChange={handleChange}
              >
                {childProps.data.map((token) => (
                  <option value={token.address} key={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </Select>
            </Flex>
          );
        }}
      ></DataLoader>

      <MyNumberInput
        name="Amount"
        // precision={0}
        placeHolder="0"
        callback={(value: number) => {
          setAmountToBorrow(value);
        }}
      ></MyNumberInput>
      {/* <DateInput
        name="Loan Term"
        callback={(value: number) => {
          setTerm(value);
        }}
      ></DateInput> */}
      {/* <MyNumberInput
        name="Min duration (days)"
        precision={0}
        placeHolder="0"
        callback={(value: number) => {
          setMinDuration(value);
        }}
      ></MyNumberInput> */}
    </VStack>
  );
}

interface LoanTroveInputProps {
  account: Address;
  callback: (troveId: number) => any;
}

export function LoanTroveInput(props: LoanTroveInputProps) {
  const [troveId, setTroveId] = useState<number>();
  const provider = useProvider();

  const handleTroveChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const troveId = parseInt(event.target.value);
    setTroveId(troveId);
    props.callback(troveId);
  };

  return (
    <VStack
      w="100%"
      spacing={0}
      layerStyle={"level3"}
      padding={3}
      alignSelf="center"
    >
      <DataLoader
        fetcher={() => getTroveIds(provider, props.account)}
        makeChildren={(props) => {
          return (
            <Flex w="100%">
              <Text alignSelf={"center"} ml="0">
                {"Trove"}
              </Text>
              <Spacer />
              <Select
                width={"30%"}
                textAlign={"right"}
                placeholder="Select"
                value={troveId}
                onChange={handleTroveChange}
              >
                {props.data.map((selectedTroveId) => (
                  <option
                    value={selectedTroveId.toString()}
                    key={selectedTroveId}
                  >
                    trove id: {selectedTroveId}
                  </option>
                ))}
              </Select>
            </Flex>
          );
        }}
      ></DataLoader>
    </VStack>
  );
}
