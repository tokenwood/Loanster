import { VStack, Heading, Box } from "@chakra-ui/layout";
import { StackDivider } from "@chakra-ui/react";
import { Address, useAccount, useProvider } from "wagmi";
import { BasePage, ContractCallButton } from "components/BaseComponents";
import { MakeListItemProps } from "components/DataLoaders";
import ListLoader from "components/DataLoaders";
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
import Trove from "components/Trove";

export default function LoansPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  const provider = useProvider();
  return (
    <BasePage
      account={account}
      isConnecting={isConnecting}
      isDisconnected={isDisconnected}
    >
      <VStack align="left" spacing="4">
        <Box>
          <Heading as="h6" layerStyle={"onbg"} size="sm" mb="3">
            {"Troves"}
          </Heading>
          <ListLoader
            fetchIds={() => getTroveIds(provider, account!)}
            makeListItem={(props: MakeListItemProps) => {
              return (
                <Trove account={account!} troveId={props.id} key={props.id} />
              );
            }}
          />
        </Box>
        <Box>
          <Heading as="h6" size="sm" mb="3" layerStyle={"onbg"}>
            {"Your positions"}
          </Heading>
          <ListLoader
            fetchIds={() => getPositionIds(provider, account!)}
            makeListItem={(props: MakeListItemProps) => {
              return (
                <Position
                  account={account}
                  positionId={BigNumber.from(props.id)}
                  callback={props.callback}
                  key={props.id}
                ></Position>
              );
            }}
          />
        </Box>
        <Box>
          <Heading as="h6" size="sm" mb="3" layerStyle={"onbg"}>
            {"Your assets"}
          </Heading>
          <ListLoader
            fetchIds={() => getCollateralTokens(provider)}
            makeListItem={(props: MakeListItemProps) => {
              return (
                <TokenBalance
                  account={account!}
                  tokenAddress={props.id}
                  approvalAddress={getTroveManagerAddress()}
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
                      <VStack w="100%" layerStyle={"level3"} padding="5px">
                        <TokenAmountInput
                          balanceData={inputsProps.balanceData}
                          callback={(amount: BigNumber) => {
                            inputsProps.callback("amount", amount);
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
