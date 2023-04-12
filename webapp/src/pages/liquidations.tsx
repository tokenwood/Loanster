import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader, { ChildProps, DataLoader } from "components/DataLoaders";

import { MakeOfferInputs } from "components/InputViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { Flex, Spacer } from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { getSupplyAddress, getSupplyABI } from "libs/constants";
import { getAccounts } from "libs/dataLoaders";
import { FullLoanInfo } from "libs/types";

export default function LiquidationsPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  const provider = useProvider();
  return (
    <BasePage
      account={account}
      isConnecting={isConnecting}
      isDisconnected={isDisconnected}
    >
      <VStack align="left" spacing="4"></VStack>
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Loans"}
        </Heading>
        <ListLoader
          fetchData={() => getAccounts(provider)}
          makeListItem={(props) => {
            return (
              <BaseView
                level={2}
                key={props.id}
                fetcher={() => getFullAccountInfo(props.id, provider)}
                dataView={(data) => {
                  return <Box> {data.loanId} </Box>;
                }}
                actions={[
                  {
                    action: "Liquidate",
                    onClickView: (
                      data: FullLoanInfo,
                      actionFinished: () => any
                    ) => {
                      return (
                        <Flex w="100%">
                          <Spacer></Spacer>
                          <ContractCallButton
                            contractAddress={getSupplyAddress()}
                            abi={getSupplyABI()}
                            functionName={"withdraw"}
                            args={[data.loanId]}
                            enabled={data.claimable.gt(BigNumber.from(0))}
                            callback={() => {
                              actionFinished();
                              eventEmitter.dispatch({
                                eventType: EventType.LOAN_CLAIMED,
                                suffix: data.token.address,
                              });
                            }}
                          ></ContractCallButton>
                        </Flex>
                      );
                    },
                  },
                ]}
              ></BaseView>
            );
          }}
        ></ListLoader>
      </Box>
    </BasePage>
  );
}
