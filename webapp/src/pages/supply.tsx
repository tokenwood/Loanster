import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader from "components/DataLoaders";
import {
  DepositInfo,
  getDepositInfo,
  getFullDepositInfo,
  getSupplyABI,
  getSupplyAddress,
  getSupplyDepositIds,
  getSupplyTokenAddresses,
  getTokenBalance,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import { BigNumber } from "ethers";
import { SupplyDepositInputs } from "components/DepositInputs";
import { DepositView, TokenBalanceView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { ReactNode } from "react";
import { Flex, Spacer } from "@chakra-ui/react";

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
            {"Your supplies"}
          </Heading>
          <ListLoader
            fetchData={() => getSupplyDepositIds(provider, account!)}
            reloadEvents={[{ eventType: EventType.SUPPLY_TOKEN_DEPOSITED }]}
            makeListItem={(props) => {
              return (
                <BaseView
                  key={"supply_deposit_" + props.id}
                  fetcher={() => getFullDepositInfo(provider, props.id)}
                  level={2}
                  dataView={(data) => <DepositView data={data}></DepositView>}
                  actions={[
                    {
                      action: "Withdraw",
                      onClickView: (
                        data: DepositInfo,
                        actionFinished: () => any
                      ) => (
                        <Flex w="100%">
                          <Spacer></Spacer>
                          <ContractCallButton
                            contractAddress={getSupplyAddress()}
                            abi={getSupplyABI()}
                            functionName={"changeAmountDeposited"}
                            args={[props.id, 0]}
                            enabled={true}
                            callback={() => {
                              eventEmitter.dispatch({
                                eventType: EventType.SUPPLY_TOKEN_WITHDRAWN,
                                suffix: data.token,
                              });
                              props.callback();
                            }}
                          ></ContractCallButton>
                        </Flex>
                      ),
                    },
                  ]}
                ></BaseView>
              );
            }}
          />
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
                      eventType: EventType.SUPPLY_TOKEN_WITHDRAWN,
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
                          <SupplyDepositInputs
                            account={account!}
                            balanceData={data}
                            approvalAddress={getSupplyAddress()}
                            callback={() => {
                              actionFinished();
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
