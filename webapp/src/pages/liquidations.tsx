import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import {
  BasePage,
  BaseView,
  ContractCallButton,
} from "components/BaseComponents";
import ListLoader from "components/DataLoaders";
import {
  FullLoanInfo,
  getFullLoanInfo,
  getLoanIds,
  getSupplyABI,
  getSupplyAddress,
} from "libs/unilend_utils";
import { LoanView } from "components/DataViews";
import { eventEmitter, EventType } from "libs/eventEmitter";
import { Flex, Spacer } from "@chakra-ui/react";
import { BigNumber } from "ethers";

export default function LiquidationsPage() {
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
          <Heading as="h6" size="sm" mb="3">
            {"Loans"}
          </Heading>
          <ListLoader
            fetchData={() => getLoanIds(provider, account!)}
            makeListItem={(props) => {
              return (
                <BaseView
                  level={2}
                  key={props.id}
                  fetcher={() => getFullLoanInfo(provider, props.id)}
                  dataView={(data) => {
                    return <LoanView data={data} />;
                  }}
                  actions={[
                    {
                      action: "Claim",
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
      </VStack>
    </BasePage>
  );
}
