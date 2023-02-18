import { VStack, Heading, Box, Flex } from "@chakra-ui/layout";
import { Button, Card, CardBody, StackDivider, Spacer } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import Balances from "components/SupplyTokens";
import Positions from "components/Positions";
import ClientOnly from "components/clientOnly";
import { BasePage } from "components/BaseComponents";

export default function LoansPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  return BasePage(
    <VStack align="left" divider={<StackDivider />} spacing="4">
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Loans"}
        </Heading>
        {/* <Positions account={account!} /> */}
      </Box>
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Collateral deposits"}
        </Heading>
        {/* <Positions account={account!} /> */}
      </Box>
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Positions"}
        </Heading>
        <Positions account={account!} />
      </Box>
    </VStack>,
    account,
    isConnecting,
    isDisconnected
  );
}
