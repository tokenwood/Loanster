import { Box } from "@chakra-ui/layout";
import { Heading, Select, VStack } from "@chakra-ui/react";
import { BasePage } from "components/BaseComponents";
import { ChildProps, DataLoader } from "components/DataLoaders";
import { LoanInputs } from "components/DepositInputs";
import Trove from "components/Trove";
import { getTroveIds } from "libs/unilend_utils";
import { type } from "os";
import { useState } from "react";
import { useAccount, useProvider } from "wagmi";

export default function BorrowPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  const provider = useProvider();

  return (
    <BasePage
      account={account}
      isConnecting={isConnecting}
      isDisconnected={isDisconnected}
      width={"60%"}
    >
      <VStack align="left" spacing="4">
        <Box>
          <Heading as="h6" size="sm" mb="3">
            Borrow
          </Heading>
          <LoanInputs account={account!} callback={(params) => {}}></LoanInputs>
        </Box>
      </VStack>
    </BasePage>
  );
}
