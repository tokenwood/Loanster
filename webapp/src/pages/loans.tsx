import { VStack, Heading, Box } from "@chakra-ui/layout";
import { Address, useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader from "components/DataLoaders";
import {
  getCollateralTokens,
  getTokenBalance,
  getTroveIds,
  getTroveManagerAddress,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import { Provider } from "@wagmi/core";
import { CollateralDepositInputs } from "components/InputViews";
import Trove from "components/Trove";
import { TokenBalanceView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";

export default function LoansPage() {
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
          <Heading as="h6" layerStyle={"onbg"} size="sm" mb="3">
            {"Troves"}
          </Heading>
          <ListLoader
            fetchData={() => getTroveIds(provider, account!)}
            reloadEvents={[{ eventType: EventType.COLLATERAL_TOKEN_DEPOSITED }]}
            makeListItem={(props) => {
              return (
                <Trove
                  account={account!}
                  troveId={props.id}
                  key={props.id}
                  refetchTroves={() => props.callback()}
                />
              );
            }}
          />
        </Box>
        <Box>
          <Heading as="h6" size="sm" mb="3" layerStyle={"onbg"}>
            {"Your collateral assets"}
          </Heading>
          <ListLoader
            fetchData={() => getCollateralTokens(provider)}
            makeListItem={(props) => {
              return (
                <BaseView
                  key={"wallet_collateral_token_balance_" + props.id}
                  level={2}
                  fetcher={() => getTokenBalance(provider, props.id, account!)}
                  reloadEvents={[
                    {
                      eventType: EventType.COLLATERAL_TOKEN_WITHDRAWN,
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
                      action: "Deposit",
                      onClickView: (
                        data: TokenBalanceInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <CollateralDepositInputs
                            account={account!}
                            balanceData={data}
                            approvalAddress={getTroveManagerAddress()}
                            callback={() => {
                              actionFinished();
                              // props.callback();
                              eventEmitter.dispatch({
                                eventType: EventType.COLLATERAL_TOKEN_DEPOSITED,
                              });
                            }}
                          ></CollateralDepositInputs>
                        );
                      },
                    },
                  ]}
                ></BaseView>
              );
            }}
          />
        </Box>
      </VStack>
    </BasePage>
  );
}
