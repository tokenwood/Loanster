import { VStack, Heading, Box, Text } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, { MakeListItemProps } from "components/DataLoaders";
import { MakeOfferInputs } from "components/InputViews";
import { ColSpecs, TableHeaderView, TableRowView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { FullOfferInfo, getOffersFrom, offerRevoked } from "libs/backend";
import { Flex, HStack, Spacer } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { ReactNode } from "react";
import { formatDate, isValidOffer } from "libs/helperFunctions";
import { getSupplyAddress, getSupplyABI } from "libs/constants";
import {
  getLenderLoanIds,
  getFullLoanInfo,
  getSupplyTokenAddresses,
  getTokenBalance,
} from "libs/fetchers";
import { FullLoanInfo, TokenBalanceInfo } from "libs/types";
import { getOfferKey } from "libs/sharedUtils";
import OfferInfo, { Check } from "components/OfferInfo";

const offerTableColdims: { [key: string]: ColSpecs } = {
  Asset: { size: 0.5, align: "left" },
  Borrowed: { size: 1.2, align: "right" },
  APY: { size: 0.6, align: "right" },
  "Min Loan Amount": { size: 1, align: "center" },
  "Min/Max Duration": { size: 1, align: "center" },
  Expiration: { size: 1, align: "right" },
  Status: { size: 0.5, align: "center" },
};
const lentTableColdims: { [key: string]: ColSpecs } = {
  Asset: { size: 1, align: "left" },
  Debt: { size: 1, align: "left" },
  Claimable: { size: 1, align: "left" },
  APY: { size: 1, align: "left" },
  Term: { size: 1, align: "left" },
};

const toSupplyColDims: { [key: string]: ColSpecs } = {
  Asset: { size: 1, align: "left" },
  "In Wallet": { size: 1, align: "left" },
  // " ": 1,
};

export default function SupplyPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  const provider = useProvider();
  return (
    <BasePage
      account={account}
      isConnecting={isConnecting}
      isDisconnected={isDisconnected}
    >
      <VStack align="left" spacing="4">
        <Box>
          <Heading as="h6" size="sm" mb="3">
            {"Lending Offers"}
          </Heading>
          <ListLoader
            fetchData={() => getOffersFrom(provider, account!)}
            placeholderText={"Your offers will appear here"}
            makeHeader={() => (
              <TableHeaderView colSpecs={offerTableColdims}></TableHeaderView>
            )}
            reloadEvents={[
              { eventType: EventType.SUPPLY_OFFER_CREATED },
              { eventType: EventType.SUPPLY_OFFER_CANCELLED },
            ]}
            makeListItem={(props) => {
              return (
                <BaseView
                  fetcher={() => Promise.resolve(props.id)}
                  level={2}
                  key={getOfferKey(
                    props.id.offer.owner,
                    props.id.offer.token,
                    props.id.offer.offerId
                  )}
                  dataView={(data: FullOfferInfo, setExpanded) => {
                    return (
                      <TableRowView
                        expandedCallback={setExpanded}
                        colSpecs={offerTableColdims}
                        colData={{
                          Asset: data.token,
                          Borrowed:
                            ethers.utils.formatUnits(
                              data.amountBorrowed,
                              data.token.decimals
                            ) +
                            " / " +
                            ethers.utils.formatUnits(
                              data.offer.amount,
                              data.token.decimals
                            ),
                          APY: data.offer.interestRateBPS / 100 + " %",
                          "Min Loan Amount": ethers.utils.formatUnits(
                            data.offer.minLoanAmount,
                            data.token.decimals
                          ),
                          "Min/Max Duration":
                            data.offer.minLoanDuration / 3600 / 24 +
                            "d / " +
                            data.offer.maxLoanDuration / 3600 / 24 +
                            "d",
                          Expiration: formatDate(data.offer.expiration),
                          Status: () => (
                            <Check checked={isValidOffer(data)}></Check>
                          ),
                        }}
                      />
                    );
                  }}
                  actions={[
                    {
                      action: "Info",
                      onClickView: (
                        data: FullOfferInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <OfferInfo
                            fullOfferInfo={data}
                            callback={() => {}}
                          ></OfferInfo>
                        );
                      },
                    },
                    {
                      action: "Revoke",
                      onClickView: (
                        data: FullOfferInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <HStack alignItems={"left"} w="100%" paddingX={"4"}>
                            <Text alignSelf={"center"}>Revoke Offer</Text>
                            <ContractCallButton
                              contractAddress={getSupplyAddress()}
                              abi={getSupplyABI()}
                              functionName={"setOfferNonce"}
                              args={[data.offer.offerId, data.offer.token, 1]}
                              enabled={true}
                              callback={() => {
                                actionFinished();
                                offerRevoked(data);
                                eventEmitter.dispatch({
                                  eventType: EventType.SUPPLY_OFFER_CANCELLED,
                                });
                              }}
                            ></ContractCallButton>
                          </HStack>
                        );
                      },
                    },
                  ]}
                ></BaseView>
              );
            }}
          ></ListLoader>
        </Box>

        <Box>
          <Heading as="h6" size="sm" mb="3">
            {"Lent Assets"}
          </Heading>
          <ListLoader
            fetchData={() => getLenderLoanIds(provider, account!)}
            makeHeader={() => (
              <TableHeaderView colSpecs={lentTableColdims}></TableHeaderView>
            )}
            makeListItem={(props) => {
              return (
                <BaseView
                  level={2}
                  key={props.id}
                  fetcher={() => getFullLoanInfo(provider, props.id)}
                  dataView={(data, setExpanded) => {
                    return (
                      <TableRowView
                        expandedCallback={setExpanded}
                        colSpecs={lentTableColdims}
                        colData={{
                          Asset: data.token,
                          Debt: ethers.utils.formatUnits(
                            data.loan.amount.add(data.interest),
                            data.token.decimals
                          ),
                          APY: data.loan.interestRateBPS / 100 + " %",
                          Claimable: ethers.utils.formatUnits(
                            data.claimable,
                            data.token.decimals
                          ),
                          Term: formatDate(data.loan.expiration),
                        }}
                      />
                    );
                  }}
                  actions={[
                    {
                      action: "Claim",
                      onClickView: (
                        data: FullLoanInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <Flex w="100%">
                            <Spacer></Spacer>
                            <ContractCallButton
                              contractAddress={getSupplyAddress()}
                              abi={getSupplyABI()}
                              functionName={"withdraw"}
                              args={[data.loanId]}
                              enabled={data.claimable.gt(BigNumber.from(0))}
                              callback={() => {
                                actionFinished();
                                eventEmitter.dispatch({
                                  eventType: EventType.LOAN_CLAIMED,
                                  suffix: data.token.address,
                                });
                              }}
                            ></ContractCallButton>
                          </Flex>
                        );
                      },
                    },
                  ]}
                ></BaseView>
              );
            }}
          ></ListLoader>
        </Box>

        <Box>
          <Heading as="h6" size="sm" mb="3">
            {"Assets to supply"}
          </Heading>
          <ListLoader
            fetchData={() => getSupplyTokenAddresses(provider)}
            makeHeader={() => (
              <TableHeaderView colSpecs={toSupplyColDims}></TableHeaderView>
            )}
            makeListItem={(props) => {
              return (
                <BaseView
                  key={"wallet_supply_token_ballance_" + props.id}
                  level={2}
                  fetcher={() => getTokenBalance(provider, props.id, account!)}
                  reloadEvents={[
                    {
                      eventType: EventType.LOAN_CLAIMED,
                      suffix: props.id,
                    },
                  ]}
                  dataView={(data: TokenBalanceInfo, setExpanded) => {
                    return (
                      <TableRowView
                        expandedCallback={setExpanded}
                        colSpecs={toSupplyColDims}
                        colData={{
                          Asset: data.token,
                          "In Wallet": parseFloat(
                            ethers.utils.formatUnits(
                              data.amount,
                              data.token.decimals
                            )
                          ).toFixed(2),
                        }}
                      />
                    );
                  }}
                  actions={[
                    {
                      action: "Make Offer",
                      onClickView: (
                        data: TokenBalanceInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <MakeOfferInputs
                            account={account!}
                            balanceData={data}
                            callback={() => {
                              actionFinished();
                              eventEmitter.dispatch({
                                eventType: EventType.SUPPLY_OFFER_CREATED,
                              });
                            }}
                          />
                        );
                      },
                    },
                  ]}
                />
              );
            }}
          />
        </Box>
      </VStack>
    </BasePage>
  );
}
