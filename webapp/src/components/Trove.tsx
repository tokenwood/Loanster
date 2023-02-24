import {
  useBoolean,
  Card,
  CardBody,
  VStack,
  Box,
  Text,
  StackDivider,
  Heading,
} from "@chakra-ui/react";
import {
  DEFAULT_SIZE,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
} from "libs/constants";
import { getLoanIds, getTroveInfo, TroveInfo } from "libs/unilend_utils";
import { ReactNode, useState } from "react";
import { Address, useBalance, useProvider } from "wagmi";
import ListLoader, {
  ChildProps,
  DataLoader,
  MakeListItemProps,
} from "./DataLoaders";
import Loan from "./Loan";
import { ContractCallProps, InputsProps, DepositInputs } from "./TokenBalance";

interface TroveProps {
  account: Address;
  troveId: number;
}

export default function Trove(props: TroveProps) {
  const provider = useProvider();

  return (
    <DataLoader
      defaultValue={[]}
      fetcher={() => getTroveInfo(props.troveId, provider)}
      makeChildren={(childProps: ChildProps) => {
        return (
          <Card w="100%">
            <CardBody margin={-2}>
              <VStack align="left" divider={<StackDivider />} spacing="4">
                <Box>
                  <Text>trove id: {props.troveId}</Text>
                </Box>
                <Box>
                  <Heading as="h1" size="sm" mb="2">
                    {"Collateral"}
                  </Heading>
                  {(childProps.data as TroveInfo).token ==
                  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS ? (
                    <Text>
                      {" "}
                      position id {childProps.data.amountOrId.toNumber()}
                    </Text>
                  ) : (
                    <Text> token balance </Text>
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
