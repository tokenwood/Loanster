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
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const provider = useProvider();

  const fetchData = async () => {
    const positionIds = await getPositionIds(props.account, provider);
    setPositionIds(positionIds);
    setIsLoaded(true);
  };

  useEffect(() => {
    if (positionIds.length == 0 && isLoaded == false) {
      fetchData().catch((error) => {
        console.log(error);
        setIsLoaded(true);
      });
    }
  }, [positionIds]);

  return (
    <VStack>
      {positionIds.map((positionId) => (
        <Position
          account={props.account}
          positionId={BigNumber.from(positionId)}
          callback={fetchData}
          key={positionId}
        ></Position>
      ))}
    </VStack>
  );
}
