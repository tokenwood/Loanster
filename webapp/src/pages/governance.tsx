import { VStack, Heading, Box, Text } from "@chakra-ui/layout";
import { useProvider } from "wagmi";
import { BasePage } from "components/BaseComponents";

export default function LiquidationsPage() {
  const provider = useProvider();
  return (
    <BasePage>
      <VStack align="left" spacing="4"></VStack>
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Coming soon..."}
        </Heading>
        <Text>
          Lock governance tokens to earn fees and vote on-chain on protocol
          parameters.
        </Text>
      </Box>
    </BasePage>
  );
}
