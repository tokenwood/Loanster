import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, { ChildProps, DataLoader } from "components/DataLoaders";
import {
  getSupplyABI,
  getSupplyAddress,
  getSupplyTokenAddresses,
  getTokenBalance,
  getTroveManagerABI,
  getTroveManagerAddress,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import { MakeOfferInputs } from "components/InputViews";
import { OfferView, TokenBalanceView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import {
  FullOfferInfo,
  getDiego,
  getOfferKey,
  getOffersFromOwner,
  offerRevoked,
} from "libs/backend";
import { Flex, Spacer } from "@chakra-ui/react";
import { BigNumber } from "ethers";

export default function SupplyPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  const provider = useProvider();
  return (
    <BasePage
      account={account}
      isConnecting={isConnecting}
      isDisconnected={isDisconnected}
    >
      <VStack align="left" spacing="4">
        <Box>"Hello Tristan"</Box>
        <DataLoader
          fetcher={getDiego}
          makeChildren={(childProps) => {
            return <Box>{childProps.data}</Box>;
          }}
        ></DataLoader>
      </VStack>
    </BasePage>
  );
}
