import React, { useEffect, useState } from 'react'
import { Text} from '@chakra-ui/react'
import { Box} from "@chakra-ui/layout"
import { useBalance } from 'wagmi'


interface Props {
    account:`0x${string}` | undefined,
    token: `0x${string}` | undefined
}

export default function Balance(props:Props) {
    const [text, setText] = useState<string>('balance not loaded')

    const { data, isError, isLoading, isIdle} = useBalance({
        token: props.token,
        address: props.account,
        onError(error) {
            console.log(error)
            setText('Balance error')
        },
        onSuccess(data) {
            setText('Balance: ' + data.formatted + " " + data.symbol)//{data.formatted} + {data.symbol}
        }
    })

  return (
    <Box>        
        <Text>{text}</Text>
    </Box>
  )

}