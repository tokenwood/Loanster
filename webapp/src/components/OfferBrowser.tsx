import {
  Tr,
  Th,
  Button,
  Box,
  useDisclosure,
  PopoverTrigger,
  PopoverContent,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { Token } from "@uniswap/sdk-core";
import { BigNumber, ethers } from "ethers";
import { FullOfferInfo, getSortedOffers } from "libs/backend";
import { floatToBigNumber, formatDate } from "libs/helperFunctions";
import { Address, useProvider } from "wagmi";
import { TableLoader } from "./DataLoaders";
import { Popover } from "@chakra-ui/react";
import {
  actionInitColorScheme,
  defaultBorderRadius,
  DEFAULT_SIZE,
} from "./Theme";
import { useEffect, useRef, useState } from "react";
import { getTroveManagerAddress, getTroveManagerABI } from "libs/constants";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { ContractCallButton } from "./BaseComponents";
import { LoanOfferType } from "libs/types";
import { getHealthFactor, getNewHealthFactor } from "libs/dataLoaders";
import { HealthFactor } from "./InputViews";
import { MyNumberInput } from "./InputFields";
import { SimpleRow } from "./DataViews";

interface OfferBrowserProps {
  token: Token;
  account: Address;
}

export default function OfferBrowser(props: OfferBrowserProps) {
  const provider = useProvider();

  return (
    <TableLoader
      fetchData={() =>
        getSortedOffers(provider, props.token.address as Address)
      }
      reloadEvents={[]}
      makeTableHead={() => {
        return (
          <Tr>
            <Th isNumeric>available</Th>
            <Th isNumeric>APY</Th>
            <Th isNumeric>min duration</Th>
            <Th isNumeric>max duration</Th>
            <Th>expiration</Th>
            <Th></Th>
          </Tr>
        );
      }}
      makeTableRow={(rowProps) => {
        return (
          // TODO set id as key
          <Tr key={Math.random()}>
            <Th isNumeric>
              {ethers.utils.formatUnits(
                0, // getAmountAvailableForDepositInfo(props.id),
                rowProps.id.token.decimals
              ) +
                " " +
                props.token.symbol}
            </Th>
            <Th isNumeric>{rowProps.id.offer.interestRateBPS / 100 + " %"}</Th>
            <Th isNumeric>
              {rowProps.id.offer.minLoanDuration / (24 * 60 * 60) + " days"}
            </Th>
            <Th isNumeric>
              {rowProps.id.offer.maxLoanDuration / (24 * 60 * 60) + " days"}
            </Th>
            <Th>{formatDate(rowProps.id.offer.expiration)}</Th>
            <Th>
              <BorrowModal
                token={props.token}
                offer={rowProps.id.offer}
                signature={rowProps.id.signature}
                account={props.account}
              ></BorrowModal>
            </Th>
          </Tr>
        );
      }}
    ></TableLoader>
  );
}

interface BorrowModalProps {
  token: Token;
  offer: LoanOfferType;
  signature: string;
  account: Address;
}

const BorrowModal = (props: BorrowModalProps) => {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const provider = useProvider();
  const [amountToBorrow, setAmountToBorrow] = useState<BigNumber>();
  const [healthFactor, setHealthFactor] = useState<number>();
  const [newHealthFactor, setNewHealthFactor] = useState<number>();

  const updateHealthFactor = async () => {
    const healthFactor = await getHealthFactor(provider, props.account);
    setHealthFactor(healthFactor);
  };

  const updateNewHealthFactor = async (amount: BigNumber) => {
    const healthFactor = await getNewHealthFactor(
      provider,
      props.account,
      props.token.address as Address,
      undefined,
      undefined,
      amount
    );
    setNewHealthFactor(healthFactor);
  };

  useEffect(() => {
    if (healthFactor == undefined && isOpen) {
      updateHealthFactor();
    }
  }, [isOpen]);

  useEffect(() => {
    if (amountToBorrow != undefined) {
      updateNewHealthFactor(amountToBorrow);
    }
  }, [amountToBorrow]);

  return (
    <Box>
      <Button
        colorScheme={actionInitColorScheme}
        borderRadius={defaultBorderRadius}
        size={DEFAULT_SIZE}
        alignSelf="center"
        onClick={onOpen}
      >
        Borrow
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Borrow {props.token.symbol}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box padding="3">
              <SimpleRow
                name={"Borrow APY Rate"}
                value={props.offer.interestRateBPS / 100 + " %"}
              ></SimpleRow>

              <SimpleRow
                name={"Min Loan Duration"}
                value={props.offer.minLoanDuration / (60 * 60 * 24) + " days"}
              ></SimpleRow>

              <SimpleRow
                name={"Max Loan Duration"}
                value={props.offer.maxLoanDuration / (60 * 60 * 24) + " days"}
              ></SimpleRow>
            </Box>
            <Box layerStyle={"level3"} paddingX="3" paddingY="1">
              <MyNumberInput
                name="Amount"
                // precision={0}
                placeHolder="0"
                callback={(value: number) => {
                  console.log("value:" + value);
                  setAmountToBorrow(
                    floatToBigNumber(value.toString(), props.token.decimals)
                  );
                }}
              ></MyNumberInput>
            </Box>

            <Box padding="3">
              <HealthFactor
                healthFactor={healthFactor}
                newHealthFactor={newHealthFactor}
              />
            </Box>
          </ModalBody>

          <ModalFooter>
            <ContractCallButton
              contractAddress={getTroveManagerAddress()}
              abi={getTroveManagerABI()}
              functionName={"openLoan"}
              args={[
                props.offer,
                props.signature,
                amountToBorrow,
                props.offer.maxLoanDuration,
              ]}
              enabled={amountToBorrow != undefined}
              callback={() => {
                eventEmitter.dispatch({
                  eventType: EventType.LOAN_CREATED,
                });
                onClose();
                // if (props.callback != undefined) {
                //   props.callback();
                // }
              }}
            ></ContractCallButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
