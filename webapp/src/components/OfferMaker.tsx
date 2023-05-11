import {
  useDisclosure,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
  Flex,
  Spacer,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import {
  getTroveManagerAddress,
  getTroveManagerABI,
  getSupplyAddress,
} from "libs/chainUtils";
import { eventEmitter, EventType } from "libs/eventEmitter";
import {
  getHealthFactor,
  getOfferMessageToSign,
  getUnusedOfferId,
} from "libs/fetchers";
import { floatToBigNumber } from "libs/helperFunctions";
import { useState, useEffect } from "react";
import { Token } from "@uniswap/sdk-core";
import {
  Address,
  erc20ABI,
  useAccount,
  useContractRead,
  useProvider,
} from "wagmi";
import { BaseButton, ContractCallButton, SignButton } from "./BaseComponents";
import { SimpleRow } from "./DataViews";
import { DateInput, MyNumberInput, TokenAmountInput } from "./InputFields";
import { HealthFactor } from "./InputViews";
import {
  actionInitColorScheme,
  defaultBorderRadius,
  DEFAULT_SIZE,
} from "./Theme";
import { LoanOfferType, TokenAmount } from "libs/types";
import { submitOffer } from "libs/backend";

interface OfferModalProps {
  balanceData: TokenAmount;
  account?: Address;
}

export const OfferModal = (props: OfferModalProps) => {
  const { onOpen, onClose, isOpen } = useDisclosure();
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
    if (!isLoadingOfferId && props.account) {
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
    setOffer([offer, message]);
  };

  const { data: allowance, refetch: allowanceRefetch } = useContractRead({
    address: props.balanceData.token.address as Address,
    abi: erc20ABI,
    functionName: "allowance",
    enabled: props.account != undefined,
    args: [props.account!, getSupplyAddress(provider)],
  });

  const hasApproved = (
    allowance: BigNumber | undefined,
    amountToDeposit: BigNumber
  ) => {
    return allowance && allowance.gte(amountToDeposit) && allowance.gt(0);
  };

  const canConfirm = () => {
    return (
      offerId != undefined &&
      props.account &&
      props.balanceData.amount &&
      BigNumber.from(0).lt(offerMaxAmount) &&
      offerMaxAmount.lte(props.balanceData.amount) &&
      maxDurationDays > 0 &&
      hasApproved(allowance, offerMaxAmount)
    );
  };

  const sendOffer = async (offer: LoanOfferType, signature: string) => {
    await submitOffer(offer, signature, provider.network.chainId);
    onClose();
    eventEmitter.dispatch({
      eventType: EventType.SUPPLY_OFFER_CREATED,
    });
  };

  function makeOffer(): LoanOfferType {
    return {
      owner: props.account as string,
      token: props.balanceData.token.address as string,
      offerId: offerId!,
      nonce: 0,
      minLoanAmount: offerMinAmount,
      amount: offerMaxAmount,
      interestRateBPS: Math.round(interestRatePCT * 100), //make sure precision = 2
      expiration: Math.round(expirationDateMilliseconds / 1000), // expiration date stored in seconds
      minLoanDuration: minDurationDays * 60 * 60 * 24,
      maxLoanDuration: maxDurationDays * 60 * 60 * 24,
    };
  }

  return (
    <Box>
      <Button
        colorScheme={actionInitColorScheme}
        borderRadius={defaultBorderRadius}
        size={DEFAULT_SIZE}
        alignSelf="center"
        onClick={onOpen}
        isDisabled={props.account == undefined}
      >
        Make Offer
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Make {props.balanceData.token.symbol} Loan Offer
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack w="100%" spacing={0} layerStyle={"level3"} padding={3}>
              <TokenAmountInput
                token={props.balanceData.token}
                explainerText="Maximum amount of tokens to lend in one or multiple loans"
                balance={props.balanceData.amount}
                callback={(amount: BigNumber) => {
                  setOfferMaxAmount(amount);
                }}
              />
              <MyNumberInput
                name="Interest rate (%)"
                precision={2}
                explainerText="Yearly interest rate"
                callback={(rate: number) => {
                  setInterestRatePCT(rate);
                }}
              ></MyNumberInput>
              <MyNumberInput
                name="Max duration (days)"
                explainerText="Maximum loan duration in days"
                precision={0}
                placeHolder="0"
                callback={(value: number) => {
                  setMaxDuration(value);
                }}
              ></MyNumberInput>
              <MyNumberInput
                name="Min duration (days)"
                explainerText="Mininum loan duration in days"
                precision={0}
                placeHolder="0"
                callback={(value: number) => {
                  setMinDuration(value);
                }}
              ></MyNumberInput>
              <DateInput
                name="Expiration"
                explainerText="Offer expiration date. No new loans can be opened after this date"
                callback={(timestamp: number) => {
                  setExpirationDate(timestamp);
                }}
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack w="100%">
              <ContractCallButton
                contractAddress={props.balanceData.token.address as Address}
                abi={erc20ABI}
                functionName={"approve"}
                args={[getSupplyAddress(provider), ethers.constants.MaxUint256]}
                enabled={true}
                done={hasApproved(allowance, offerMaxAmount)}
                callback={() => allowanceRefetch()}
                buttonText={
                  hasApproved(allowance, offerMaxAmount)
                    ? "Approved"
                    : "Approve"
                }
                w="50%"
              />

              <SignButton
                w="50%"
                message={offer?.[1]!}
                callbackData={offer?.[0]}
                callback={(
                  message,
                  signature,
                  account,
                  data: LoanOfferType
                ) => {
                  console.log("signed message " + message);
                  if (account != props.account) {
                    throw new Error("signed with different account");
                  }
                  sendOffer(data, signature);
                }}
                enabled={canConfirm()} //todo max days > 0
              ></SignButton>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
