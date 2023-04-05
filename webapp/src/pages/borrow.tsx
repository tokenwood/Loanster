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
  formatDate,
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
  TokenDepositInfo,
} from "libs/unilend_utils";
import { Provider } from "@wagmi/core";
import {
  BorrowInputs,
  CollateralDepositInputs,
  RepayLoanInputs,
} from "components/InputViews";
import { TableHeaderView, TableRowView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { BigNumber, ethers } from "ethers";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/react";
import { statFontSize } from "components/Theme";

const depositTableColdims = { Asset: 1, "In Wallet": 1, Deposited: 1, " ": 1 };
const borrowedTableColdims = { Asset: 1, Debt: 1, APY: 1, Term: 1 };
const toBorrowTableColdims = {
  Asset: 1,
  "Lowest APY": 1,
  Available: 1,
  " ": 1,
};

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
            {"Account"}
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
                  dataView={(data, toggleExpand) => {
                    return (
                      <TableRowView
                        colDims={depositTableColdims}
                        colData={{
                          Asset: data.token.symbol!,
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
                        data: TokenDepositInfo,
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
            {"Borrowed Assets"}
          </Heading>
          <ListLoader
            fetchData={() => getBorrowerLoanIds(provider, account!)}
            makeHeader={() => (
              <TableHeaderView colDims={borrowedTableColdims}></TableHeaderView>
            )}
            makeListItem={(listItemProps) => {
              return (
                <BaseView
                  level={2}
                  key={"loan_" + listItemProps.id.toString()}
                  fetcher={() => getFullLoanInfo(provider, listItemProps.id)}
                  dataView={(data) => {
                    return (
                      <TableRowView
                        colDims={borrowedTableColdims}
                        colData={{
                          Asset: data.token.symbol!,
                          Debt: ethers.utils.formatUnits(
                            data.loan.amount.add(data.interest),
                            data.token.decimals
                          ),
                          APY:
                            (data.loan.interestRateBPS / 100).toFixed(2) + " %",
                          Term: formatDate(data.loan.expiration),
                        }}
                      />
                    );
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
            makeHeader={() => (
              <TableHeaderView colDims={toBorrowTableColdims}></TableHeaderView>
            )}
            makeListItem={(listItemProps) => {
              return (
                <BaseView
                  level={2}
                  key={"asset_to_borrow" + listItemProps.id.address}
                  fetcher={() => Promise.resolve(listItemProps.id)} //todo get token info from server
                  dataView={(data) => {
                    return (
                      <TableRowView
                        colDims={toBorrowTableColdims}
                        colData={{
                          Asset: data.symbol!,
                          "Lowest APY": "todo",
                          Available: "todo",
                        }}
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
