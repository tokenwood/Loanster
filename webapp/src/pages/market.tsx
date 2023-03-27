import { VStack, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import { BasePage } from "components/BaseComponents";
import { TableLoader } from "components/DataLoaders";
import {
  formatDate,
  // getAmountAvailableForDepositInfo,
} from "libs/unilend_utils";
import { EventType } from "libs/eventEmitter";
import { Th, Tr } from "@chakra-ui/react";
import { getSortedOffers } from "libs/backend";
import { ethers } from "ethers";

export default function MarketPage() {
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
          {/* <Heading as="h6" size="sm" mb="3">
            {"Offers"}
          </Heading> */}
          <TableLoader
            fetchData={() => getSortedOffers()}
            reloadEvents={[{ eventType: EventType.SUPPLY_OFFER_CREATED }]}
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
                // TODO set id as key
                <Tr key={Math.random()}>
                  <Th>{props.id.token.symbol}</Th>
                  <Th isNumeric>
                    {ethers.utils.formatUnits(
                      0, // getAmountAvailableForDepositInfo(props.id),
                      props.id.token.decimals
                    )}
                  </Th>
                  <Th isNumeric>
                    {props.id.offer.interestRateBPS / 100 + " %"}
                  </Th>
                  <Th isNumeric>
                    {props.id.offer.minLoanDuration + "d"} /
                    {props.id.offer.maxLoanDuration + "d"}
                  </Th>
                  <Th>{formatDate(props.id.offer.expiration)}</Th>
                </Tr>
              );
            }}
          ></TableLoader>
        </Box>
      </VStack>
    </BasePage>
  );
}
