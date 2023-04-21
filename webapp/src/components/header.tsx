//src/components/header.tsx
import { Flex, Button, Spacer, Image, Box, Text } from "@chakra-ui/react";
import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { useProvider } from "wagmi";
import ClientOnly from "./clientOnly";
import { headerButtonBorderRadius, headerButtonHoverStyle } from "./Theme";

interface Props {
  buttonText: string;
  linkPath: string;
}

function HeaderButton(props: Props) {
  return (
    <Link href={props.linkPath}>
      <Button
        borderRadius={headerButtonBorderRadius}
        _hover={headerButtonHoverStyle}
        // colorScheme="blackAlpha"
        layerStyle={
          typeof window !== "undefined"
            ? window.location.pathname == props.linkPath
              ? "headerButtonSelected"
              : "headerButton"
            : undefined
        }
      >
        {props.buttonText}
      </Button>
    </Link>
  );
}

export default function Header() {
  const provider = useProvider();
  return (
    <ClientOnly>
      <Flex as="header" p={4} alignItems="center" layerStyle={"header"}>
        <Box alignSelf={"center"} alignContent={"center"}>
          <Image src={"loanster_icon.png"} height="40px"></Image>
        </Box>
        <HeaderButton linkPath="/borrow" buttonText="Borrow"></HeaderButton>
        {/* <HeaderButton linkPath="/loans" buttonText="Loans"></HeaderButton> */}
        <HeaderButton linkPath="/lend" buttonText="Lend"></HeaderButton>
        <HeaderButton
          linkPath="/liquidations"
          buttonText="Liquidations"
        ></HeaderButton>
        <Spacer />
        <Text padding={2}>network: {provider.network.name}</Text>
        <ConnectKitButton showBalance={false} showAvatar={false} />
      </Flex>
    </ClientOnly>
  );
}
