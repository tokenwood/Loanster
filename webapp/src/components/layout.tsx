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
        h={"100%"}
        bgGradient={"linear(to-br, gray.150, #FFFFFF)"}
      >
        <Header />
        <Container maxW="container.lg" py="20">
          {props.children}
        </Container>
      </Box>
    </div>
  );
}
