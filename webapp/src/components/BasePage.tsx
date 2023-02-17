import { VStack, Heading, Box, Flex } from "@chakra-ui/layout";
import { Address } from "wagmi";
import ClientOnly from "components/clientOnly";

export function BasePage(
  element: JSX.Element,
  account: Address | undefined,
  isConnecting: boolean,
  isDisconnected: boolean
) {
  return (
    <VStack>
      <Box p={4} w="100%" borderWidth="1px" borderRadius="lg">
        <ClientOnly>
          {account ? (
            element
          ) : (
            <Box>
              <Box hidden={!isConnecting}>connecting...</Box>
              <Box hidden={!isDisconnected}>Disconnected</Box>
            </Box>
          )}
        </ClientOnly>
      </Box>
    </VStack>
  );
}
