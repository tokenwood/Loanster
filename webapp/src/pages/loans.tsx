import { VStack, Heading, Box } from "@chakra-ui/layout";
import { Flex, Spacer, StackDivider } from "@chakra-ui/react";
import { Address, erc721ABI, useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import {
  ChildProps,
  DataLoader,
  MakeListItemProps,
} from "components/DataLoaders";
import ListLoader from "components/DataLoaders";
import {
  FullPositionInfo,
  getFullPositionInfo,
  getPositionIds,
} from "libs/uniswap_utils";
import {
  getCollateralTokens,
  getERC721Allowance,
  getTokenBalance,
  getTroveIds,
  getTroveManagerABI,
  getTroveManagerAddress,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import { Provider } from "@wagmi/core";
import { CollateralDepositInputs } from "components/DepositInputs";
import Trove from "components/Trove";
import { PositionView, TokenBalanceView } from "components/DataViews";
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "libs/constants";
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
            fetchIds={() => getTroveIds(provider, account!)}
            reloadEvents={[
              { eventType: EventType.COLLATERAL_TOKEN_DEPOSITED },
              { eventType: EventType.COLLATERAL_POSITION_DEPOSITED },
            ]}
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
            {"Your positions"}
          </Heading>
          <ListLoader
            fetchIds={() => getPositionIds(provider, account!)}
            reloadEvents={[
              {
                eventType: EventType.COLLATERAL_POSITION_WITHDRAWN,
              },
            ]}
            makeListItem={(props) => {
              return (
                <BaseView
                  key={"wallet_position" + props.id}
                  level={2}
                  fetcher={() => getFullPositionInfo(provider, props.id)}
                  dataView={(data: FullPositionInfo) => {
                    return <PositionView fullPositionInfo={data} />;
                  }}
                  actions={[
                    {
                      action: "Deposit",
                      onClickView: () => (
                        <Flex w="100%">
                          <Spacer></Spacer>
                          <DataLoader
                            fetcher={() =>
                              getERC721Allowance(
                                provider,
                                NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
                                props.id
                              )
                            }
                            makeChildren={(childProps) => {
                              return childProps.data !=
                                getTroveManagerAddress() ? (
                                <ContractCallButton
                                  contractAddress={
                                    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
                                  }
                                  abi={erc721ABI}
                                  functionName={"approve"}
                                  args={[getTroveManagerAddress(), props.id]}
                                  callback={() => childProps.refetchData()}
                                  enabled={true}
                                  buttonText="Approve"
                                ></ContractCallButton>
                              ) : (
                                <ContractCallButton
                                  contractAddress={getTroveManagerAddress()}
                                  abi={getTroveManagerABI()}
                                  functionName={"openTrove"}
                                  enabled={true}
                                  args={[
                                    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
                                    props.id,
                                  ]}
                                  callback={() => {
                                    props.callback();
                                    eventEmitter.dispatch({
                                      eventType:
                                        EventType.COLLATERAL_POSITION_DEPOSITED,
                                    });
                                  }}
                                ></ContractCallButton>
                              );
                            }}
                          ></DataLoader>
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
          <Heading as="h6" size="sm" mb="3" layerStyle={"onbg"}>
            {"Your assets"}
          </Heading>
          <ListLoader
            fetchIds={() => getCollateralTokens(provider)}
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
