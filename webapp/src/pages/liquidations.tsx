import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useProvider } from "wagmi";
import { BasePage } from "components/BaseComponents";
import ListLoader from "components/DataLoaders";
import { getAccounts } from "libs/fetchers";

export default function LiquidationsPage() {
  const provider = useProvider();
  return (
    <BasePage>
      <VStack align="left" spacing="4"></VStack>
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Loans"}
        </Heading>
      </Box>
    </BasePage>
  );
}
