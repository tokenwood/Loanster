import { VStack, Heading, Box, Flex } from "@chakra-ui/layout";
import { Address, useContractWrite, usePrepareContractWrite } from "wagmi";
import ClientOnly from "components/clientOnly";
import { Button } from "@chakra-ui/react";
import { DEFAULT_SIZE } from "libs/constants";
import { PropsWithChildren, ReactNode } from "react";

interface BasePageProps {
  account: Address | undefined;
  isConnecting: boolean;
  isDisconnected: boolean;
}

export function BasePage(props: PropsWithChildren<BasePageProps>) {
  return (
    <VStack>
      <Box p={4} w="100%" borderWidth="1px" borderRadius="lg">
        <ClientOnly>
          {props.account ? (
            props.children
          ) : (
            <Box>
              <Box hidden={!props.isConnecting}>connecting...</Box>
              <Box hidden={!props.isDisconnected}>Disconnected</Box>
            </Box>
          )}
        </ClientOnly>
      </Box>
    </VStack>
  );
}

interface ContractCallButtonProps {
  contractAddress: Address;
  abi: any;
  functionName: string;
  args?: unknown[];
  hidden?: boolean;
  enabled?: boolean;
  callback: () => any;
  buttonText?: string;
}

export function ContractCallButton(props: ContractCallButtonProps) {
  const { config, isError } = usePrepareContractWrite({
    address: props.contractAddress,
    abi: props.abi,
    functionName: props.functionName,
    enabled: props.enabled,
    args: props.args,
    onError(error) {
      console.log(error);
    },
  });

  const { writeAsync } = useContractWrite(config);

  async function onClick() {
    try {
      await writeAsync!();
      props.callback();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Button
      colorScheme="green"
      size={DEFAULT_SIZE}
      hidden={props.hidden}
      alignSelf="right"
      isDisabled={!props.enabled || !writeAsync || isError}
      onClick={onClick}
    >
      {props.buttonText ? props.buttonText : "Confirm"}
    </Button>
  );
}
