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
import { defaultBorderRadius, DEFAULT_SIZE } from "components/Theme";

interface TokenAmountInputProps {
  balanceData: FetchBalanceResult;
  callback: (amount: BigNumber) => any;
}

interface DateInputProps {
  callback: (timestamp: number) => any;
}

export function TokenAmountInput(props: TokenAmountInputProps) {
  const [value, setValue] = useState<string>("0.0");
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
    <Flex w="100%" layerStyle={"level3"}>
      <Text alignSelf={"center"}>{props.balanceData.symbol} amount</Text>
      <Button
        ml="10px"
        size={"xs"}
        colorScheme={"blue"}
        onClick={onMaxClicked}
        alignSelf="center"
      >
        Max
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
        <NumberInputField textAlign={"right"} border={0} />
      </NumberInput>
    </Flex>
  );
}

export function DateInput(props: DateInputProps) {
  const [value, setValue] = useState<string>();

  return (
    <Flex w="100%">
      <Text alignSelf="center">Expiration</Text>
      <Spacer />

      <Input
        placeholder="Select Expiration Date"
        size="md"
        type="date"
        w="30%"
        // margin="10px"
      />
    </Flex>
  );
}
