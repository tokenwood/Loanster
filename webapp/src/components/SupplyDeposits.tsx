import React, { useEffect, useState, useMemo, useCallback } from "react";
import { VStack } from "@chakra-ui/react";
import { Box } from "@chakra-ui/layout";
import { Address, useProvider } from "wagmi";
import Balance from "./SupplyToken";
import { getSupplyDepositIds, getSupplyTokens } from "libs/unilend_utils";
import SupplyDeposit from "./SupplyDeposit";
import { BigNumber } from "ethers";

interface Props {
  account: Address;
}

export default function (props: Props) {
  const [depositIds, setDepositIds] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const provider = useProvider();

  const fetchData = async () => {
    const tokens = await getSupplyDepositIds(provider, props.account);
    setIsLoaded(true);
    setDepositIds(tokens);
  };

  useEffect(() => {
    if (!isLoaded) {
      fetchData().catch((error) => {
        console.log(error);
        setIsLoaded(true);
      });
    }
  }, [depositIds]);

  return (
    <VStack>
      {depositIds.map((depositId) => (
        <SupplyDeposit
          account={props.account}
          depositId={BigNumber.from(depositId)}
          callback={fetchData}
          key={depositId}
        ></SupplyDeposit>
      ))}
    </VStack>
  );
}
