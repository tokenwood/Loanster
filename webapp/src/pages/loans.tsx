import { VStack, Heading, Box } from "@chakra-ui/layout";
import { Flex, Spacer, StackDivider } from "@chakra-ui/react";
import { Address, erc721ABI, useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import {
  ChildProps,
  DataLoader,
  MakeListItemProps,
} from "components/DataLoaders";
import ListLoader from "components/DataLoaders";
import {
  getPositionIds,
  getPositionInfo,
  PositionInfo,
} from "libs/uniswap_utils";
import Position from "components/Position";
import { BigNumber } from "ethers";
import {
  getCollateralTokens,
  getERC721Allowance,
  getToken,
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
import { PositionView } from "components/DataViews";
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "libs/constants";

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
                <BaseView
                  key={props.id}
                  fetcher={() => getPositionInfo(props.id, provider)}
                  dataView={(data: PositionInfo) => {
                    return (
                      <PositionView
                        token0={getToken(data.token0)}
                        token1={getToken(data.token1)}
                        liquidity={data.liquidity.toNumber()}
                      ></PositionView>
                    );
                  }}
                  actions={[
                    {
                      action: "Deposit",
                      onClickView: () => (
                        <Flex w="100%">
                          <Spacer></Spacer>
                          <DataLoader
                            // defaultValue={}
                            fetcher={() =>
                              getERC721Allowance(
                                provider,
                                NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
                                props.id
                              )
                            }
                            makeChildren={(childProps: ChildProps) => {
                              return childProps.data !=
                                getTroveManagerAddress() ? (
                                <ContractCallButton
                                  contractAddress={
                                    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
                                  }
                                  abi={erc721ABI}
                                  functionName={"approve"}
                                  args={[getTroveManagerAddress(), props.id]}
                                  callback={() => childProps.refetchData()}
                                  enabled={true}
                                  buttonText="Approve"
                                ></ContractCallButton>
                              ) : (
                                <ContractCallButton
                                  contractAddress={getTroveManagerAddress()}
                                  abi={getTroveManagerABI()}
                                  functionName={"openTrove"}
                                  enabled={true}
                                  args={[
                                    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
                                    props.id,
                                  ]}
                                  callback={() => props.callback()}
                                ></ContractCallButton>
                              );
                            }}
                          ></DataLoader>
                        </Flex>
                      ),
                    },
                  ]}
                ></BaseView>
                // <Position
                //   account={account}
                //   positionId={BigNumber.from(props.id)}
                //   callback={props.callback}
                //   key={props.id}
                // ></Position>
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
