import { VStack, Heading, Box, Flex, HStack, Spacer } from "@chakra-ui/layout";
import {
  Address,
  useContractWrite,
  usePrepareContractWrite,
  useProvider,
  useSignMessage,
  useAccount,
} from "wagmi";
import ClientOnly from "components/clientOnly";
import {
  background,
  Button,
  IconButton,
  Spinner,
  useBoolean,
  useToast,
} from "@chakra-ui/react";
import {
  actionInitColorScheme,
  cancelColorScheme,
  DEFAULT_SIZE,
  headerButtonHoverStyle,
  tableRowHoverStyle,
} from "components/Theme";
import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import { defaultBorderRadius } from "./Theme";
import { DataLoader } from "./DataLoaders";
import { EventId } from "libs/eventEmitter";
import { verifyMessage } from "ethers/lib/utils.js";
import { ethers } from "ethers";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { bigNumberString } from "libs/helperFunctions";

interface BasePageProps {
  width?: string;
}

export function BasePage(props: PropsWithChildren<BasePageProps>) {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  const provider = useProvider();
  return (
    <VStack>
      <Box
        p={4}
        w={props.width ? props.width : "100%"}
        // borderWidth="0px"
        // borderRadius="lg"
        layerStyle={"level1"}
        key={provider.network.name + (account ? account : "")}
      >
        <ClientOnly>
          {account ? (
            props.children
          ) : (
            <Box>
              <Box hidden={!isConnecting}>connecting...</Box>
              <Box hidden={!isDisconnected}>Disconnected</Box>
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
  const toast = useToast();
  const { data, config, isLoading, isError } = usePrepareContractWrite({
    address: props.contractAddress,
    abi: props.abi,
    functionName: props.functionName,
    enabled: props.enabled,
    args: props.args,
  });

  const { writeAsync } = useContractWrite(config);

  async function onClick() {
    try {
      const result = await writeAsync!();
      toast({
        title: "Transaction submitted",
        description: undefined,
        status: "info",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      const confirmed = await result.wait();
      props.callback();
      if (confirmed.status === 1) {
        toast({
          title: "Transaction confirmed",
          description: undefined,
          status: "success",
          position: "bottom-right",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Transaction failed",
          description: undefined,
          status: "error",
          position: "bottom-right",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <VStack>
      <Button
        colorScheme="green"
        borderRadius={defaultBorderRadius}
        size={DEFAULT_SIZE}
        hidden={props.hidden}
        alignSelf="center"
        isDisabled={!props.enabled || !writeAsync || isError}
        onClick={onClick}
      >
        {isLoading ? <Spinner /> : props.buttonText ?? "Confirm"}
      </Button>
    </VStack>
  );
}

interface SignButtonProps {
  message: string;
  callbackData?: any;
  hidden?: boolean;
  enabled?: boolean;
  callback: (
    message: string,
    signature: string,
    account: Address,
    data: any
  ) => any;
  buttonText?: string;
}

export function SignButton(props: SignButtonProps) {
  const provider = useProvider();

  const {
    data: signature,
    isError,
    isLoading,
    signMessage,
  } = useSignMessage({
    onSuccess(data, variables) {
      const address = verifyMessage(variables.message, data);
      props.callback(
        variables.message as string,
        data,
        address as Address,
        props.callbackData
      );
    },
  });

  async function onClick() {
    try {
      signMessage({ message: ethers.utils.arrayify(props.message) });
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Button
      colorScheme="green"
      borderRadius={defaultBorderRadius}
      size={DEFAULT_SIZE}
      hidden={props.hidden}
      alignSelf="center"
      isDisabled={!props.enabled || isLoading || isError}
      onClick={onClick}
    >
      {props.buttonText ? props.buttonText : "Sign"}
    </Button>
  );
}

export interface ActionProp {
  action: string;
  onClickView: (data: any, actionFinished: () => any) => ReactNode;
}

export interface DataViewProps<T> {
  fetcher: () => Promise<T>;
  dataView: (data: T, setExpanded?: (expanded: boolean) => void) => ReactNode;
  actions: ActionProp[];
  level?: number;
  reloadEvents?: EventId[];
}

export function BaseView<T>(props: DataViewProps<T>) {
  const [currentAction, setCurrentAction] = useState<ActionProp>(
    props.actions[0]
  );
  const [expanded, setExpanded] = useState<boolean>(false);

  const setExpandedCallback = (expanded: boolean) => {
    setExpanded(expanded);
  };

  return (
    <DataLoader
      fetcher={() => props.fetcher()}
      reloadEvents={props.reloadEvents}
      makeChildren={(childProps) => {
        return (
          <VStack
            w="100%"
            layerStyle={props.level ? "level" + props.level : "level3"}
            paddingBottom={expanded ? 3 : undefined}
          >
            {props.dataView(childProps.data, setExpandedCallback)}

            {expanded ? (
              <HStack w="100%" paddingLeft={3}>
                {props.actions.map((actionProp: ActionProp) =>
                  actionButton(
                    actionProp,
                    () => {
                      setCurrentAction(actionProp);
                    },
                    currentAction.action == actionProp.action
                  )
                )}
              </HStack>
            ) : (
              <></>
            )}
            {expanded ? (
              currentAction!.onClickView(childProps.data, () => {
                childProps.refetchData();
              })
            ) : (
              <></>
            )}
          </VStack>
        );
      }}
    ></DataLoader>
  );
}

function actionButton(
  actionProp: ActionProp,
  onClick: () => any,
  isCurrentAction: boolean
) {
  return (
    <Button
      key={actionProp.action}
      colorScheme={isCurrentAction ? actionInitColorScheme : cancelColorScheme}
      borderRadius={defaultBorderRadius}
      size={DEFAULT_SIZE}
      onClick={() => onClick()}
      alignSelf="center"
    >
      {actionProp.action}
    </Button>
  );
}
