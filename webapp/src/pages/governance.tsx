import { VStack, Heading, Box, Text } from "@chakra-ui/layout";
import { useProvider } from "wagmi";
import { BasePage } from "components/BaseComponents";

export default function LiquidationsPage() {
  const provider = useProvider();
  return (
    <Box p={4} w={"100%"} layerStyle={"level1"}>
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
    </Box>
  );
}
