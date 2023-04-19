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
import { healthFactorColor } from "libs/helperFunctions";
import {
  actionInitColorScheme,
  defaultBorderRadius,
  DEFAULT_SIZE,
  statFontSize,
} from "components/Theme";
import { getSortedOffers, getTokenOfferStats } from "libs/backend";
import {
  getHealthFactor,
  getCollateralDeposits,
  getBorrowerLoanIds,
  getFullLoanInfo,
  getSupplyTokens,
  getDetailedHealthFactor,
} from "libs/fetchers";
import {
  BNToPrecision,
  formatDate,
  bigNumberString,
} from "libs/helperFunctions";
import { TokenDepositInfo, FullLoanInfo, TokenAmount } from "libs/types";
import { WETH_TOKEN } from "libs/constants";
import OfferBrowser from "components/OfferBrowser";
import Price from "components/Price";

const depositTableColdims: { [key: string]: ColSpecs } = {
  Asset: { size: 0.3 },
  "In Wallet": { size: 0.7, align: "right" },
  Deposited: { size: 1, align: "right" },
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
  "Lowest APY": { size: 1, align: "right" },
  Available: { size: 1, align: "right" },
  " ": { size: 0.1 },
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
                      {childProps.data.healthFactor == Number.POSITIVE_INFINITY
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
                          WETH_TOKEN
                        )}
                    </StatNumber>
                    <StatHelpText textStyle={"price"}>
                      <Price
                        token={WETH_TOKEN}
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
                          WETH_TOKEN
                        )}
                    </StatNumber>
                    <StatHelpText textStyle={"price"}>
                      <Price
                        token={WETH_TOKEN}
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
            fetchData={() => getCollateralDeposits(provider, account!)}
            makeHeader={() => (
              <TableHeaderView colSpecs={depositTableColdims}></TableHeaderView>
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
                        colSpecs={depositTableColdims}
                        events={[
                          {
                            eventType: EventType.COLLATERAL_TOKEN_DEPOSITED,
                            suffix: data.token.address,
                          },
                          {
                            eventType: EventType.COLLATERAL_TOKEN_WITHDRAWN,
                            suffix: data.token.address,
                          },
                        ]}
                        colData={{
                          Asset: data.token,
                          Deposited: {
                            token: data.token,
                            amount: data.deposit_amount ?? BigNumber.from(0),
                          },
                          "In Wallet": {
                            token: data.token,
                            amount: data.wallet_amount,
                          },
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
              <TableHeaderView
                colSpecs={borrowedTableColdims}
              ></TableHeaderView>
            )}
            reloadEvents={[{ eventType: EventType.LOAN_CREATED }]}
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
                        colSpecs={borrowedTableColdims}
                        events={[
                          {
                            eventType: EventType.LOAN_REPAID,
                            suffix: listItemProps.id,
                          },
                        ]}
                        colData={{
                          Asset: data.token,
                          Debt: {
                            amount: data.loan.amount.add(data.interest),
                            token: data.token,
                          },
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
                  dataView={(data, setExpanded) => {
                    return (
                      <TableRowView
                        expandedCallback={setExpanded}
                        colSpecs={toBorrowTableColdims}
                        colData={{
                          Asset: data.token,
                          "Lowest APY":
                            data.minAPY != undefined
                              ? (data.minAPY / 100).toFixed(2) + " %"
                              : "-",
                          Available: {
                            token: data.token,
                            amount: data.total ?? BigNumber.from(0),
                          },
                        }}
                      />
                    );
                  }}
                  actions={[
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
    </BasePage>
  );
}
