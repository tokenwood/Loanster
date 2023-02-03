import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Text, Button, Heading } from '@chakra-ui/react'
import { Box } from "@chakra-ui/layout"
import { useContractRead } from 'wagmi'
import { nonfungiblePositionManagerABI as managerABI } from 'abi/NonfungiblePositionManagerABI'
import { BigNumber } from 'ethers'
import PositionInfoComponent from './PositionInfoComponent'
import { PositionInfo } from 'utils/uni_utils'

interface Props {
  posManager: `0x${string}` | undefined
  account: `0x${string}` | undefined
}

export default function Positions(props: Props) {
  const [text, setText] = useState<string>('positions not loaded')
  const [positionIds, setPositionIds] = useState<number[]>([])

  useContractRead({
    address: props.posManager,
    abi: managerABI,
    functionName: 'balanceOf',
    args: [props.account?.toString()],
    onSuccess(data: BigNumber) {
      let numPositionsValue = +data
      setText("Num positions: " + numPositionsValue)
      setPositionIds(Array.from(Array(numPositionsValue).keys())
      )
    },
    onError(error) {
      console.log(error)
      setText('num positions error')
    }
  })

  return (
    <Box>
      {positionIds.map((s, i) => (
        <PositionInfoFromIndex account={props.account} posManager={props.posManager} index={i} key={i}></PositionInfoFromIndex>
      ))}
    </Box>
  )

}

interface PositionInfoFromIndexProps {
  posManager: `0x${string}` | undefined
  account: `0x${string}` | undefined
  index: number
}

function PositionInfoFromIndex(props: PositionInfoFromIndexProps) {

  const { data: positionId, isLoading } = useContractRead({
    address: props.posManager,
    abi: managerABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [props.account, props.index],
    onSuccess(data: BigNumber) {
      console.log("loaded position with index " + props.index)
    },
    onError(error) {
      console.log(error)
    }
  })

  return (
    positionId ? <PositionInfoComponent posManager={props.posManager} account={props.account} positionId={positionId}></PositionInfoComponent> : <Text>loading...</Text>
  )
}