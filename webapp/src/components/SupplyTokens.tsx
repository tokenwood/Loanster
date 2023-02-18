import React, { useEffect, useState, useMemo, useCallback } from "react";
import { VStack } from "@chakra-ui/react";
import { Box } from "@chakra-ui/layout";
import { Address, useProvider } from "wagmi";
import Balance from "./SupplyToken";
import { getSupplyTokens } from "libs/unilend_utils";

interface Props {
  account: Address;
}

export default function Balances(props: Props) {
  const [supplyTokens, setSupplyTokens] = useState<Address[]>([]);
  const provider = useProvider();

  useEffect(() => {
    const fetchData = async () => {
      const tokens = await getSupplyTokens(provider);
      setSupplyTokens(tokens);
    };

    if (supplyTokens.length == 0) {
      fetchData().catch(console.error);
    }
  }, [supplyTokens]);

  return (
    <VStack>
      {supplyTokens.length > 0 ? (
        supplyTokens.map((tokenAddress, i) => (
          <Balance
            account={props.account}
            tokenAddress={tokenAddress}
            key={tokenAddress}
          />
        ))
      ) : (
        <Box>
          <Box> supply tokens not loaded </Box>
        </Box>
      )}
    </VStack>
  );
}
