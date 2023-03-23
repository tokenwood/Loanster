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
import { eventEmitter, EventType } from "libs/eventEmitter";
import {
  getTroveLoanIds,
  getToken,
  getTroveManagerABI,
  getTroveManagerAddress,
  getFullTroveInfo,
  FullTroveInfo,
  getFullLoanInfo,
  FullLoanInfo,
} from "libs/unilend_utils";
import { Address, useProvider } from "wagmi";
import { ContractCallButton, BaseView } from "./BaseComponents";
import ListLoader, { DataLoader, MakeListItemProps } from "./DataLoaders";
import { LoanView, TokenBalanceView } from "./DataViews";
import { RepayLoanInputs } from "./InputViews";
import { defaultBorderRadius, level2BorderColor } from "./Theme";

interface TroveProps {
  account: Address;
  troveId: number;
  refetchTroves: () => any;
}

interface TroveChildProps {
  data: FullTroveInfo;
  refetchData: () => any;
}

export default function Trove(props: TroveProps) {
  const provider = useProvider();

  return (
    <DataLoader
      defaultValue={[]}
      // key={props.troveId.toString()}
      fetcher={() => getFullTroveInfo(props.troveId, provider)}
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
                  <BaseView
                    fetcher={() =>
                      Promise.resolve(childProps.data.collateralToken)
                    }
                    dataView={(data: Token) => {
                      return (
                        <TokenBalanceView
                          amount={childProps.data.collateralAmount}
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
                </Box>
                <Box>
                  <Heading as="h1" size="sm" mb="2">
                    {"Loans"}
                  </Heading>
                  <ListLoader
                    fetchData={() => getTroveLoanIds(provider, props.troveId)}
                    makeListItem={(listItemProps) => {
                      return (
                        <BaseView
                          level={3}
                          key={listItemProps.id.toString()}
                          fetcher={() =>
                            getFullLoanInfo(provider, listItemProps.id)
                          }
                          dataView={(data) => {
                            return <LoanView data={data} />;
                          }}
                          actions={[
                            {
                              action: "Repay",
                              onClickView: (
                                data: FullLoanInfo,
                                actionFinished: () => any
                              ) => {
                                return (
                                  <RepayLoanInputs
                                    account={props.account}
                                    loanInfo={data}
                                    troveInfo={childProps.data}
                                    callback={() => {
                                      actionFinished();
                                    }}
                                  />
                                );
                              },
                            },
                          ]}
                        ></BaseView>
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
