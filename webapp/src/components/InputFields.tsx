import React, { useState } from "react";
import {
  Button,
  Flex,
  Input,
  NumberInput,
  NumberInputField,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { floatToBigNumber } from "libs/unilend_utils";
import { FetchBalanceResult } from "@wagmi/core";
import { ethers } from "ethers";
import { DEFAULT_SIZE } from "libs/constants";

interface TokenAmountInputProps {
  balanceData: FetchBalanceResult;
  callback: (amount: BigNumber) => any;
}

interface DateInputProps {
  callback: (timestamp: number) => any;
}

export function TokenAmountInput(props: TokenAmountInputProps) {
  const [value, setValue] = useState<string>();
  const onMaxClicked = () => {
    props.callback(props.balanceData.value);
    setValue(
      ethers.utils.formatUnits(
        props.balanceData.value,
        props.balanceData.decimals
      )
    );
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
        floatToBigNumber(valueAsNumber.toString(), props.balanceData.decimals)
      );
    }
    setValue(valueAsString);
  };

  return (
    <Flex w="100%">
      <Text> {props.balanceData.symbol} amount:</Text>
      <Spacer />
      <Button size={DEFAULT_SIZE} colorScheme={"blue"} onClick={onMaxClicked}>
        Max
      </Button>
      <NumberInput
        value={value}
        size={DEFAULT_SIZE}
        onChange={numberChanged}
        hidden={false}
      >
        <NumberInputField textAlign={"right"} />
      </NumberInput>
    </Flex>
  );
}

export function DateInput(props: DateInputProps) {
  const [value, setValue] = useState<string>();

  return (
    <Flex w="100%">
      <Text> Expiration </Text>
      <Spacer />

      <Input
        placeholder="Select Expiration Date"
        size="md"
        type="date"
        w="30%"
      />
    </Flex>
  );
}
