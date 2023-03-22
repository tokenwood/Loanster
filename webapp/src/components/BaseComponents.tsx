import { VStack, Heading, Box, Flex, HStack } from "@chakra-ui/layout";
import {
  Address,
  useContractWrite,
  usePrepareContractWrite,
  useProvider,
  useSignMessage,
} from "wagmi";
import ClientOnly from "components/clientOnly";
import { Button } from "@chakra-ui/react";
import {
  actionInitColorScheme,
  cancelColorScheme,
  DEFAULT_SIZE,
} from "components/Theme";
import { PropsWithChildren, ReactNode, useState } from "react";
import { defaultBorderRadius } from "./Theme";
import { DataLoader } from "./DataLoaders";
import { EventId } from "libs/eventEmitter";
import { verifyMessage } from "ethers/lib/utils.js";

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
      signMessage({ message: props.message });
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
  dataView: (data: T) => ReactNode;
  actions: ActionProp[];
  level?: number;
  reloadEvents?: EventId[];
}

export function BaseView<T>(props: DataViewProps<T>) {
  const [currentAction, setCurrentAction] = useState<ActionProp>();
  return (
    <DataLoader
      // defaultValue={}
      fetcher={() => props.fetcher()}
      reloadEvents={props.reloadEvents}
      makeChildren={(childProps) => {
        return (
          <VStack
            w="100%"
            layerStyle={props.level ? "level" + props.level : "level3"}
            padding="3"
          >
            {props.actions.length == 1 ? (
              <HStack w="100%">
                {props.dataView(childProps.data)}
                {actionButton(
                  props.actions[0],
                  () => {
                    currentAction == props.actions[0]
                      ? setCurrentAction(undefined)
                      : setCurrentAction(props.actions[0]);
                  },
                  currentAction == props.actions[0]
                )}
              </HStack>
            ) : (
              props.dataView(childProps.data)
            )}
            {props.actions.length > 1 ? (
              <HStack w="100%">
                {props.actions.map((actionProp: ActionProp) =>
                  actionButton(
                    actionProp,
                    () => {
                      currentAction == actionProp
                        ? setCurrentAction(undefined)
                        : setCurrentAction(actionProp);
                    },
                    currentAction == actionProp
                  )
                )}
              </HStack>
            ) : (
              <></>
            )}
            {currentAction !== undefined ? (
              currentAction!.onClickView(childProps.data, () => {
                setCurrentAction(undefined);
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
      colorScheme={isCurrentAction ? cancelColorScheme : actionInitColorScheme}
      borderRadius={defaultBorderRadius}
      size={DEFAULT_SIZE}
      onClick={() => onClick()}
      alignSelf="center"
    >
      {isCurrentAction ? "Cancel" : actionProp.action}
    </Button>
  );
}
