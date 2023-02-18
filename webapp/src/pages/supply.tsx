import { VStack, Heading, Box } from "@chakra-ui/layout";
import { StackDivider } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import Balances from "components/SupplyTokens";
import { BasePage } from "components/BaseComponents";
import SupplyDeposits from "components/SupplyDeposits";

export default function SupplyPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  return BasePage(
    <VStack align="left" divider={<StackDivider />} spacing="4">
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Your supplies"}
        </Heading>
        <SupplyDeposits account={account!} />
      </Box>

      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Assets to supply"}
        </Heading>
        <Balances account={account!} />
      </Box>
    </VStack>,
    account,
    isConnecting,
    isDisconnected
  );
}
