//src/components/header.tsx
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Flex,
  Button,
  Spacer,
  Image,
  Box,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Select,
} from "@chakra-ui/react";
import { ConnectKitButton } from "connectkit";
import { switchNetwork } from "@wagmi/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useProvider, useClient } from "wagmi";
import ClientOnly from "./clientOnly";
import { headerButtonBorderRadius, headerButtonHoverStyle } from "./Theme";
import { getChains } from "libs/helperFunctions";

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
  const [chainId, setChainId] = useState<number>(getDefaultChainId);

  useEffect(() => {
    console.log("chainId changed to " + chainId);
  }, [chainId]);

  function getDefaultChainId() {
    if (provider.network.chainId) {
      return provider.network.chainId;
    } else {
      return getChains()[0].id;
    }
  }

  async function changeNetwork(chainId: number) {
    try {
      const chain = await switchNetwork({
        chainId: chainId,
      });

      setChainId(chain.id);
    } catch (e) {
      console.log("error switching network", e);
    }
  }

  return (
    <ClientOnly>
      <Flex as="header" p={4} alignItems="center" layerStyle={"header"}>
        <Box alignSelf={"center"} alignContent={"center"}>
          <Image
            src={"loanster_icon.png"}
            height="40px"
            alt="Loanster icon"
          ></Image>
        </Box>
        <HeaderButton linkPath="/borrow" buttonText="Borrow"></HeaderButton>
        {/* <HeaderButton linkPath="/loans" buttonText="Loans"></HeaderButton> */}
        <HeaderButton linkPath="/lend" buttonText="Lend"></HeaderButton>
        <HeaderButton
          linkPath="/marketplace"
          buttonText="Marketplace"
        ></HeaderButton>
        <HeaderButton
          linkPath="/governance"
          buttonText="Governance"
        ></HeaderButton>
        <Spacer />
        <Select // todo show network names when account not connected
          w="4xs"
          key={provider.network.chainId}
          padding={2}
          onChange={(event) => {
            changeNetwork(parseInt(event.target.value));
          }}
          value={chainId}
          layerStyle={"level1"}
          borderRadius={headerButtonBorderRadius}
        >
          {getChains().map((value) => {
            return (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            );
          })}
        </Select>
        <ConnectKitButton showBalance={false} showAvatar={false} />
      </Flex>
    </ClientOnly>
  );
}
