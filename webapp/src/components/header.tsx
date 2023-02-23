//src/components/header.tsx
import {
  Flex,
  Button,
  useColorModeValue,
  Spacer,
  Heading,
  Box,
} from "@chakra-ui/react";
import { ConnectKitButton } from "connectkit";
import { ethers } from "ethers";
import Link from "next/link";
import ClientOnly from "./clientOnly";

const siteTitle = "Unilend";

interface Props {
  buttonText: string;
  linkPath: string;
}

function HeaderButton(props: Props) {
  return (
    <Link href={props.linkPath}>
      <Button
        border={
          typeof window !== "undefined"
            ? window.location.pathname == props.linkPath
              ? "1px"
              : undefined
            : undefined
        }
      >
        {props.buttonText}
      </Button>
    </Link>
  );
}

export default function Header() {
  return (
    <ClientOnly>
      <Flex
        as="header"
        bg={useColorModeValue("gray.100", "gray.900")}
        p={4}
        alignItems="center"
      >
        <Box>
          <Heading size="md" mr={4}>
            {siteTitle}
          </Heading>
        </Box>
        <HeaderButton linkPath="/borrow" buttonText="Borrow"></HeaderButton>
        <HeaderButton linkPath="/loans" buttonText="Loans"></HeaderButton>
        <HeaderButton linkPath="/supply" buttonText="Supply"></HeaderButton>
        <HeaderButton linkPath="/market" buttonText="Market"></HeaderButton>
        <Spacer />
        <ConnectKitButton showBalance={false} showAvatar={false} />
      </Flex>
    </ClientOnly>
  );
}
