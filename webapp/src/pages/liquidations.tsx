import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, { MakeListItemProps } from "components/DataLoaders";
import {
  FullLoanInfo,
  getFullLoanInfo,
  getLoanIds,
  getSupplyABI,
  getSupplyAddress,
  getSupplyTokenAddresses,
  getTokenBalance,
  getTroveManagerABI,
  getTroveManagerAddress,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import { MakeOfferInputs } from "components/InputViews";
import { LoanView, OfferView, TokenBalanceView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import {
  FullOfferInfo,
  getOfferKey,
  getOffersFrom,
  offerRevoked,
} from "libs/backend";
import { Flex, Spacer } from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { ReactNode } from "react";

export default function LiquidationsPage() {
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
            {"Loans"}
          </Heading>
          <ListLoader
            fetchData={() => getOffersFrom(provider, account!)}
            reloadEvents={[
              { eventType: EventType.SUPPLY_OFFER_CREATED },
              { eventType: EventType.SUPPLY_OFFER_CANCELLED },
            ]}
            makeListItem={(props) => {
              console.log("list item: " + props);
              return (
                <BaseView
                  fetcher={() => Promise.resolve(props.id)}
                  level={2}
                  key={getOfferKey(props.id.offer)}
                  dataView={(data: FullOfferInfo) => {
                    return <OfferView data={data}></OfferView>;
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
            {"Loans"}
          </Heading>
          <ListLoader
            fetchData={() => getLoanIds(provider, account!)}
            makeListItem={(props) => {
              return (
                <BaseView
                  level={2}
                  key={props.id}
                  fetcher={() => getFullLoanInfo(provider, props.id)}
                  dataView={(data) => {
                    return <LoanView data={data} />;
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
      </VStack>
    </BasePage>
  );
}
