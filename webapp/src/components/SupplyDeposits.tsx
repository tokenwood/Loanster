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
  const [isError, setIsError] = useState<boolean>(false);
  const provider = useProvider();

  const fetchData = async () => {
    "fetching supply deposits";
    const tokens = await getSupplyDepositIds(provider, props.account);
    setDepositIds(tokens);
  };

  useEffect(() => {
    if (depositIds.length == 0 && !isError) {
      fetchData().catch((error) => {
        console.log(error);
        setIsError(true);
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
