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
  getTroveInfo,
  getTroveManagerABI,
  getTroveManagerAddress,
  TroveInfo,
} from "libs/unilend_utils";
import { Address, useProvider } from "wagmi";
import { ContractCallButton, BaseView } from "./BaseComponents";
import ListLoader, { DataLoader, MakeListItemProps } from "./DataLoaders";
import { TokenBalanceView } from "./DataViews";
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
                  <BaseView
                    fetcher={() => getToken(provider, childProps.data.token)}
                    dataView={(data: Token) => {
                      return (
                        <TokenBalanceView
                          amount={childProps.data.amount}
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
                </Box>
                <Box>
                  <Heading as="h1" size="sm" mb="2">
                    {"Loans"}
                  </Heading>
                  <ListLoader
                    fetchData={() => getTroveLoanIds(provider, props.troveId)}
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
