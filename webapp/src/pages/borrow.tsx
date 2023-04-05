import { VStack, Heading, Box } from "@chakra-ui/layout";
import { Address, useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, { ChildProps, DataLoader } from "components/DataLoaders";
import {
  BNToPrecision,
  FullLoanInfo,
  getBorrowerLoanIds,
  getCollateralDeposits,
  getCollateralTokens,
  getFullLoanInfo,
  getHealthFactor,
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
import {
  LoanView,
  TableHeaderView,
  TableRowView,
  TokenBalanceView,
} from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { BigNumber, ethers } from "ethers";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/react";
import { statFontSize } from "components/Theme";

const depositTableColdims = { Token: 1, "In Wallet": 1, Deposited: 1 };

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
          <DataLoader
            fetcher={() => getHealthFactor(provider, account!)}
            makeChildren={(childProps) => {
              return (
                <Stat textAlign={"left"}>
                  <StatLabel>Health Factor</StatLabel>
                  <StatNumber fontSize={statFontSize}>
                    {childProps.data}
                  </StatNumber>
                </Stat>
              );
            }}
          ></DataLoader>
        </Box>
        <Box>
          <Heading as="h6" layerStyle={"onbg"} size="sm" mb="3">
            {"Collateral Deposits"}
          </Heading>
          <ListLoader
            fetchData={() => getCollateralDeposits(provider, account!)}
            makeHeader={() => (
              <TableHeaderView colDims={depositTableColdims}></TableHeaderView>
            )}
            makeListItem={(listItemProps) => {
              return (
                <BaseView
                  level={2}
                  key={"collateral_deposit_" + listItemProps.id.token.address}
                  fetcher={() => Promise.resolve(listItemProps.id)}
                  dataView={(data) => {
                    return (
                      <TableRowView
                        colDims={depositTableColdims}
                        colData={{
                          Token: data.token.symbol!,
                          "In Wallet": BNToPrecision(
                            data.wallet_amount,
                            data.token.decimals,
                            4
                          ),
                          Deposited: ethers.utils.formatUnits(
                            data.deposit_amount ?? BigNumber.from(0),
                            data.token.decimals
                          ),
                        }}
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
      </VStack>
    </BasePage>
  );
}
