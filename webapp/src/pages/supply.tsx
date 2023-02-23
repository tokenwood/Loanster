import { VStack, Heading, Box } from "@chakra-ui/layout";
import { StackDivider } from "@chakra-ui/react";
import { Address, useAccount } from "wagmi";
import { BasePage } from "components/BaseComponents";
import IdList, { ComponentBuilderProps } from "components/IdList";
import { getSupplyDepositIds, getSupplyTokens } from "libs/unilend_utils";
import SupplyDeposit from "components/SupplyDeposit";
import { BigNumber } from "ethers";
import Balance from "components/SupplyToken";

export default function SupplyPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  return BasePage(
    <VStack align="left" divider={<StackDivider />} spacing="4">
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Your supplies"}
        </Heading>
        <IdList
          account={account!}
          fetchIds={getSupplyDepositIds}
          componentBuilder={(props: ComponentBuilderProps) => {
            return (
              <SupplyDeposit
                account={props.account}
                depositId={BigNumber.from(props.id)}
                callback={props.callback}
                key={props.id}
              ></SupplyDeposit>
            );
          }}
        />
      </Box>

      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Assets to supply"}
        </Heading>
        <IdList
          account={account!}
          fetchIds={getSupplyTokens}
          componentBuilder={(props: ComponentBuilderProps) => {
            return (
              <Balance
                account={props.account}
                tokenAddress={props.id}
                key={props.id}
              />
            );
          }}
        />
      </Box>
    </VStack>,
    account,
    isConnecting,
    isDisconnected
  );
}
