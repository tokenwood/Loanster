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
import { TokenDepositInfo, FullLoanInfo } from "libs/types";
import { WETH_TOKEN } from "libs/constants";
import OfferBrowser from "components/OfferBrowser";

const depositTableColdims: { [key: string]: ColSpecs } = {
  Asset: { size: 1 },
  "In Wallet": { size: 1 },
  Deposited: { size: 1 },
  " ": { size: 1 },
};
const borrowedTableColdims: { [key: string]: ColSpecs } = {
  Asset: { size: 1 },
  Debt: { size: 1 },
  APY: { size: 1 },
  Term: { size: 1 },
};
const toBorrowTableColdims: { [key: string]: ColSpecs } = {
  Asset: { size: 1 },
  "Lowest APY": { size: 1 },
  Available: { size: 1 },
  " ": { size: 1 },
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
                          Available: bigNumberString(data.total, data.token),
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
