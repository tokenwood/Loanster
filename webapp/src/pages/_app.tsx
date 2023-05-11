// src/pages/_app.tsx
import { Box, ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import { Layout } from "components/layout";
import theme from "components/Theme";
import "@fontsource/inter";
import "@fontsource/inknut-antiqua";
import { WagmiConfig, createClient, Chain } from "wagmi";

import { ConnectKitProvider, getDefaultClient } from "connectkit";
import { getChains } from "libs/helperFunctions";

const client = createClient(
  getDefaultClient({
    appName: "Loanster",
    infuraId: process.env.NEXT_PUBLIC_REACT_APP_INFURA_ID,
    chains: getChains(),
  })
);

function MyApp({ Component, pageProps }: AppProps) {
  // console.log("infura id: ", process.env.NEXT_PUBLIC_REACT_APP_INFURA_ID);
  // console.log("chains: ", process.env.NEXT_PUBLIC_CHAIN_IDS?.split(","));
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
