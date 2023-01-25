// src/pages/_app.tsx
import { ChakraProvider } from '@chakra-ui/react'
import type { AppProps } from 'next/app'
import { Layout } from 'components/layout'

import { WagmiConfig, createClient } from 'wagmi';
import { mainnet, arbitrum, hardhat , goerli} from 'wagmi/chains';
import { ConnectKitProvider, getDefaultClient } from 'connectkit';


const client = createClient(
  getDefaultClient({
    appName: 'ConnectKit CRA demo',
    infuraId: process.env.REACT_APP_INFURA_ID,
    //alchemyId:  process.env.REACT_APP_ALCHEMY_ID,
    chains: [mainnet, hardhat, goerli],
  })
);


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider theme="soft">
        <ChakraProvider>
          <Layout>
          <Component {...pageProps} />
          </Layout>
        </ChakraProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  )
}

export default MyApp