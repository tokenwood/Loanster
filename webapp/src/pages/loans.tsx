import { VStack, Heading, Box } from "@chakra-ui/layout";
import { StackDivider } from "@chakra-ui/react";
import { Address, useAccount } from "wagmi";
import { BasePage, ContractCallButton } from "components/BaseComponents";
import { ComponentBuilderProps } from "components/IdList";
import IdList from "components/IdList";
import { getPositionIds } from "libs/uniswap_utils";
import Position from "components/Position";
import { BigNumber } from "ethers";
import {
  getCollateralTokens,
  getTroveIds,
  getTroveManagerABI,
  getTroveManagerAddress,
} from "libs/unilend_utils";
import { Provider } from "@wagmi/core";
import TokenBalance, {
  ContractCallProps,
  InputsProps,
} from "components/TokenBalance";
import { TokenAmountInput } from "components/InputFields";

export default function LoansPage() {
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
            {"Troves"}
          </Heading>
          <IdList
            account={account!}
            fetchIds={getTroveIds}
            componentBuilder={(props: ComponentBuilderProps) => {
              return <Box> Trove </Box>;
            }}
          />
        </Box>
        <Box>
          <Heading as="h6" size="sm" mb="3">
            {"Your positions"}
          </Heading>
          <IdList
            account={account!}
            fetchIds={getPositionIds}
            componentBuilder={(props: ComponentBuilderProps) => {
              return (
                <Position
                  account={props.account}
                  positionId={BigNumber.from(props.id)}
                  callback={props.callback}
                  key={props.id}
                ></Position>
              );
            }}
          />
        </Box>
        <Box>
          <Heading as="h6" size="sm" mb="3">
            {"Your assets"}
          </Heading>
          <IdList
            account={account!}
            fetchIds={(provider: Provider, account: Address) =>
              getCollateralTokens(provider)
            }
            componentBuilder={(props: ComponentBuilderProps) => {
              return (
                <TokenBalance
                  account={props.account}
                  tokenAddress={props.id}
                  key={props.id}
                  contractCallComponent={(callProps: ContractCallProps) => {
                    return (
                      <ContractCallButton
                        contractAddress={getTroveManagerAddress()}
                        abi={getTroveManagerABI()}
                        functionName={"openTrove"}
                        args={[callProps.tokenAddress, callProps.amount]}
                        enabled={callProps.enabled}
                        callback={callProps.callback}
                      ></ContractCallButton>
                    );
                  }}
                  inputsComponent={(inputsProps: InputsProps) => {
                    return (
                      <TokenAmountInput
                        balanceData={inputsProps.balanceData}
                        callback={(amount: BigNumber) => {
                          inputsProps.callback("amount", amount);
                        }}
                      />
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
