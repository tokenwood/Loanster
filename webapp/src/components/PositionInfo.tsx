import React, { useEffect,useState, useMemo } from 'react'
import { Text, Button} from '@chakra-ui/react'
import { Box} from "@chakra-ui/layout"
import { useContractRead, useContractReads} from 'wagmi'
import {nonfungiblePositionManagerABI as managerABI}  from 'abi/NonfungiblePositionManagerABI'
import { PositionInfo, getTokenName} from 'utils/uni_utils'

// import {PositionInfo} from "@uniswap/lib/liquidity"


interface Props {
    posManager:`0x${string}` | undefined
    account:`0x${string}` | undefined
    positionId: number
}

export default function Positions(props:Props) {

    const [text, setText] = useState<string>('position info')

    const { data: positionInfo, refetch: refetchPositionInfo} = useContractRead({
        address:props.posManager,
        abi: managerABI,
        functionName:'positions',
        args: [props.positionId],
        enabled: true,
        onSuccess(positionInfo: PositionInfo) {
            console.log(positionInfo)
            setText("tokens: " + getTokenName(positionInfo.token0) + " / " + getTokenName(positionInfo.token1) + " liquidity: " + positionInfo.liquidity)
        },
        onError(error) {
            console.log("error fetching positionInfo")
            console.log(error)
        }
    })

    return (
        <Box>        
            <Text>{text}</Text>
        </Box>
      )    

}