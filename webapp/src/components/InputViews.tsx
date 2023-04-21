import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Select,
  Spacer,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { HStack, VStack } from "@chakra-ui/layout";
import { Address, erc20ABI, useContractRead, useProvider } from "wagmi";
import { Provider } from "@wagmi/core";
import { BigNumber } from "ethers";

import { ethers } from "ethers";
import { ContractCallButton, SignButton } from "./BaseComponents";
import { DateInput, MyNumberInput, TokenAmountInput } from "./InputFields";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { ChildProps, DataLoader, TableLoader } from "./DataLoaders";
import { defaultBorderRadius, DEFAULT_SIZE } from "./Theme";
import {
  FullOfferInfo,
  getOffersForLoanParams,
  submitOffer,
} from "libs/backend";
import { Token } from "@uniswap/sdk-core";
import {
  getSupplyAddress,
  getTroveManagerABI,
  getTroveManagerAddress,
} from "libs/chainUtils";
import {
  getHealthFactor,
  getNewHealthFactor,
  getERC20BalanceAndAllowance,
  getUnusedOfferId,
  getOfferMessageToSign,
} from "libs/fetchers";
import {
  bigNumberString,
  floatToBigNumber,
  getLoanStats,
  healthFactorColor,
} from "libs/helperFunctions";
import {
  TokenDepositInfo,
  FullLoanInfo,
  LoanType,
  TokenAmount,
  LoanOfferType,
  LoanParameters,
} from "libs/types";
import { SimpleRow } from "./DataViews";

export interface HealthFactorProps {
  healthFactor?: number;
  newHealthFactor?: number;
}
export function HealthFactor(props: HealthFactorProps) {
  return (
    <Flex w="100%">
      <Text>Health Factor</Text>
      <Spacer></Spacer>
      <HStack>
        <Text color={healthFactorColor(props.healthFactor)} fontWeight="bold">
          {props.healthFactor != undefined
            ? props.healthFactor == Number.POSITIVE_INFINITY
              ? "∞"
              : props.healthFactor.toFixed(2)
            : "undefined"}
        </Text>
        <Text>{"->"}</Text>
        {props.newHealthFactor != undefined ? (
          <Text
            color={healthFactorColor(props.newHealthFactor)}
            fontWeight="bold"
          >
            {props.newHealthFactor == Number.POSITIVE_INFINITY
              ? "∞"
              : props.newHealthFactor.toFixed(2)}
          </Text>
        ) : (
          <Text>{"?"}</Text>
        )}
      </HStack>
    </Flex>
  );
}

export interface DepositInputsProps {
  account: Address;
  balanceData: TokenDepositInfo;
  callback: () => any;
  type: "deposit" | "withdraw";
}

export function CollateralInputs(props: DepositInputsProps) {
  const provider = useProvider();
  const [healthFactor, setHealthFactor] = useState<number>();
  const [newHealthFactor, setNewHealthFactor] = useState<number>();
  const [amount, setAmount] = useState<BigNumber>(BigNumber.from(0));

  const { data: allowance, refetch: allowanceRefetch } = useContractRead({
    address: props.balanceData.token.address as Address,
    abi: erc20ABI,
    enabled: props.type == "deposit",
    functionName: "allowance",
    args: [props.account, getTroveManagerAddress(provider)],
  });

  const updateHealthFactor = async () => {
    const healthFactor = await getHealthFactor(provider, props.account);
    setHealthFactor(healthFactor);
  };

  const updateNewHealthFactor = async () => {
    const healthFactor = await getNewHealthFactor(
      provider,
      props.account,
      props.balanceData.token.address as Address,
      props.type == "deposit" ? amount : undefined,
      props.type == "withdraw" ? amount : undefined
    );
    setNewHealthFactor(healthFactor);
  };

  useEffect(() => {
    if (healthFactor == undefined) {
      updateHealthFactor();
    }
    updateNewHealthFactor();
  }, [amount]);

  const hasEnoughAllowance = (
    allowance: BigNumber | undefined,
    amountToDeposit: BigNumber
  ) => {
    return allowance && allowance.gte(amountToDeposit);
  };

  const canConfirm = () => {
    return (
      BigNumber.from(0).lt(amount) &&
      amount.lte(props.balanceData.wallet_amount)
    );
  };

  return (
    <VStack w="60%">
      <Box layerStyle={"level3"} paddingX="3" paddingY="1" w="100%">
        <TokenAmountInput
          balance={
            props.type == "deposit"
              ? props.balanceData.wallet_amount
              : props.balanceData.deposit_amount!
          }
          token={props.balanceData.token}
          callback={(amount: BigNumber) => {
            setAmount(amount);
          }}
        />
      </Box>

      <HealthFactor
        healthFactor={healthFactor}
        newHealthFactor={newHealthFactor}
      ></HealthFactor>

      <Flex w="100%">
        <Spacer></Spacer>

        {props.type == "deposit" ? (
          hasEnoughAllowance(allowance, amount) ? (
            <ContractCallButton
              contractAddress={getTroveManagerAddress(provider)}
              abi={getTroveManagerABI()}
              functionName={"deposit"}
              args={[props.balanceData.token.address, amount]}
              enabled={canConfirm()}
              callback={() => {
                props.callback();
                eventEmitter.dispatch({
                  eventType: EventType.COLLATERAL_TOKEN_DEPOSITED,
                  suffix: props.balanceData.token.address,
                });
              }}
            ></ContractCallButton>
          ) : (
            <ContractCallButton
              contractAddress={props.balanceData.token.address as Address}
              abi={erc20ABI}
              functionName={"approve"}
              args={[
                getTroveManagerAddress(provider),
                ethers.constants.MaxUint256,
              ]}
              enabled={canConfirm()}
              callback={allowanceRefetch}
              buttonText="Approve"
            ></ContractCallButton>
          )
        ) : (
          <ContractCallButton
            contractAddress={getTroveManagerAddress(provider)}
            abi={getTroveManagerABI()}
            functionName={"withdraw"}
            args={[
              props.balanceData.token.address,
              props.balanceData.deposit_amount?.sub(amount),
            ]}
            enabled={canConfirm()}
            callback={() => {
              props.callback();
              eventEmitter.dispatch({
                eventType: EventType.COLLATERAL_TOKEN_WITHDRAWN,
                suffix: props.balanceData.token.address,
              });
            }}
          ></ContractCallButton>
        )}
      </Flex>
    </VStack>
  );
}

export interface RepayLoanInputs {
  account: Address;
  loanInfo: FullLoanInfo;
  callback: () => any;
}

export function RepayLoanInputs(props: RepayLoanInputs) {
  const [debtAmount, setDebtAmount] = useState<BigNumber>(
    props.loanInfo.loan.amount
  );
  const [healthFactor, setHealthFactor] = useState<number>();
  const [newHealthFactor, setNewHealthFactor] = useState<number>();
  const [paymentInfo, setPaymentInfo] = useState<BigNumber[]>();
  const provider = useProvider();

  const updateHealthFactor = async () => {
    const healthFactor = await getHealthFactor(provider, props.account);
    setHealthFactor(healthFactor);
  };

  const updateNewHealthFactor = async (paymentInfo: BigNumber[]) => {
    const newHealthFactor = await getNewHealthFactor(
      provider,
      props.account,
      props.loanInfo.token.address as Address,
      undefined,
      undefined,
      undefined,
      getTotalPayment(paymentInfo)
    );
    setNewHealthFactor(newHealthFactor);
  };

  useEffect(() => {
    if (healthFactor == undefined) {
      updateHealthFactor();
    }
    updatePaymentAmount(debtAmount, props.loanInfo.loan);
  }, [debtAmount]);

  const hasEnoughAllowance = (
    allowance: BigNumber | undefined,
    amountToDeposit: BigNumber
  ) => {
    return allowance && allowance.gte(amountToDeposit);
  };

  // const canConfirm = (balance: BigNumber) => {
  //   return BigNumber.from(0).lt(debtAmount) && debtAmount.lte(balance);
  // };

  function getInterest(
    amount: BigNumber,
    interestRateBPS: number,
    duration: number
  ) {
    return amount
      .mul(duration)
      .mul(interestRateBPS)
      .div(10000 * 365 * 24 * 60 * 60);
  }

  const getTotalPayment = (paymentInfo: BigNumber[]) => {
    return (paymentInfo ?? []).reduce(
      (acc: BigNumber, val: BigNumber) => acc.add(val),
      BigNumber.from(0)
    );
  };

  async function updatePaymentAmount(debtAmount: BigNumber, loan: LoanType) {
    const currentBlock = await provider.getBlockNumber();
    const currentTime = (await provider.getBlock(currentBlock)).timestamp;
    const interest = getInterest(
      loan.amount,
      loan.interestRateBPS,
      currentTime - loan.startTime
    );
    const earlyRepaymentFee =
      currentTime < loan.minRepayTime
        ? getInterest(
            loan.amount,
            loan.interestRateBPS,
            loan.minRepayTime - currentTime
          )
        : BigNumber.from(0);
    const principal = debtAmount.lt(loan.amount)
      ? loan.amount.sub(debtAmount)
      : BigNumber.from(0);
    setPaymentInfo([principal, interest, earlyRepaymentFee]);
    updateNewHealthFactor([principal, interest, earlyRepaymentFee]);
  }

  return (
    <DataLoader
      fetcher={() =>
        getERC20BalanceAndAllowance(
          provider,
          props.account,
          getSupplyAddress(provider),
          props.loanInfo.token.address as Address
        )
      }
      makeChildren={(childProps) => {
        const [balance, allowance] = childProps.data;
        return (
          <VStack w="60%">
            <Box layerStyle={"level3"} paddingX="3" paddingY="1" w="100%">
              <TokenAmountInput
                balance={props.loanInfo.interest.add(
                  props.loanInfo.loan.amount
                )}
                defaultValue={ethers.utils
                  .formatUnits(debtAmount, props.loanInfo.token.decimals)
                  .toString()}
                text={"Set Remaining Debt"}
                buttonText={"Min"}
                buttonValue={
                  debtAmount.sub(balance).gt(0)
                    ? debtAmount.sub(balance).toString()
                    : "0"
                }
                token={props.loanInfo.token}
                callback={(amount: BigNumber) => {
                  setDebtAmount(amount);
                }}
              />
            </Box>

            {paymentInfo !== undefined ? (
              <VStack w="100%" paddingX="3" paddingY="1">
                {paymentInfo[2].gt(0) ? (
                  <Flex w="100%">
                    <Text>Early Repayment Fee</Text>
                    <Spacer></Spacer>
                    <HStack>
                      <Text>
                        {" "}
                        {ethers.utils.formatUnits(
                          paymentInfo[2],
                          props.loanInfo.token.decimals
                        ) +
                          " " +
                          props.loanInfo.token.symbol}
                      </Text>
                    </HStack>
                  </Flex>
                ) : (
                  <></>
                )}
                <Flex w="100%">
                  <Text>Amount to pay</Text>
                  <Spacer></Spacer>
                  <HStack>
                    <Text>
                      {bigNumberString(
                        paymentInfo[0].add(paymentInfo[1]),
                        props.loanInfo.token
                      ) +
                        " " +
                        props.loanInfo.token.symbol}
                    </Text>
                  </HStack>
                </Flex>
                <HealthFactor
                  healthFactor={healthFactor}
                  newHealthFactor={newHealthFactor}
                />
                <Flex w="100%">
                  <Spacer></Spacer>
                  {hasEnoughAllowance(
                    allowance,
                    getTotalPayment(paymentInfo)
                  ) ? (
                    <ContractCallButton
                      contractAddress={getTroveManagerAddress(provider)}
                      abi={getTroveManagerABI()}
                      functionName={"repayLoan"}
                      args={[props.loanInfo.loanId, debtAmount]}
                      enabled={true}
                      callback={() => {
                        console.log("loan repaid");
                        props.callback();
                        eventEmitter.dispatch({
                          eventType: EventType.LOAN_REPAID,
                          suffix: props.loanInfo.loanId,
                        });
                      }}
                    ></ContractCallButton>
                  ) : (
                    <ContractCallButton
                      contractAddress={props.loanInfo.token.address as Address}
                      abi={erc20ABI}
                      functionName={"approve"}
                      args={[
                        getSupplyAddress(provider),
                        ethers.constants.MaxUint256,
                      ]}
                      enabled={true}
                      callback={childProps.refetchData}
                      buttonText="Approve"
                    ></ContractCallButton>
                  )}
                </Flex>
              </VStack>
            ) : (
              <></>
            )}
          </VStack>
        );
      }}
    ></DataLoader>
  );
}

interface BorrowInputProps {
  account: Address;
  token: Token;
  callback: () => void;
}

export function BorrowInputs(props: BorrowInputProps) {
  const [amountToBorrow, setAmountToBorrow] = useState<number>(0);
  const [term, setTerm] = useState<number>();
  const [duration, setDuration] = useState<number>(0);
  const [loanParams, setLoanParams] = useState<LoanParameters>();
  const provider = useProvider();

  useEffect(() => {
    setLoanParams({
      token: props.token,
      amount: floatToBigNumber(amountToBorrow.toString(), props.token.decimals),
      duration: duration * 24 * 60 * 60, //todo
    });
  }, [amountToBorrow, duration]);

  return (
    <VStack w="60%">
      <VStack layerStyle={"level3"} paddingX="3" paddingY="1" w="100%">
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
        <MyNumberInput
          name="Duration (days)"
          precision={0}
          placeHolder="0"
          buttons={[
            ["1w", "7"],
            ["1m", "30"],
            ["1y", "365"],
          ]}
          callback={(value: number) => {
            setDuration(value);
          }}
        ></MyNumberInput>
      </VStack>

      <LoanOfferView
        loanParams={loanParams}
        account={props.account}
        callback={props.callback}
      ></LoanOfferView>
    </VStack>
  );
}

export interface MakeOfferInputProps {
  account: Address;
  balanceData: TokenAmount;
  callback: () => any;
}

export function MakeOfferInputs(props: MakeOfferInputProps) {
  const [offerMaxAmount, setOfferMaxAmount] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const [offerMinAmount, setOfferMinAmount] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const [expirationDateMilliseconds, setExpirationDate] = useState<number>(0);
  const [interestRatePCT, setInterestRatePCT] = useState<number>(0);
  const [maxDurationDays, setMaxDuration] = useState<number>(0);
  const [minDurationDays, setMinDuration] = useState<number>(0);
  const [offerId, setOfferId] = useState<number>(); //todo figure out what offer id to use
  const [isLoadingOfferId, setIsLoadingOfferId] = useState<boolean>(false);
  const provider = useProvider();

  const [offer, setOffer] = useState<[LoanOfferType, string]>();

  const getOfferId = async () => {
    if (!isLoadingOfferId) {
      setIsLoadingOfferId(true);
      const offerId = await getUnusedOfferId(provider, props.account);
      setOfferId(offerId);
    }
  };

  useEffect(() => {
    if (offerId == undefined) {
      getOfferId();
    }
    if (canConfirm()) {
      updateOffer();
    }
  }, [
    offerMaxAmount,
    offerMinAmount,
    expirationDateMilliseconds,
    interestRatePCT,
    maxDurationDays,
    minDurationDays,
    offerId,
  ]);

  //todo get offer message to sign synchronously instead (compute hash on front-end)
  const updateOffer = async () => {
    setOffer(undefined); //does this work?
    const offer = makeOffer();
    const message = await getOfferMessageToSign(provider, offer);
    console.log("offer: " + offer);
    console.log("message: " + message);
    setOffer([offer, message]);
  };

  const { data: allowance, refetch: allowanceRefetch } = useContractRead({
    address: props.balanceData.token.address as Address,
    abi: erc20ABI,
    functionName: "allowance",
    args: [props.account, getSupplyAddress(provider)],
  });

  const hasEnoughAllowance = (
    allowance: BigNumber | undefined,
    amountToDeposit: BigNumber
  ) => {
    return allowance && allowance.gte(amountToDeposit);
  };

  const canConfirm = () => {
    return (
      offerId != undefined &&
      BigNumber.from(0).lt(offerMaxAmount) &&
      offerMaxAmount.lte(props.balanceData.amount)
    );
  };

  const sendOffer = async (offer: LoanOfferType, signature: string) => {
    await submitOffer(offer, signature);
    props.callback();
  };

  function makeOffer(): LoanOfferType {
    return {
      owner: props.account as string,
      token: props.balanceData.token.address as string,
      offerId: offerId!,
      nonce: 0,
      minLoanAmount: offerMinAmount,
      amount: offerMaxAmount,
      interestRateBPS: Math.floor(interestRatePCT * 100), //make sure precision = 2
      expiration: Math.floor(expirationDateMilliseconds / 1000), // expiration date stored in seconds
      minLoanDuration: minDurationDays * 60 * 60 * 24,
      maxLoanDuration: maxDurationDays * 60 * 60 * 24,
    };
  }

  return (
    <VStack w="65%" spacing={0} layerStyle={"level3"} padding={3}>
      <TokenAmountInput
        token={props.balanceData.token}
        balance={props.balanceData.amount}
        callback={(amount: BigNumber) => {
          setOfferMaxAmount(amount);
        }}
      />
      <MyNumberInput
        name="Interest rate (%)"
        precision={2}
        callback={(rate: number) => {
          setInterestRatePCT(rate);
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
        {hasEnoughAllowance(allowance, offerMaxAmount) ? (
          <SignButton
            message={offer?.[1]!}
            callbackData={offer?.[0]}
            callback={(message, signature, account, data: LoanOfferType) => {
              console.log("signed message " + message);
              if (account != props.account) {
                throw new Error("signed with different account");
              }
              sendOffer(data, signature);
            }}
            enabled={canConfirm()}
          ></SignButton>
        ) : (
          <ContractCallButton
            contractAddress={props.balanceData.token.address as Address}
            abi={erc20ABI}
            functionName={"approve"}
            args={[getSupplyAddress(provider), ethers.constants.MaxUint256]}
            enabled={canConfirm()}
            callback={() => allowanceRefetch()}
            buttonText="Approve"
          />
        )}
      </Flex>
    </VStack>
  );
}

interface LoanOfferViewProps {
  account: Address;
  loanParams: LoanParameters | undefined;
  callback?: () => void;
}

export function LoanOfferView(props: LoanOfferViewProps) {
  const [healthFactor, setHealthFactor] = useState<number>();
  const [newHealthFactor, setNewHealthFactor] = useState<number>();

  const updateHealthFactor = async () => {
    const healthFactor = await getHealthFactor(provider, props.account);
    setHealthFactor(healthFactor);
  };

  const updateNewHealthFactor = async (offer: [FullOfferInfo, BigNumber]) => {
    const healthFactor = await getNewHealthFactor(
      provider,
      props.account,
      offer[0].token.address as Address,
      undefined,
      undefined,
      offer[1]
    );
    setNewHealthFactor(healthFactor);
  };

  useEffect(() => {
    if (healthFactor == undefined) {
      updateHealthFactor();
    }
  });

  const provider = useProvider();

  function isValidLoanParams() {
    return props.loanParams !== undefined && props.loanParams.amount.gt(0);
  }

  if (isValidLoanParams()) {
    return (
      <DataLoader
        key={props.loanParams?.amount + props.loanParams!.token.address}
        fetcher={() => getOffersForLoanParams(provider, props.loanParams!)}
        makeChildren={(childProps) => {
          updateNewHealthFactor(childProps.data[0]);
          return (
            <VStack w="100%" paddingLeft={3} paddingRight={3}>
              <SimpleRow
                name={"Borrow APY Rate"}
                value={childProps.data[0][0].offer.interestRateBPS / 100 + " %"}
              ></SimpleRow>

              <SimpleRow
                name={"Min Loan Duration"}
                value={
                  childProps.data[0][0].offer.minLoanDuration / (60 * 60 * 24) +
                  " days"
                }
              ></SimpleRow>

              <SimpleRow
                name={"Max Loan Duration"}
                value={
                  childProps.data[0][0].offer.maxLoanDuration / (60 * 60 * 24) +
                  " days"
                }
              ></SimpleRow>

              <HealthFactor
                healthFactor={healthFactor}
                newHealthFactor={newHealthFactor}
              />

              <Flex w="100%">
                <Spacer></Spacer>
                <ContractCallButton
                  contractAddress={getTroveManagerAddress(provider)}
                  abi={getTroveManagerABI()}
                  functionName={"openLoan"}
                  args={[
                    childProps.data[0][0].offer,
                    childProps.data[0][0].signature,
                    childProps.data[0][1],
                    props.loanParams!.duration,
                  ]}
                  enabled={true}
                  callback={() => {
                    eventEmitter.dispatch({
                      eventType: EventType.LOAN_CREATED,
                    });
                    if (props.callback != undefined) {
                      props.callback();
                    }
                  }}
                ></ContractCallButton>
              </Flex>
            </VStack>
          );
        }}
      ></DataLoader>
    );
  } else {
    return <></>;
  }
}
