// src/pages/_app.tsx
import { Box, ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import { Layout } from "components/layout";
import theme from "components/Theme";
import "@fontsource/inter";
import "@fontsource/inknut-antiqua";
import { WagmiConfig, createClient } from "wagmi";
import { mainnet, arbitrum, hardhat, goerli, localhost } from "wagmi/chains";
import { ConnectKitProvider, getDefaultClient } from "connectkit";

const client = createClient(
  getDefaultClient({
    appName: "Unilend",
    infuraId: process.env.REACT_APP_INFURA_ID,
    chains: [hardhat, mainnet],
  })
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider theme="soft">
        <ChakraProvider theme={theme}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ChakraProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;
