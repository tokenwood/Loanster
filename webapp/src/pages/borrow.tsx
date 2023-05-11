import { VStack, Heading, Box, HStack } from "@chakra-ui/layout";
import { Address, useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, {
  ChildProps,
  DataLoader,
  TableLoader,
} from "components/DataLoaders";

import { Provider } from "@wagmi/core";
import {
  BorrowInputs,
  CollateralInputs,
  RepayLoanInputs,
} from "components/InputViews";
import {
  ColSpecs,
  LoanInfoView,
  TableHeaderView,
  TableRowView,
} from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { BigNumber, ethers } from "ethers";
import {
  Button,
  Flex,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Th,
  Tr,
} from "@chakra-ui/react";
import { healthFactorColor, makeUniqueKey } from "libs/helperFunctions";
import {
  actionInitColorScheme,
  defaultBorderRadius,
  DEFAULT_SIZE,
  statFontSize,
} from "components/Theme";
import { getSortedOffers, getTokenOfferStats } from "libs/backend";
import {
  getHealthFactor,
  getCollateralDeposit,
  getBorrowerLoanIds,
  getFullLoanInfo,
  getSupplyTokens,
  getDetailedHealthFactor,
  getWethToken,
  getCollateralTokens,
} from "libs/fetchers";
import {
  BNToPrecision,
  formatDate,
  bigNumberString,
} from "libs/helperFunctions";
import { TokenDepositInfo, FullLoanInfo, TokenAmount } from "libs/types";
import OfferBrowser from "components/OfferBrowser";
import Price from "components/Price";

const depositTableColdims: { [key: string]: ColSpecs } = {
  Asset: { size: 0.3 },
  Deposited: { size: 0.7, align: "right" },
  "In Wallet": { size: 1, align: "right" },
  " ": { size: 0.1 },
};
const borrowedTableColdims: { [key: string]: ColSpecs } = {
  Asset: { size: 0.3 },
  Debt: { size: 1, align: "right" },
  APY: { size: 1, align: "right" },
  Term: { size: 1, align: "right" },
  " ": { size: 0.2 },
};
const toBorrowTableColdims: { [key: string]: ColSpecs } = {
  Asset: { size: 0.3 },
  "APY (7d)": { size: 1, align: "right" },
  "APY (30d)": { size: 1, align: "right" },
  "APY (90d)": { size: 1, align: "right" },
  Available: { size: 1, align: "right" },
  " ": { size: 0.1 },
};

export default function LoansPage() {
  const { address: account } = useAccount();
  const provider = useProvider();
  return (
    <Box p={4} w={"100%"} layerStyle={"level1"} key={account}>
      <VStack align="left" spacing="4">
        <Box>
          <Heading as="h6" layerStyle={"onbg"} size="sm" mb="3">
            {"Account"}
          </Heading>

          <DataLoader
            fetcher={() => getDetailedHealthFactor(provider, account!)}
            reloadEvents={[
              { eventType: EventType.COLLATERAL_TOKEN_DEPOSITED },
              { eventType: EventType.COLLATERAL_TOKEN_WITHDRAWN },
              { eventType: EventType.LOAN_CREATED },
              { eventType: EventType.LOAN_REPAID },
            ]}
            makeChildren={(childProps) => {
              return (
                <HStack w="100%">
                  <Stat textAlign={"center"}>
                    <StatLabel>Health Factor</StatLabel>
                    <StatNumber
                      fontSize={statFontSize}
                      color={healthFactorColor(childProps.data.healthFactor)}
                    >
                      {childProps.data.healthFactor == undefined
                        ? "-"
                        : childProps.data.healthFactor ==
                          Number.POSITIVE_INFINITY
                        ? "∞"
                        : childProps.data.healthFactor.toFixed(2)}
                    </StatNumber>
                  </Stat>
                  <Stat textAlign={"center"}>
                    <StatLabel>Total Collateral</StatLabel>
                    <StatNumber fontSize={statFontSize}>
                      {"Ξ " +
                        bigNumberString(
                          childProps.data.collateralValueEth,
                          getWethToken(provider)
                        )}
                    </StatNumber>
                    <StatHelpText textStyle={"price"}>
                      <Price
                        token={getWethToken(provider)}
                        amount={childProps.data.collateralValueEth}
                      />
                    </StatHelpText>
                  </Stat>
                  <Stat textAlign={"center"}>
                    <StatLabel>Total Debt</StatLabel>
                    <StatNumber fontSize={statFontSize}>
                      {"Ξ " +
                        bigNumberString(
                          childProps.data.loanValueEth,
                          getWethToken(provider)
                        )}
                    </StatNumber>
                    <StatHelpText textStyle={"price"}>
                      <Price
                        token={getWethToken(provider)}
                        amount={childProps.data.loanValueEth}
                      />
                    </StatHelpText>
                  </Stat>
                </HStack>
              );
            }}
          ></DataLoader>
        </Box>
        <Box>
          <Heading as="h6" layerStyle={"onbg"} size="sm" mb="3">
            {"Collateral Deposits"}
          </Heading>

          <ListLoader
            fetchData={() => getCollateralTokens(provider)}
            makeHeader={() => (
              <TableHeaderView colSpecs={depositTableColdims}></TableHeaderView>
            )}
            makeListItem={(listItemProps) => {
              return (
                <BaseView
                  level={2}
                  key={"collateral_deposit_" + listItemProps.id.address}
                  fetcher={() =>
                    getCollateralDeposit(listItemProps.id, provider, account)
                  }
                  collapseEvents={[
                    {
                      eventType: EventType.COLLATERAL_TOKEN_DEPOSITED,
                      suffix: listItemProps.id.address,
                    },
                    {
                      eventType: EventType.COLLATERAL_TOKEN_WITHDRAWN,
                      suffix: listItemProps.id.address,
                    },
                  ]}
                  reloadEvents={[
                    {
                      eventType: EventType.COLLATERAL_TOKEN_DEPOSITED,
                      suffix: listItemProps.id.address,
                    },
                    {
                      eventType: EventType.COLLATERAL_TOKEN_WITHDRAWN,
                      suffix: listItemProps.id.address,
                    },
                  ]}
                  dataView={(data) => {
                    return (
                      <TableRowView
                        key={makeUniqueKey(data)}
                        colSpecs={depositTableColdims}
                        colData={{
                          Asset: data.token,
                          Deposited: {
                            token: data.token,
                            amount: data.deposit_amount,
                          },
                          "In Wallet": {
                            token: data.token,
                            amount: data.wallet_amount,
                          },
                        }}
                      />
                    );
                  }}
                  tabs={[
                    {
                      action: "Deposit",
                      onClickView: (
                        data: TokenDepositInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <CollateralInputs
                            key={makeUniqueKey(data, "deposit")}
                            account={account}
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
                            account={account}
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
          <BasePage disconnectedText="Connect wallet to see your loans">
            <ListLoader
              fetchData={() => getBorrowerLoanIds(provider, account!)}
              makeHeader={() => (
                <TableHeaderView
                  colSpecs={borrowedTableColdims}
                ></TableHeaderView>
              )}
              placeholderText={"No loans"}
              reloadEvents={[
                { eventType: EventType.LOAN_CREATED },
                { eventType: EventType.LOAN_REPAID },
              ]}
              makeListItem={(listItemProps) => {
                return (
                  <BaseView
                    level={2}
                    key={"loan_" + listItemProps.id.toString()}
                    fetcher={() => getFullLoanInfo(provider, listItemProps.id)}
                    collapseEvents={[
                      {
                        eventType: EventType.LOAN_REPAID,
                        suffix: listItemProps.id,
                      },
                    ]}
                    dataView={(data) => {
                      return (
                        <TableRowView
                          colSpecs={borrowedTableColdims}
                          colData={{
                            Asset: data.token,
                            Debt: {
                              amount: data.loan.amount.add(data.interest),
                              token: data.token,
                            },
                            APY:
                              (data.loan.interestRateBPS / 100).toFixed(2) +
                              " %",
                            Term: {
                              timestamp: data.loan.expiration,
                            },
                          }}
                        />
                      );
                    }}
                    tabs={[
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
          </BasePage>
        </Box>
        <Box>
          <Heading as="h6" layerStyle={"onbg"} size="sm" mb="3">
            {"Assets To Borrow"}
          </Heading>
          <ListLoader
            fetchData={() => getSupplyTokens(provider)}
            makeHeader={() => (
              <TableHeaderView
                colSpecs={toBorrowTableColdims}
              ></TableHeaderView>
            )}
            makeListItem={(listItemProps) => {
              return (
                <BaseView
                  level={2}
                  key={"asset_to_borrow" + listItemProps.id.address}
                  fetcher={() => getTokenOfferStats(listItemProps.id)} //todo get token info from server
                  dataView={(data) => {
                    return (
                      <TableRowView
                        colSpecs={toBorrowTableColdims}
                        colData={{
                          Asset: data.token,
                          "APY (7d)":
                            data.apy7d != undefined
                              ? (data.apy7d / 100).toFixed(2) + " %"
                              : "-",
                          "APY (30d)":
                            data.apy30d != undefined
                              ? (data.apy30d / 100).toFixed(2) + " %"
                              : "-",
                          "APY (90d)":
                            data.apy90d != undefined
                              ? (data.apy90d / 100).toFixed(2) + " %"
                              : "-",
                          Available: {
                            token: data.token,
                            amount: data.total ?? BigNumber.from(0),
                          },
                        }}
                      />
                    );
                  }}
                  tabs={[
                    {
                      action: "Offers",
                      onClickView: (data, actionFinished: () => any) => {
                        return (
                          <OfferBrowser
                            token={listItemProps.id}
                            account={account!}
                          ></OfferBrowser>
                        );
                      },
                    },
                    // {
                    //   action: "Borrow",
                    //   onClickView: (data, actionFinished: () => any) => {
                    //     return (
                    //       <BorrowInputs
                    //         account={account!}
                    //         callback={() => {
                    //           actionFinished();
                    //         }}
                    //         token={listItemProps.id}
                    //       ></BorrowInputs>
                    //     );
                    //   },
                    // },
                  ]}
                ></BaseView>
              );
            }}
          ></ListLoader>
        </Box>
      </VStack>
    </Box>
  );
}
