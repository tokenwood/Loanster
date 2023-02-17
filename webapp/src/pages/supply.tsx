import { VStack, Heading, Box } from "@chakra-ui/layout";
import { StackDivider } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import Balances from "components/Balances";
import { BasePage } from "components/BasePage";

export default function SupplyPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  return BasePage(
    <VStack align="left" divider={<StackDivider />} spacing="4">
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Supply Deposits"}
        </Heading>
        <Box>no deposits</Box>
      </Box>

      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Supply Tokens"}
        </Heading>
        <Balances account={account!} />
      </Box>
    </VStack>,
    account,
    isConnecting,
    isDisconnected
  );
}
