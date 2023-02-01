import React, { useEffect,useState, useMemo } from 'react'
import { Text, Button} from '@chakra-ui/react'
import { Box} from "@chakra-ui/layout"
import { useContractRead, useContractReads} from 'wagmi'
import {nonfungiblePositionManagerABI as managerABI}  from 'abi/NonfungiblePositionManagerABI'
import { erc721ABI } from 'wagmi'
import { BigNumber } from 'ethers'
import { Narrow, ExtractAbiFunctions } from 'abitype'
import PositionInfo from './PositionInfo'

interface Props {
    posManager:`0x${string}` | undefined
    account:`0x${string}` | undefined
}

declare let window: any;

export default function Positions(props:Props) {
    const [text, setText] = useState<string>('positions not loaded')
    const [indexText, setIndexText] = useState<string>('position index not loaded')
    const [numPositions, setNumPositions] = useState<number | undefined>()
    const [positionIndex, setPositionIndex] = useState<number>(0)
    const [positionId, setPositionId] = useState<number | undefined>()

    useEffect(() => {
      console.log("numPositions:" + numPositions)
      setIndexText("index of position " + positionIndex + "/" + numPositions)
      if (numPositions! > 0) {
        refetchPositionId()
      }
      
    }, [numPositions])

    useContractRead({
        address:props.posManager,
        abi: managerABI,
        functionName:'balanceOf',
        args: [props.account?.toString()],
        onSuccess(numPositions: number) {
            setText("Num positions: " + numPositions)
            setNumPositions(numPositions)
        },
        onError(error) {
            
            console.log(error)
            setText('num positions error')
        }
    })

    const {refetch: refetchPositionId} = useContractRead({
        address:props.posManager,
        abi: managerABI,
        functionName:'tokenOfOwnerByIndex',
        args: [props.account, positionIndex!],
        enabled: false,
        onSuccess(tokenId: number) {
          console.log("success")
          setPositionId(tokenId)
        },
        onError(error) {
          console.log("hello")
          console.log(error)
          setIndexText('index error')
        }
    })

    

    // const handleClick = async () => {
    //     const res = refetchNumPositions()
    //     console.log(`Greeting: ${res}`)
    //   }

  return (
    <Box>        
        <Text>{text}</Text>
        <Text>{indexText}</Text>
        {positionId? <PositionInfo posManager={props.posManager} account={props.account} positionId={positionId}></PositionInfo> : <Text>no position info</Text>}
        {/* <Button onClick={handleClick}>RELOAD</Button> */}
    </Box>
  )

}