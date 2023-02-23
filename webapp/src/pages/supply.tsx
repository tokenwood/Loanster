import { VStack, Heading, Box } from "@chakra-ui/layout";
import { StackDivider } from "@chakra-ui/react";
import { Address, useAccount } from "wagmi";
import { BasePage, ContractCallButton } from "components/BaseComponents";
import IdList, { ComponentBuilderProps } from "components/IdList";
import {
  getSupplyABI,
  getSupplyAddress,
  getSupplyDepositIds,
  getSupplyTokens,
} from "libs/unilend_utils";
import SupplyDeposit from "components/SupplyDeposit";
import { BigNumber } from "ethers";
import TokenBalance, {
  ContractCallProps,
  InputsProps,
} from "components/TokenBalance";
import { DateInput, TokenAmountInput } from "components/InputFields";

export default function SupplyPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  return (
    <BasePage
      account={account}
      isConnecting={isConnecting}
      isDisconnected={isDisconnected}
    >
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
                <TokenBalance
                  account={props.account}
                  tokenAddress={props.id}
                  key={props.id}
                  contractCallComponent={(callProps: ContractCallProps) => {
                    return (
                      <ContractCallButton
                        contractAddress={getSupplyAddress()}
                        abi={getSupplyABI()}
                        functionName={"makeDeposit"}
                        args={[
                          callProps.tokenAddress,
                          callProps.amount,
                          BigNumber.from(0),
                          BigNumber.from(0),
                        ]}
                        enabled={callProps.enabled}
                        callback={callProps.callback}
                      ></ContractCallButton>
                    );
                  }}
                  inputsComponent={(inputsProps: InputsProps) => {
                    return (
                      <VStack w="100%">
                        <TokenAmountInput
                          balanceData={inputsProps.balanceData}
                          callback={(amount: BigNumber) => {
                            inputsProps.callback("amount", amount);
                          }}
                        />
                        <DateInput
                          callback={(timestamp: number) => {
                            inputsProps.callback("timestamp", timestamp);
                          }}
                        />
                      </VStack>
                    );
                  }}
                ></TokenBalance>
              );
            }}
          />
        </Box>
      </VStack>
    </BasePage>
  );
}
