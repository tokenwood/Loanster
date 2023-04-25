import { VStack, Box } from "@chakra-ui/layout";
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
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  Center,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useBoolean,
  useToast,
} from "@chakra-ui/react";
import {
  actionInitColorScheme,
  cancelColorScheme,
  DEFAULT_SIZE,
  tableRowHoverStyle,
} from "components/Theme";
import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import { defaultBorderRadius } from "./Theme";
import { DataLoader } from "./DataLoaders";
import { eventEmitter, EventId } from "libs/eventEmitter";
import { verifyMessage } from "ethers/lib/utils.js";
import { ethers } from "ethers";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { bigNumberString } from "libs/helperFunctions";
import { TABLE_ROW_WIDTH_PCT } from "./DataViews";

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
  const [isSubmitted, setIsSubmitted] = useBoolean(false);
  const { data, config, isError } = usePrepareContractWrite({
    address: props.contractAddress,
    abi: props.abi,
    functionName: props.functionName,
    enabled: props.enabled,
    args: props.args,
  });

  const { writeAsync, isLoading } = useContractWrite(config);

  async function onClick() {
    try {
      const result = await writeAsync!();
      setIsSubmitted.on();
      toast({
        title: "Transaction submitted",
        description: undefined,
        status: "info",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      const confirmed = await result.wait();
      setIsSubmitted.off();
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
        isDisabled={!props.enabled || !writeAsync || isError || isSubmitted}
        onClick={onClick}
      >
        {isSubmitted ? <Spinner /> : props.buttonText ?? "Confirm"}
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

export interface BaseViewProps<T> {
  fetcher: () => Promise<T>;
  dataView: (data: T) => ReactNode;
  actions: ActionProp[];
  level?: number;
  reloadEvents?: EventId[];
  collapseEvents?: EventId[];
}

export function BaseView<T>(props: BaseViewProps<T>) {
  const [accordionIndex, setAccordionIndex] = useState(-1);

  useEffect(() => {
    const eventCallback = () => {
      console.log("setting expanded callback");
      setAccordionIndex(-1);
    };
    if (props.collapseEvents !== undefined) {
      props.collapseEvents.forEach((eventType: EventId) => {
        eventEmitter.subscribe(eventType, eventCallback);
      });
    }
    return () => {
      if (props.collapseEvents !== undefined) {
        props.collapseEvents.forEach((eventType: EventId) => {
          eventEmitter.unsubscribe(eventType, eventCallback);
        });
      }
    };
  }, []);

  return (
    <DataLoader
      fetcher={() => props.fetcher()}
      reloadEvents={props.reloadEvents}
      makeChildren={(childProps) => {
        return (
          <Accordion w={"100%"} allowToggle index={accordionIndex}>
            <AccordionItem
              w="100%"
              layerStyle={props.level ? "level" + props.level : "level3"}
            >
              <AccordionButton
                layerStyle={"level2"}
                padding={0}
                onClick={() => {
                  setAccordionIndex(accordionIndex === 0 ? -1 : 0);
                }}
                _expanded={{
                  borderBottom: "2px",
                  borderBottomColor: "white",
                  borderBottomRadius: 0,
                  _hover: { tableRowHoverStyle },
                }}
              >
                {props.dataView(childProps.data)}
                <AccordionIcon w={100 - TABLE_ROW_WIDTH_PCT + "%"} />
              </AccordionButton>

              <AccordionPanel paddingBottom={2}>
                <Tabs isLazy align="start">
                  <TabList>
                    {props.actions.map((actionProp: ActionProp, index) => (
                      <Tab key={index}>{actionProp.action.toUpperCase()}</Tab>
                    ))}
                  </TabList>
                  <TabPanels>
                    {props.actions.map((actionProp: ActionProp, index) => (
                      <TabPanel key={index} paddingBottom={2} paddingX={2}>
                        <Center>
                          {actionProp.onClickView(childProps.data, () => {
                            childProps.refetchData();
                            console.log("action finished callback");
                          })}
                        </Center>
                      </TabPanel>
                    ))}
                  </TabPanels>
                </Tabs>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
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
