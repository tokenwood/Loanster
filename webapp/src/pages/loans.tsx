import { VStack, Heading, Box, Flex } from "@chakra-ui/layout";
import { Button, Card, CardBody, StackDivider } from "@chakra-ui/react";
import { Address, useAccount } from "wagmi";
import { BasePage } from "components/BaseComponents";
import { ComponentBuilderProps } from "components/IdList";
import IdList from "components/IdList";
import { getPositionIds } from "libs/uniswap_utils";
import Position from "components/Position";
import { BigNumber } from "ethers";
import { getCollateralTokens, getTroveIds } from "libs/unilend_utils";
import { Provider } from "@wagmi/core";
import { Component } from "react";

export default function LoansPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  return BasePage(
    <VStack align="left" divider={<StackDivider />} spacing="4">
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Troves"}
        </Heading>
        <IdList
          account={account!}
          fetchIds={getTroveIds}
          componentBuilder={(props: ComponentBuilderProps) => {
            return <Box> Trove </Box>;
          }}
        />
      </Box>
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Your positions"}
        </Heading>
        <IdList
          account={account!}
          fetchIds={getPositionIds}
          componentBuilder={(props: ComponentBuilderProps) => {
            return (
              <Position
                account={props.account}
                positionId={BigNumber.from(props.id)}
                callback={props.callback}
                key={props.id}
              ></Position>
            );
          }}
        />
      </Box>
      <Box>
        <Heading as="h6" size="sm" mb="3">
          {"Your assets"}
        </Heading>
        <IdList
          account={account!}
          fetchIds={(provider: Provider, account: Address) =>
            getCollateralTokens(provider)
          }
          componentBuilder={(props: ComponentBuilderProps) => {
            return <Box> CollateralToken </Box>;
          }}
        />
      </Box>
    </VStack>,
    account,
    isConnecting,
    isDisconnected
  );
}
