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
  const provider = useProvider();

  const fetchData = async () => {
    console.log("refreshing positions fetchdata");
    const positionIds = await getPositionIds(props.account, provider);
    setPositionIds(positionIds);
  };

  useEffect(() => {
    if (positionIds.length == 0 && isError == false) {
      fetchData().catch((error) => {
        console.log(error);
        setIsError(true);
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
