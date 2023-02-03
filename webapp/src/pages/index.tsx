// src/pages/index.tsx
import type { NextPage } from "next";
import Head from "next/head";
import { VStack, Heading, Box, Flex } from "@chakra-ui/layout";
import { Button, Card, CardBody, StackDivider, Spacer } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import Balance from "components/Balance";
import Positions from "components/Positions";

import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS as posManager } from "utils/constants";

declare let window: any;

const Home: NextPage = () => {
  const { address: account, isConnecting, isDisconnected } = useAccount();

  return (
    <>
      <Head>
        <title>Unilend</title>
      </Head>

      <VStack>
        <Box mb={0} p={4} w="100%" borderWidth="1px" borderRadius="lg">
          <Heading my={1} fontSize="xl" mb="3">
            Account info
          </Heading>

          <VStack align="left" divider={<StackDivider />} spacing="4">
            <Box>
              <Heading as="h6" size="sm" mb="3">
                {"Supply Tokens"}
              </Heading>
              <Balance
                account={account}
                token="0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
              />
            </Box>

            <Box>
              <Heading as="h6" size="sm" mb="3">
                {"Positions"}{" "}
              </Heading>
              <Positions posManager={posManager} account={account} />
            </Box>
          </VStack>
        </Box>
      </VStack>
    </>
  );
};

export default Home;
