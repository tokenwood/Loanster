import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Input,
  NumberInput,
  NumberInputField,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { floatToBigNumber } from "libs/helperFunctions";
import { ethers } from "ethers";
import { defaultBorderRadius, DEFAULT_SIZE } from "components/Theme";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import { Token } from "@uniswap/sdk-core";

// https://github.com/vercel/next.js/discussions/19166
// import DatePicker from "react-date-picker";

interface TokenAmountInputProps {
  token: Token;
  balance: BigNumber;
  text?: string;
  defaultValue?: string;
  buttonText?: string;
  buttonValue?: string;
  callback: (amount: BigNumber) => any;
}

export function TokenAmountInput(props: TokenAmountInputProps) {
  const [value, setValue] = useState<string>(props.defaultValue ?? "");
  const onMaxClicked = () => {
    const newValueString =
      props.buttonValue ??
      ethers.utils.formatUnits(props.balance, props.token.decimals);

    setValue(newValueString);
    props.callback(BigNumber.from(newValueString));
  };

  const numberChanged = (valueAsString: string, valueAsNumber: number) => {
    valueAsString = valueAsString.replace("e", "");
    valueAsString = valueAsString.replace("E", "");
    if (valueAsString.split(".").length > 2) {
      valueAsString = valueAsString.split(".").slice(0, 2).join(".");
    }
    if (valueAsString == "") {
      props.callback(BigNumber.from(0));
    } else {
      props.callback(
        floatToBigNumber(valueAsNumber.toString(), props.token.decimals)
      );
    }
    setValue(valueAsString);
  };

  return (
    <Flex w="100%">
      <Text alignSelf={"center"} ml="0">
        {props.text ? props.text : props.token.symbol + " Amount"}
      </Text>
      <Button
        ml="10px"
        size={"xs"}
        colorScheme={"blue"}
        onClick={onMaxClicked}
        alignSelf="center"
      >
        {props.buttonText ?? "Max"}
      </Button>
      <Spacer />

      <NumberInput
        value={value}
        size={DEFAULT_SIZE}
        onChange={numberChanged}
        hidden={false}
        border="0"
        focusBorderColor="transparent"
      >
        <NumberInputField
          textAlign={"right"}
          border={0}
          padding={1}
          textStyle={"numberInput"}
          fontSize={"xl"}
          placeholder={"0.0"}
        />
      </NumberInput>
    </Flex>
  );
}

interface MyNumberInputProps {
  name: string;
  callback: (amount: number) => any;
  buttons?: [string, string][];
  precision?: number;
  placeHolder?: string;
}

export function MyNumberInput(props: MyNumberInputProps) {
  const [value, setValue] = useState<string>("");

  const numberChanged = (valueAsString: string, valueAsNumber: number) => {
    valueAsString = valueAsString.replace("e", "");
    valueAsString = valueAsString.replace("E", "");
    valueAsString = valueAsString.replace("+", "");
    valueAsString = valueAsString.replace("-", "");

    if (valueAsString.split(".").length > 2) {
      valueAsString = valueAsString.split(".").slice(0, 2).join(".");
    }
    if (valueAsString == "") {
      props.callback(0);
    } else {
      props.callback(parseFloat(valueAsString));
    }
    setValue(valueAsString);
  };

  return (
    <Flex w="100%">
      <Text alignSelf={"center"} ml="0">
        {props.name}
      </Text>
      {props.buttons?.map(([name, value]) => {
        return (
          <Button
            ml="10px"
            size={"xs"}
            colorScheme={"blue"}
            onClick={() => {
              numberChanged(value, 0);
            }}
            alignSelf="center"
          >
            {name}
          </Button>
        );
      })}
      <Spacer />

      <NumberInput
        value={value}
        size={DEFAULT_SIZE}
        onChange={numberChanged}
        focusBorderColor="transparent"
        precision={props.precision !== undefined ? props.precision : undefined}
      >
        <NumberInputField
          textAlign={"right"}
          border={0}
          padding={1}
          textStyle={"numberInput"}
          fontSize={"xl"}
          placeholder={
            props.placeHolder !== undefined ? props.placeHolder : "0.0"
          }
        />
      </NumberInput>
    </Flex>
  );
}

interface DateInputProps {
  name: string;
  callback: (timestamp: number) => any;
}

//todo make text input of format yyyy-mm-dd
export function DateInput(props: DateInputProps) {
  const [date, setDate] = useState(initDate());
  // const [value, setValue] = useState<string>(date.toISOString());

  useEffect(() => {
    props.callback(date.getTime());
    console.log("date: " + date.getTime());
  }, [date]);

  return (
    <Flex w="100%">
      <Text alignSelf="center">{props.name}</Text>
      <Spacer />

      {/* <Input value={value}></Input> */}

      <Box color={"black"} bgColor="white" borderRadius={defaultBorderRadius}>
        <SingleDatepicker
          name="date-input"
          date={date}
          onDateChange={(newDate: Date) => {
            setDate(newDate);
            console.log("new date: " + newDate.toISOString());
            console.log("new date timestamp: " + newDate.getTime());
          }}
        />
      </Box>
    </Flex>
  );
}

function initDate() {
  const dateCopy = new Date(new Date().getTime() + 60 * 60 * 24 * 7 * 1000);

  return dateCopy;
}
