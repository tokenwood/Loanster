import React, { useEffect, useState, useMemo, useCallback } from "react";
import { VStack } from "@chakra-ui/react";
import { Address, useProvider } from "wagmi";
import { Provider } from "@wagmi/core";
import { getSupplyDepositIds, getSupplyTokens } from "libs/unilend_utils";
import SupplyDeposit from "./SupplyDeposit";
import { BigNumber } from "ethers";

export interface ComponentBuilderProps {
  id: any;
  account: Address;
  callback: () => any;
}

interface Props {
  account: Address;
  fetchIds: (provider: Provider, account: Address) => Promise<any[]>;
  componentBuilder: (props: ComponentBuilderProps) => JSX.Element;
}

export default function IdList(props: Props) {
  const [ids, setIds] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const provider = useProvider();

  const fetchData = async () => {
    const tokens = await props.fetchIds(provider, props.account);
    setIsLoaded(true);
    setIds(tokens);
  };

  useEffect(() => {
    if (!isLoaded) {
      fetchData().catch((error) => {
        console.log(error);
        setIsLoaded(true);
      });
    }
  }, [ids]);

  return (
    <VStack>
      {ids.map((id) =>
        props.componentBuilder({
          id: id,
          account: props.account,
          callback: fetchData,
        })
      )}
    </VStack>
  );
}
