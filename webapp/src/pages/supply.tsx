import { VStack, Heading, Box } from "@chakra-ui/layout";
import { useAccount, useProvider } from "wagmi";
import { BasePage, BaseView } from "components/BaseComponents";
import ListLoader from "components/DataLoaders";
import {
  getSupplyAddress,
  getSupplyDepositIds,
  getSupplyTokens,
  getTokenBalance,
  TokenBalanceInfo,
} from "libs/unilend_utils";
import SupplyDeposit from "components/SupplyDeposit";
import { BigNumber } from "ethers";
import { SupplyDepositInputs } from "components/DepositInputs";
import { TokenBalanceView } from "components/DataViews";
import { EventType } from "libs/eventEmitter";

export default function SupplyPage() {
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
            {"Your supplies"}
          </Heading>
          <ListLoader
            fetchIds={() => getSupplyDepositIds(provider, account!)}
            reloadEvents={[{ eventType: EventType.SUPPLY_TOKEN_DEPOSITED }]}
            makeListItem={(props) => {
              return (
                <SupplyDeposit
                  account={account!}
                  depositId={BigNumber.from(props.id)}
                  callback={props.callback}
                  key={props.id}
                ></SupplyDeposit>
              );
            }}
          />
        </Box>

        <Box>
          <Heading as="h6" size="sm" mb="3">
            {"Assets to supply"}
          </Heading>
          <ListLoader
            fetchIds={() => getSupplyTokens(provider)}
            makeListItem={(props) => {
              return (
                <BaseView
                  key={"wallet_supply_token_ballance_" + props.id}
                  level={2}
                  fetcher={() => getTokenBalance(provider, props.id, account!)}
                  reloadEvents={[
                    {
                      eventType: EventType.SUPPLY_TOKEN_WITHDRAWN,
                      suffix: props.id,
                    },
                  ]}
                  dataView={(data: TokenBalanceInfo) => {
                    return (
                      <TokenBalanceView
                        amount={data.amount}
                        token={data.token}
                      />
                    );
                  }}
                  actions={[
                    {
                      action: "Deposit",
                      onClickView: (
                        data: TokenBalanceInfo,
                        actionFinished: () => any
                      ) => {
                        return (
                          <SupplyDepositInputs
                            account={account!}
                            balanceData={data}
                            approvalAddress={getSupplyAddress()}
                            callback={() => {
                              actionFinished();
                            }}
                          />
                        );
                      },
                    },
                  ]}
                />
              );
            }}
          />
        </Box>
      </VStack>
    </BasePage>
  );
}
