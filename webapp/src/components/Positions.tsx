import React, { useEffect, useState } from "react";
import { Box, Text, VStack } from "@chakra-ui/react";
import { useAccount, useProvider } from "wagmi";
import { BigNumber } from "ethers";
import Position from "./Position";
import { getPositionIds } from "libs/uniswap_utils";

interface Props {
  account: `0x${string}`;
}

export default function Positions(props: Props) {
  const [positionIds, setPositionIds] = useState<number[]>([]);
  const [isError, setIsError] = useState<boolean>(false);
  const { address: account } = useAccount();
  const provider = useProvider();

  const fetchData = async () => {
    const positionIds = await getPositionIds(account, provider);
    setPositionIds(positionIds);
  };

  useEffect(() => {
    console.log("useEffect positions");
    if (positionIds.length == 0 && isError == false) {
      fetchData().catch((error) => {
        console.log(error);
        setIsError(true);
      });
    }
  }, [positionIds]);

  const refresh = () => {
    console.log("refreshing positions");
    fetchData();
  };

  return (
    <VStack>
      {positionIds.map((positionId) => (
        <Position
          account={account}
          positionId={BigNumber.from(positionId)}
          callback={refresh}
          key={positionId}
        ></Position>
      ))}
    </VStack>
  );
}
