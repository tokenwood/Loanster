import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Select,
  Spacer,
  Text,
  Th,
  Tr,
} from "@chakra-ui/react";
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
  getBorrowerLoanIds,
  LoanParameters,
  LoanOfferType,
  getOfferMessageToSign,
  FullLoanInfo,
  FullAccountInfo,
  getERC20BalanceAndAllowance,
  getUnusedOfferId,
  getLoanStats,
  LoanStats,
} from "libs/unilend_utils";
import { ethers } from "ethers";
import { ContractCallButton, SignButton } from "./BaseComponents";
import { DateInput, MyNumberInput, TokenAmountInput } from "./InputFields";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { ChildProps, DataLoader, TableLoader } from "./DataLoaders";
import { defaultBorderRadius, DEFAULT_SIZE } from "./Theme";
import { getOffers, submitOffer } from "libs/backend";
import { Token } from "@uniswap/sdk-core";
import { ADDRESS_TO_TOKEN } from "libs/constants";

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
            functionName={"deposit"}
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

export interface RepayLoanInputs {
  account: Address;
  loanInfo: FullLoanInfo;
  callback: () => any;
}

export function RepayLoanInputs(props: RepayLoanInputs) {
  const [newPrincipalAmount, setNewPrincipalAmount] = useState<BigNumber>(
    BigNumber.from(0)
  );
  const provider = useProvider();

  const hasEnoughAllowance = (
    allowance: BigNumber | undefined,
    amountToDeposit: BigNumber
  ) => {
    return allowance && allowance.gte(amountToDeposit);
  };

  const canConfirm = (balance: BigNumber) => {
    return (
      BigNumber.from(0).lt(newPrincipalAmount) &&
      newPrincipalAmount.lte(balance)
    );
  };
  const getStats = () => {
    const principalAmount = props.loanInfo.loan.amount.sub(newPrincipalAmount);
    const interestAmount = props.loanInfo.interest;
    // new health factor
  };
  return (
    <DataLoader
      fetcher={() =>
        getERC20BalanceAndAllowance(
          provider,
          props.account,
          getSupplyAddress(),
          props.loanInfo.token.address as Address
        )
      }
      makeChildren={(childProps) => {
        const [balance, allowance] = childProps.data;
        return (
          <VStack w="100%" layerStyle={"level3"} spacing={0} padding="2">
            <MyNumberInput
              name={"New Principal"}
              callback={function (amount: number) {
                setNewPrincipalAmount(
                  floatToBigNumber(
                    amount.toString(),
                    props.loanInfo.token.decimals
                  )
                );
              }}
            ></MyNumberInput>

            <Flex w="100%">
              <Spacer></Spacer>
              {hasEnoughAllowance(allowance, newPrincipalAmount) ? (
                <ContractCallButton
                  contractAddress={getTroveManagerAddress()}
                  abi={getTroveManagerABI()}
                  functionName={"repayLoan"}
                  args={[props.loanInfo.loanId, newPrincipalAmount]}
                  enabled={canConfirm(balance)}
                  callback={() => {
                    props.callback();
                  }}
                ></ContractCallButton>
              ) : (
                <ContractCallButton
                  contractAddress={props.loanInfo.token.address as Address}
                  abi={erc20ABI}
                  functionName={"approve"}
                  args={[getSupplyAddress(), ethers.constants.MaxUint256]}
                  enabled={canConfirm(balance)}
                  callback={childProps.refetchData}
                  buttonText="Approve"
                ></ContractCallButton>
              )}
            </Flex>
          </VStack>
        );
      }}
    ></DataLoader>
  );
}

export function MakeOfferInputs(props: DepositInputsProps) {
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
    const message = await getOfferMessageToSign(provider, makeOffer());
    setOffer([offer, message]);
  };

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
        balanceData={props.balanceData}
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
  token: Token;
  callback: (params: LoanParameters) => any;
}

export function BorrowInputs(props: BorrowInputProps) {
  const [amountToBorrow, setAmountToBorrow] = useState<number>(0);
  const [term, setTerm] = useState<number>();
  const [minDuration, setMinDuration] = useState<number>();
  const [loanParams, setLoanParams] = useState<LoanParameters>();
  const [loanStats, setLoanStats] = useState<LoanStats>();
  const provider = useProvider();

  function isValidLoanParams() {
    return loanParams !== undefined && amountToBorrow > 0;
  }

  useEffect(() => {
    setLoanParams({
      tokenAddress: props.token.address as Address,
      amount: amountToBorrow,
      duration: 0, //todo
    });
  }, [amountToBorrow]);

  return (
    <VStack w="100%" spacing={0} layerStyle={"level2"} padding={3}>
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

      {isValidLoanParams() ? (
        <TableLoader
          key={amountToBorrow + props.token.address} //todo hash loanParms
          fetchData={() => getOffers(provider, loanParams!)}
          dataLoaded={(tableData) => {
            console.log("table data");
            console.log(tableData);
            setLoanStats(getLoanStats(tableData));
          }}
          makeTableHead={() => {
            return (
              <Tr>
                <Th isNumeric>Loan #</Th>
                <Th isNumeric>{props.token.symbol}</Th>
                <Th isNumeric>Rate</Th>
                <Th isNumeric>Min Duration</Th>
              </Tr>
            );
          }}
          makeTableRow={(props) => {
            return (
              <Tr key={props.id[0].offer.owner + props.id[0].offer.offerId}>
                <Th isNumeric>{props.index}</Th>
                <Th isNumeric>
                  {ethers.utils.formatUnits(
                    props.id[1],
                    props.id[0].token.decimals
                  )}
                </Th>
                <Th isNumeric>
                  {props.id[0].offer.interestRateBPS / 100 + " %"}
                </Th>
                <Th isNumeric>{props.id[0].offer.minLoanDuration}</Th>
              </Tr>
            );
          }}
          makeTableFooter={(tableData) => {
            const loanStats = getLoanStats(tableData);

            if (loanStats != undefined) {
              return (
                <Tr borderTopColor={"gray.500"} borderTopWidth={"1.5px"}>
                  <Th isNumeric>{"total"}</Th>
                  <Th isNumeric>
                    {ethers.utils.formatUnits(
                      loanStats.amount,
                      tableData[0][0].token.decimals // what if empty array?
                    )}
                  </Th>
                  <Th isNumeric>{loanStats.rate.toNumber() / 100 + " %"}</Th>
                  <Th isNumeric>todo</Th>
                </Tr>
              );
            } else {
              return <Box> no loans</Box>;
            }
          }}
        ></TableLoader>
      ) : (
        <Box></Box>
      )}
    </VStack>
  );
}
