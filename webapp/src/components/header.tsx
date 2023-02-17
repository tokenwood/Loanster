//src/components/header.tsx
import NextLink from "next/link";
import {
  Flex,
  Button,
  useColorModeValue,
  Spacer,
  Heading,
  Box,
  LinkOverlay,
} from "@chakra-ui/react";
import { ConnectKitButton } from "connectkit";
import Link from "next/link";

const siteTitle = "Unilend";
export default function Header() {
  return (
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
      <Link href="/borrow">
        <Button>Borrow</Button>
      </Link>
      <Link href="/loans">
        <Button>Loans</Button>
      </Link>
      <Link href="/supply">
        <Button>Supply</Button>
      </Link>
      <Link href="/market">
        <Button>Market</Button>
      </Link>

      <Spacer />
      <ConnectKitButton showBalance={false} showAvatar={false} />
    </Flex>
  );
}
