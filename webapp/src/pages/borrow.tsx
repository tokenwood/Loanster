import { VStack, Heading, Box, HStack } from "@chakra-ui/layout";
import { Address, useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, { ChildProps, DataLoader } from "components/DataLoaders";

import { Provider } from "@wagmi/core";
import {
  BorrowInputs,
  CollateralInputs,
  RepayLoanInputs,
} from "components/InputViews";
import {
  LoanInfoView,
  TableHeaderView,
  TableRowView,
} from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { BigNumber, ethers } from "ethers";
import { Stat, StatHelpText, StatLabel, StatNumber } from "@chakra-ui/react";
import { statFontSize } from "components/Theme";
import { getTokenOfferStats } from "libs/backend";
import {
  getHealthFactor,
  getCollateralDeposits,
  getBorrowerLoanIds,
  getFullLoanInfo,
  getSupplyTokens,
} from "libs/dataLoaders";
import {
  BNToPrecision,
  formatDate,
  bigNumberString,
} from "libs/helperFunctions";
import { TokenDepositInfo, FullLoanInfo } from "libs/types";

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
            reloadEvents={[
              { eventType: EventType.COLLATERAL_TOKEN_DEPOSITED },
              { eventType: EventType.COLLATERAL_TOKEN_WITHDRAWN },
            ]}
            makeChildren={(childProps) => {
              return (
                <Stat textAlign={"left"}>
                  <StatLabel>Health Factor</StatLabel>
                  <StatNumber fontSize={statFontSize}>
                    {childProps.data == Number.POSITIVE_INFINITY
                      ? "∞"
                      : childProps.data.toFixed(2)}
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
            reloadEvents={[
              { eventType: EventType.COLLATERAL_TOKEN_DEPOSITED },
              { eventType: EventType.COLLATERAL_TOKEN_WITHDRAWN },
            ]}
            makeListItem={(listItemProps) => {
              return (
                <BaseView
                  level={2}
                  key={
                    "collateral_deposit_" +
                    listItemProps.id.token.address +
                    listItemProps.id.deposit_amount +
                    listItemProps.id.wallet_amount
                  }
                  fetcher={() => Promise.resolve(listItemProps.id)}
                  dataView={(data, setExpanded) => {
                    return (
                      <TableRowView
                        expandedCallback={setExpanded}
                        colDims={depositTableColdims}
                        colData={{
                          Asset: data.token,
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
                          <CollateralInputs
                            key={"deposit" + data.token}
                            account={account!}
                            balanceData={data}
                            type="deposit"
                            callback={() => {
                              actionFinished();
                            }}
                          ></CollateralInputs>
                        );
                      },
                    },
                    {
                      action: "Withdraw",
                      onClickView: (
                        data: TokenDepositInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <CollateralInputs
                            key={"withdraw" + data.token}
                            account={account!}
                            balanceData={data}
                            type="withdraw"
                            callback={() => {
                              actionFinished();
                            }}
                          ></CollateralInputs>
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
                  dataView={(data, setExpanded) => {
                    return (
                      <TableRowView
                        expandedCallback={setExpanded}
                        colDims={borrowedTableColdims}
                        colData={{
                          Asset: data.token,
                          Debt: Number(
                            ethers.utils.formatUnits(
                              data.loan.amount.add(data.interest),
                              data.token.decimals
                            )
                          ).toFixed(2),
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
                    {
                      action: "Info",
                      onClickView: (data: FullLoanInfo) => {
                        return <LoanInfoView loanInfo={data}></LoanInfoView>;
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
                  fetcher={() => getTokenOfferStats(listItemProps.id)} //todo get token info from server
                  dataView={(data, setExpanded) => {
                    return (
                      <TableRowView
                        expandedCallback={setExpanded}
                        colDims={toBorrowTableColdims}
                        colData={{
                          Asset: data.token,
                          "Lowest APY":
                            data.minAPY != undefined
                              ? (data.minAPY / 100).toFixed(2) + " %"
                              : "-",
                          Available: bigNumberString(data.total, data.token),
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
