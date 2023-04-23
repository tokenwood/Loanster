import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, { ChildProps, DataLoader } from "components/DataLoaders";

import { MakeOfferInputs } from "components/InputViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { Flex, Spacer } from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { getSupplyAddress, getSupplyABI } from "libs/constants";
import { getAccounts } from "libs/fetchers";
import { FullLoanInfo } from "libs/types";

export default function LiquidationsPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  const provider = useProvider();
  return (
    <BasePage
      account={account}
      isConnecting={isConnecting}
      isDisconnected={isDisconnected}
    >
      <VStack align="left" spacing="4"></VStack>
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Loans"}
        </Heading>
      </Box>
    </BasePage>
  );
}
