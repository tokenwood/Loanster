import { VStack, Heading, Box, Flex, HStack, Spacer } from "@chakra-ui/layout";
import {
  Address,
  useContractWrite,
  usePrepareContractWrite,
  useProvider,
  useSignMessage,
} from "wagmi";
import ClientOnly from "components/clientOnly";
import { background, Button, IconButton, useBoolean } from "@chakra-ui/react";
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

interface BasePageProps {
  account: Address | undefined;
  isConnecting: boolean;
  isDisconnected: boolean;
  width?: string;
}

export function BasePage(props: PropsWithChildren<BasePageProps>) {
  return (
    <VStack>
      <Box
        p={4}
        w={props.width ? props.width : "100%"}
        // borderWidth="0px"
        // borderRadius="lg"
        layerStyle={"level1"}
      >
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
    // onError(error) {
    //   console.log(error);
    // },
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
      borderRadius={defaultBorderRadius}
      size={DEFAULT_SIZE}
      hidden={props.hidden}
      alignSelf="center"
      isDisabled={!props.enabled || !writeAsync || isError}
      onClick={onClick}
    >
      {props.buttonText ? props.buttonText : "Confirm"}
    </Button>
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
