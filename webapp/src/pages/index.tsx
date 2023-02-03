// src/pages/index.tsx
import type { NextPage } from 'next'
import Head from 'next/head'
import NextLink from "next/link"
import { VStack, Heading, Box, LinkOverlay, LinkBox } from "@chakra-ui/layout"
import { Text, Button } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { useAccount } from "wagmi"
import Balance from 'components/Balance'
import Positions from 'components/Positions'

import { NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS as posManager } from 'utils/constants'

declare let window: any

const Home: NextPage = () => {
  const { address: account, isConnecting, isDisconnected } = useAccount()

  return (
    <>
      <Head>
        <title>Unilend</title>
      </Head>

      <VStack>

        <Box mb={0} p={4} w='100%' borderWidth="1px" borderRadius="lg">

          <VStack spacing={'5'} align='left'>
            <Heading my={1} fontSize='xl'>Account info</Heading>

            <Heading as='h6' size='sm'>{"Supply Tokens"}</Heading>
            <Balance
              account={account}
              token='0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
            />

            <Heading as='h6' size='sm'>{"Positions"}</Heading>
            <Positions
              posManager={posManager}
              account={account} />
          </VStack>
        </Box>


      </VStack>
    </>
  )
}

export default Home
