import {
  Card,
  CardBody,
  VStack,
  Box,
  Text,
  Heading,
  Spacer,
  Flex,
} from "@chakra-ui/react";
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "libs/constants";
import {
  getLoanIds,
  getTokenInfo,
  getTroveInfo,
  getTroveManagerABI,
  getTroveManagerAddress,
  TokenBalanceInfo,
  TroveInfo,
} from "libs/unilend_utils";
import { ReactNode } from "react";
import { Address, useBalance, useProvider } from "wagmi";
import { ContractCallButton, BaseView } from "./BaseComponents";
import ListLoader, {
  ChildProps,
  DataLoader,
  MakeListItemProps,
} from "./DataLoaders";
import { TokenBalanceView } from "./DataViews";
import Loan from "./Loan";
import { level2BorderColor } from "./Theme";
import TokenBalance, {
  ContractCallProps,
  InputsProps,
  DepositInputs,
} from "./TokenBalance";

interface TroveProps {
  account: Address;
  troveId: number;
}

interface TroveChildProps {
  data: TroveInfo;
  refetchData: () => any;
}

export default function Trove(props: TroveProps) {
  const provider = useProvider();

  return (
    <DataLoader
      defaultValue={[]}
      fetcher={() => getTroveInfo(props.troveId, provider)}
      makeChildren={(childProps: TroveChildProps) => {
        return (
          <Card w="100%" layerStyle={"level2"} borderColor={level2BorderColor}>
            <CardBody margin={-2}>
              <VStack align="left" spacing="4">
                {/* <Box layerStyle={"level3"}>
                  <Text>trove id: {props.troveId}</Text>
                </Box> */}
                <Box>
                  <Heading as="h1" size="sm" mb="2" layerStyle={"level2"}>
                    {"Collateral"}
                  </Heading>
                  {(childProps.data as TroveInfo).token ==
                  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS ? (
                    <Text>
                      position id {childProps.data.amountOrId.toNumber()}
                    </Text>
                  ) : (
                    <BaseView
                      fetcher={() => getTokenInfo(childProps.data, provider)}
                      dataView={(data: TokenBalanceInfo) => {
                        return (
                          <TokenBalanceView
                            amount={childProps.data.amountOrId}
                            symbol={data.symbol}
                            decimals={data.decimals}
                          ></TokenBalanceView>
                        );
                      }}
                      actions={[
                        {
                          action: "Withdraw",
                          onClickView: () => (
                            <Flex w="100%">
                              <Spacer></Spacer>
                              <ContractCallButton
                                contractAddress={getTroveManagerAddress()}
                                abi={getTroveManagerABI()}
                                functionName={"closeTrove"}
                                args={[props.troveId]}
                                enabled={true}
                                callback={() => childProps.refetchData}
                              ></ContractCallButton>
                            </Flex>
                          ),
                        },
                      ]}
                    ></BaseView>
                    // <TokenBalance
                    //   account={props.account}
                    //   tokenAddress={childProps.data.token}
                    //   key={childProps.data.token + props.troveId}
                    //   contractCallComponent={(callProps: ContractCallProps) => {
                    //     return (
                    //       <ContractCallButton
                    //         contractAddress={getTroveManagerAddress()}
                    //         abi={getTroveManagerABI()}
                    //         functionName={"closeTrove"}
                    //         args={[props.troveId]}
                    //         enabled={callProps.enabled}
                    //         callback={callProps.callback}
                    //       ></ContractCallButton>
                    //     );
                    //   }}
                    // ></TokenBalance>
                  )}
                </Box>
                <Box>
                  <Heading as="h1" size="sm" mb="2">
                    {"Loans"}
                  </Heading>
                  <ListLoader
                    fetchIds={() => getLoanIds(provider, props.troveId)}
                    makeListItem={(builderProps: MakeListItemProps) => {
                      return (
                        <Loan
                          account={props.account}
                          loanId={builderProps.id}
                          key={builderProps.id}
                        />
                      );
                    }}
                  ></ListLoader>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        );
      }}
    ></DataLoader>
  );
}
