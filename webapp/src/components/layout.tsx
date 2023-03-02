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

// bgGradient={"linear(to-b, #Fdfcfa, #F7f3ec)"}

export function Layout(props: Props) {
  return (
    <div>
      <Box layerStyle={"level0"} h={"100%"}>
        <Header />
        <Container maxW="container.md" py="20">
          {props.children}
        </Container>
      </Box>
    </div>
  );
}
