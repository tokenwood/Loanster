// src/pages/index.tsx
import type { NextPage } from "next";
import Head from "next/head";
import { VStack, Heading, Box, Flex } from "@chakra-ui/layout";
import { Button, Card, CardBody, StackDivider, Spacer } from "@chakra-ui/react";
import { Address, useAccount } from "wagmi";
import Balances from "components/Balances";
import Positions from "components/Positions";

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
              <Balances account={account} />
            </Box>

            <Box>
              <Heading as="h6" size="sm" mb="3">
                {"Positions"}{" "}
              </Heading>
              <Positions account={account} />
            </Box>
          </VStack>
        </Box>
      </VStack>
    </>
  );
};

export default Home;
