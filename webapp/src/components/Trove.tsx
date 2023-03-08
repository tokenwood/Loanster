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
import { Token } from "@uniswap/sdk-core";
import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from "libs/constants";
import { eventEmitter, EventType } from "libs/eventEmitter";
import {
  getLoanIds,
  getToken,
  getTroveInfo,
  getTroveManagerABI,
  getTroveManagerAddress,
  TroveInfo,
} from "libs/unilend_utils";
import { FullPositionInfo, getFullPositionInfo } from "libs/uniswap_utils";
import { Address, useProvider } from "wagmi";
import { ContractCallButton, BaseView } from "./BaseComponents";
import ListLoader, { DataLoader, MakeListItemProps } from "./DataLoaders";
import { PositionView, TokenBalanceView } from "./DataViews";
import Loan from "./Loan";
import { defaultBorderRadius, level2BorderColor } from "./Theme";

interface TroveProps {
  account: Address;
  troveId: number;
  refetchTroves: () => any;
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
      // key={props.troveId.toString()}
      fetcher={() => getTroveInfo(props.troveId, provider)}
      makeChildren={(childProps: TroveChildProps) => {
        return (
          <Card
            w="100%"
            layerStyle={"level2"}
            borderColor={level2BorderColor}
            borderRadius={defaultBorderRadius}
          >
            <CardBody margin={-2}>
              <VStack align="left" spacing="4">
                <Box>
                  <Heading as="h1" size="sm" mb="2" layerStyle={"level2"}>
                    {"Collateral"}
                  </Heading>
                  {(childProps.data as TroveInfo).token ==
                  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS ? (
                    <BaseView
                      fetcher={() =>
                        getFullPositionInfo(
                          provider,
                          childProps.data.amountOrId.toNumber()
                        )
                      }
                      dataView={(data: FullPositionInfo) => {
                        return (
                          <PositionView fullPositionInfo={data}></PositionView>
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
                                callback={() => {
                                  props.refetchTroves();
                                  eventEmitter.dispatch({
                                    eventType:
                                      EventType.COLLATERAL_POSITION_WITHDRAWN,
                                  });
                                }}
                              ></ContractCallButton>
                            </Flex>
                          ),
                        },
                      ]}
                    ></BaseView>
                  ) : (
                    <BaseView
                      fetcher={() => getToken(provider, childProps.data.token)}
                      dataView={(data: Token) => {
                        return (
                          <TokenBalanceView
                            amount={childProps.data.amountOrId}
                            token={data}
                          />
                        );
                      }}
                      actions={[
                        {
                          action: "Withdraw",
                          onClickView: (data: Token) => (
                            <Flex w="100%">
                              <Spacer></Spacer>
                              <ContractCallButton
                                contractAddress={getTroveManagerAddress()}
                                abi={getTroveManagerABI()}
                                functionName={"closeTrove"}
                                args={[props.troveId]}
                                enabled={true}
                                callback={() => {
                                  //   childProps.refetchData(); // reload trove info
                                  props.refetchTroves();
                                  eventEmitter.dispatch({
                                    eventType:
                                      EventType.COLLATERAL_TOKEN_WITHDRAWN,
                                    suffix: data.address,
                                  });
                                }}
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
                    fetchData={() => getLoanIds(provider, props.troveId)}
                    makeListItem={(builderProps) => {
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
