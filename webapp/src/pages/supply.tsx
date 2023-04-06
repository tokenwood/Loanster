import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, { MakeListItemProps } from "components/DataLoaders";
import {
  formatDate,
  FullLoanInfo,
  getFullLoanInfo,
  getLenderLoanIds,
  getSupplyABI,
  getSupplyAddress,
  getSupplyTokenAddresses,
  getTokenBalance,
  getTroveManagerABI,
  getTroveManagerAddress,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import { MakeOfferInputs } from "components/InputViews";
import { TableHeaderView, TableRowView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import {
  FullOfferInfo,
  getOfferKey,
  getOffersFrom,
  offerRevoked,
} from "libs/backend";
import { Flex, Spacer } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { ReactNode } from "react";

const offerTableColdims = {
  Asset: 1,
  Borrowed: 1,
  APY: 1,
  "Min Loan Amount": 1,
  "Min/Max Duration": 1,
  Expiration: 1,
};
const lentTableColdims = {
  Asset: 1,
  Debt: 1,
  Claimable: 1,
  APY: 1,
  Term: 1,
};

const toSupplyColDims = {
  Asset: 1,
  "In Wallet": 1,
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
            {"Your Offers"}
          </Heading>
          <ListLoader
            fetchData={() => getOffersFrom(provider, account!)}
            makeHeader={() => (
              <TableHeaderView colDims={offerTableColdims}></TableHeaderView>
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
                  key={getOfferKey(props.id.offer)}
                  dataView={(data: FullOfferInfo) => {
                    return (
                      <TableRowView
                        colDims={offerTableColdims}
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
                        }}
                      />
                    );
                  }}
                  actions={[
                    {
                      action: "Revoke",
                      onClickView: (
                        data: FullOfferInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <Flex w="100%">
                            <Spacer></Spacer>
                            <ContractCallButton
                              contractAddress={getSupplyAddress()}
                              abi={getSupplyABI()}
                              functionName={"setOfferNonce"}
                              args={[data.offer.offerId, 1]}
                              enabled={true}
                              callback={() => {
                                actionFinished();
                                offerRevoked(data);
                                eventEmitter.dispatch({
                                  eventType: EventType.SUPPLY_OFFER_CANCELLED,
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
            {"Lent Assets"}
          </Heading>
          <ListLoader
            fetchData={() => getLenderLoanIds(provider, account!)}
            makeHeader={() => (
              <TableHeaderView colDims={lentTableColdims}></TableHeaderView>
            )}
            makeListItem={(props) => {
              return (
                <BaseView
                  level={2}
                  key={props.id}
                  fetcher={() => getFullLoanInfo(provider, props.id)}
                  dataView={(data) => {
                    return (
                      <TableRowView
                        colDims={lentTableColdims}
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
              <TableHeaderView colDims={toSupplyColDims}></TableHeaderView>
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
                  dataView={(data: TokenBalanceInfo) => {
                    return (
                      <TableRowView
                        colDims={toSupplyColDims}
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
                            approvalAddress={getSupplyAddress()}
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
