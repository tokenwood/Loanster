import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, { TableLoader } from "components/DataLoaders";
import {
  DepositInfo,
  formatDate,
  getDepositInfo,
  getSupplyABI,
  getSupplyAddress,
  getSupplyDepositIds,
  getSupplyTokens,
  getTokenBalance,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import { BigNumber } from "ethers";
import { SupplyDepositInputs } from "components/DepositInputs";
import { DepositView, TokenBalanceView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { ReactNode } from "react";
import { Flex, Spacer, Th, Tr } from "@chakra-ui/react";
import { getSortedSupply } from "libs/market_utils";
import { ADDRESS_TO_TOKEN } from "libs/constants";

export default function MarketPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  const provider = useProvider();

  async function returnSelf<T>(value: T) {
    return value;
  }
  return (
    <BasePage
      account={account}
      isConnecting={isConnecting}
      isDisconnected={isDisconnected}
    >
      <VStack align="left" spacing="4">
        <Box>
          {/* <Heading as="h6" size="sm" mb="3">
            {"Offers"}
          </Heading> */}
          <TableLoader
            fetchData={() => getSortedSupply(provider)}
            reloadEvents={[{ eventType: EventType.SUPPLY_TOKEN_DEPOSITED }]}
            tableCaption={"Available offers"}
            makeTableHead={() => {
              return (
                <Tr>
                  <Th>Token</Th>
                  <Th isNumeric>available</Th>
                  <Th isNumeric>interest rate</Th>
                  <Th isNumeric>min/max duration (days)</Th>
                  <Th>expiration</Th>
                </Tr>
              );
            }}
            makeTableRow={(props) => {
              return (
                <Tr>
                  <Th>{ADDRESS_TO_TOKEN[props.id.token].symbol}</Th>
                  <Th isNumeric>0</Th>
                  <Th isNumeric>
                    {props.id.interestRateBPS.toNumber() / 100 + " %"}
                  </Th>
                  <Th isNumeric>
                    {props.id.minLoanDuration + "d"} /
                    {props.id.maxLoanDuration + "d"}
                  </Th>
                  <Th>{formatDate(props.id.expiration)}</Th>
                </Tr>
              );
            }}
          ></TableLoader>

          {/* <ListLoader
            fetchIds={() => getSortedSupply(provider)}
            reloadEvents={[{ eventType: EventType.SUPPLY_TOKEN_DEPOSITED }]}
            makeListItem={(props) => {
              return (
                <BaseView
                  key={"supply_" + props.id}
                  fetcher={() => returnSelf(props.id)}
                  level={2}
                  dataView={(data) => (
                    <DepositView depositInfo={data}></DepositView>
                  )}
                  actions={[]}
                ></BaseView>
              );
            }} */}
          {/* /> */}
        </Box>
      </VStack>
    </BasePage>
  );
}
