import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import { BasePage, BaseView } from "components/BaseComponents";
import ListLoader from "components/DataLoaders";
import {
  getSupplyAddress,
  getSupplyTokenAddresses,
  getTokenBalance,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import { MakeOfferInputs } from "components/InputViews";
import { OfferView, TokenBalanceView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { FullOfferInfo, getOffersFromOwner } from "libs/backend";

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
            fetchData={() => getOffersFromOwner(account!)}
            reloadEvents={[{ eventType: EventType.SUPPLY_OFFER_CREATED }]}
            makeListItem={(props) => {
              return (
                <BaseView
                  fetcher={() => Promise.resolve(props.id)}
                  level={2}
                  key={props.id.key}
                  dataView={(data: FullOfferInfo) => {
                    return <OfferView data={data}></OfferView>;
                  }}
                  actions={[]}
                ></BaseView>
              );
            }}
          ></ListLoader>
        </Box>

        <Box>
          <Heading as="h6" size="sm" mb="3">
            {"Your Loans"}
          </Heading>
          <Box>todo</Box>
        </Box>

        <Box>
          <Heading as="h6" size="sm" mb="3">
            {"Assets to supply"}
          </Heading>
          <ListLoader
            fetchData={() => getSupplyTokenAddresses(provider)}
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
                      <TokenBalanceView
                        amount={data.amount}
                        token={data.token}
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
                              console.log("dispatching event");
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
