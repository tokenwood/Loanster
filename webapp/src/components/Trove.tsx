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
  getToken,
  getTokenInfo,
  getTroveInfo,
  getTroveManagerABI,
  getTroveManagerAddress,
  TokenBalanceInfo,
  TroveInfo,
} from "libs/unilend_utils";
import { getPositionInfo, PositionInfo } from "libs/uniswap_utils";
import { ReactNode } from "react";
import { Address, useBalance, useProvider } from "wagmi";
import { ContractCallButton, BaseView } from "./BaseComponents";
import ListLoader, {
  ChildProps,
  DataLoader,
  MakeListItemProps,
} from "./DataLoaders";
import { PositionView, TokenBalanceView } from "./DataViews";
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
                    <BaseView
                      fetcher={() =>
                        getPositionInfo(
                          childProps.data.amountOrId.toNumber(),
                          provider
                        )
                      }
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
                          action: "Withdraw",
                          onClickView: () => (
                            <Flex w="100%">
                              <Spacer></Spacer>
                              <ContractCallButton
                                contractAddress={getTroveManagerAddress()}
                                abi={getTroveManagerABI()}
                                functionName={"closeTrove"}
                                args={[props.troveId]}
                                disabled={true}
                                callback={() => childProps.refetchData}
                              ></ContractCallButton>
                            </Flex>
                          ),
                        },
                      ]}
                    ></BaseView>
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
                                disabled={true}
                                callback={() => childProps.refetchData}
                              ></ContractCallButton>
                            </Flex>
                          ),
                        },
                      ]}
                    ></BaseView>
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
