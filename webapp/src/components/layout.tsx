// src/components/layout.tsx
import React, { ReactNode } from "react";
import {
  Text,
  Center,
  Container,
  useColorModeValue,
  Box,
} from "@chakra-ui/react";
import Header from "./header";

type Props = {
  children: ReactNode;
};

//

export function Layout(props: Props) {
  return (
    <div>
      <Box
        layerStyle={"level0"}
        minH={"100vh"}
        bgGradient={"linear(to-r, gray.50, gray.200)"}
      >
        <Header />
        <Container
          maxW={
            "container.lg"
            // typeof window !== "undefined" && window.location.pathname == "/lend"
            //   ? "container.xl"
            //   : "container.lg"
          }
          paddingTop={"10"}
        >
          {props.children}
        </Container>
      </Box>
    </div>
  );
}
