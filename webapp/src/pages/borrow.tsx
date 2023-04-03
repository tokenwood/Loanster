import { VStack, Heading, Box } from "@chakra-ui/layout";
import { Address, useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader from "components/DataLoaders";
import {
  FullLoanInfo,
  getBorrowerLoanIds,
  getCollateralDeposits,
  getCollateralTokens,
  getFullLoanInfo,
  getSupplyTokens,
  getTokenBalance,
  getTroveManagerAddress,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import { Provider } from "@wagmi/core";
import {
  BorrowInputs,
  CollateralDepositInputs,
  RepayLoanInputs,
} from "components/InputViews";
import { LoanView, TokenBalanceView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { BigNumber } from "ethers";

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
            {"Your Account"}
          </Heading>
          <Box>
            todo: health factor, total collateral, total loans, net worth{" "}
          </Box>
        </Box>
        <Box>
          <Heading as="h6" layerStyle={"onbg"} size="sm" mb="3">
            {"Collateral Deposits"}
          </Heading>
          <ListLoader
            fetchData={() => getCollateralDeposits(provider, account!)}
            makeListItem={(listItemProps) => {
              return (
                <BaseView
                  level={2}
                  key={"collateral_deposit_" + listItemProps.id.toString()}
                  fetcher={() => Promise.resolve(listItemProps.id)}
                  dataView={(data) => {
                    return (
                      <TokenBalanceView
                        amount={data.amount}
                        token={data.token}
                      />
                    );
                  }}
                  actions={[
                    {
                      action: "Withdraw",
                      onClickView: (
                        data: FullLoanInfo,
                        actionFinished: () => any
                      ) => {
                        return <Box> todo </Box>;
                      },
                    },
                  ]}
                ></BaseView>
              );
            }}
          ></ListLoader>
        </Box>
        <Box>
          <Heading as="h6" layerStyle={"onbg"} size="sm" mb="3">
            {"Your Loans"}
          </Heading>
          <ListLoader
            fetchData={() => getBorrowerLoanIds(provider, account!)}
            makeListItem={(listItemProps) => {
              return (
                <BaseView
                  level={2}
                  key={"loan_" + listItemProps.id.toString()}
                  fetcher={() => getFullLoanInfo(provider, listItemProps.id)}
                  dataView={(data) => {
                    return <LoanView data={data} />;
                  }}
                  actions={[
                    {
                      action: "Repay",
                      onClickView: (
                        data: FullLoanInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <RepayLoanInputs
                            account={account!}
                            loanInfo={data}
                            callback={() => {
                              actionFinished();
                            }}
                          />
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
          <Heading as="h6" layerStyle={"onbg"} size="sm" mb="3">
            {"Assets To Borrow"}
          </Heading>
          <ListLoader
            fetchData={() => getSupplyTokens(provider)}
            makeListItem={(listItemProps) => {
              return (
                <BaseView
                  level={2}
                  key={"asset_to_borrow" + listItemProps.id.address}
                  fetcher={() => Promise.resolve(listItemProps.id)} //todo get token info from server
                  dataView={(data) => {
                    return (
                      <TokenBalanceView
                        amount={BigNumber.from(0)}
                        token={data}
                      />
                    );
                  }}
                  actions={[
                    {
                      action: "Borrow",
                      onClickView: (data, actionFinished: () => any) => {
                        return (
                          <BorrowInputs
                            account={account!}
                            callback={(params) => {
                              // setLoanParams(params);
                            }}
                            token={listItemProps.id}
                          ></BorrowInputs>
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
          <Heading as="h6" size="sm" mb="3" layerStyle={"onbg"}>
            {"Collateral Assets"}
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
