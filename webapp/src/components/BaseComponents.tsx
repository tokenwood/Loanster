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
  HStack,
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
  disconnectedText?: string;
}

export function BasePage(props: PropsWithChildren<BasePageProps>) {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  return (
    <ClientOnly>
      {account ? (
        props.children
      ) : (
        <Box>
          <Box hidden={!isConnecting}>connecting...</Box>
          <Box hidden={!isDisconnected}>
            {props.disconnectedText ?? "Disconnected"}
          </Box>
        </Box>
      )}
    </ClientOnly>
  );
}

interface ContractCallButtonProps {
  contractAddress: Address;
  abi: any;
  functionName: string;
  args?: unknown[];
  hidden?: boolean;
  enabled?: boolean;
  done?: boolean;
  callback: () => any;
  buttonText?: string;
  w?: string;
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

  function isDisabled() {
    return !props.enabled || !writeAsync || isError || isSubmitted;
  }

  return (
    // <VStack>
    <Button
      w={props.w}
      colorScheme={"green"}
      borderRadius={defaultBorderRadius}
      size={DEFAULT_SIZE}
      hidden={props.hidden}
      alignSelf="center"
      // isActive={false}
      isDisabled={isDisabled()}
      onClick={onClick}
      isLoading={isSubmitted}
    >
      {props.buttonText ?? "Confirm"}
    </Button>
    // </VStack>
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
  w?: string;
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
      w={props.w}
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

export interface TabProp {
  action: string;
  onClickView: (data: any, actionFinished: () => any) => ReactNode;
}

export interface BaseViewProps<T> {
  fetcher: () => Promise<T>;
  dataView: (data: T) => ReactNode;
  tabs: TabProp[];
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
  });

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
                    {props.tabs.map((tabProp: TabProp, index) => (
                      <Tab key={index}>{tabProp.action.toUpperCase()}</Tab>
                    ))}
                  </TabList>
                  <TabPanels>
                    {props.tabs.map((tabProp: TabProp, index) => (
                      <TabPanel key={index} paddingBottom={2} paddingX={2}>
                        <Center>
                          {tabProp.onClickView(childProps.data, () => {
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

export interface SimpleViewProps<T> {
  fetcher: () => Promise<T>;
  dataView: (data: T) => ReactNode;
  modalButton: (data: T) => ReactNode;
  reloadEvents?: EventId[];
  tableRowWidthPct?: number;
}

export function SimpleView<T>(props: SimpleViewProps<T>) {
  return (
    <DataLoader
      fetcher={() => props.fetcher()}
      reloadEvents={props.reloadEvents}
      makeChildren={(childProps) => {
        return (
          <HStack w="100%" layerStyle={"level2"} padding={0} spacing={0}>
            <Box w={(props.tableRowWidthPct ?? TABLE_ROW_WIDTH_PCT) + "%"}>
              {props.dataView(childProps.data)}
            </Box>
            <Box
              w={100 - (props.tableRowWidthPct ?? TABLE_ROW_WIDTH_PCT) + "%"}
            >
              <Center>{props.modalButton(childProps.data)}</Center>
            </Box>
          </HStack>
        );
      }}
    ></DataLoader>
  );
}
