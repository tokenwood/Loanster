import React, { useEffect, useState } from "react";
import { Text, VStack } from "@chakra-ui/react";
import { useProvider } from "wagmi";
import { BigNumber } from "ethers";
import Position from "./Position";
import { getPositionIds } from "libs/uniswap_utils";

interface Props {
  account: `0x${string}` | undefined;
}

export default function Positions(props: Props) {
  const [positionIds, setPositionIds] = useState<number[]>([]);
  const provider = useProvider();

  const fetchData = async () => {
    const positionIds = await getPositionIds(props.account, provider);
    setPositionIds(positionIds);
  };

  useEffect(() => {
    console.log("useEffect positions");
    if (positionIds.length == 0) {
      fetchData().catch(console.error);
    }
  }, [positionIds]);

  const refresh = () => {
    console.log("refreshing positions");
    fetchData();
  };

  return (
    <VStack>
      {props.account ? (
        positionIds.map((positionId) => (
          <Position
            account={props.account}
            positionId={BigNumber.from(positionId)}
            callback={refresh}
            key={positionId}
          ></Position>
        ))
      ) : (
        <Text> not connected </Text>
      )}
    </VStack>
  );
}
