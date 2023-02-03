import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Flex,
  HStack,
  NumberInput,
  NumberInputField,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useBoolean } from "@chakra-ui/react";
import { Box } from "@chakra-ui/layout";
import { useBalance } from "wagmi";

interface Props {
  account: `0x${string}` | undefined;
  token: `0x${string}` | undefined;
}

export default function Balance(props: Props) {
  const [text, setText] = useState<string>("balance not loaded");
  const [isDepositing, setIsDepositing] = useBoolean();
  const [value, setValue] = React.useState(0);
  const handleChange = (valueAsString: string, valueAsNumber: number) =>
    setValue(valueAsNumber);

  const { data, isError, isLoading, isIdle } = useBalance({
    token: props.token,
    address: props.account,
    onError(error) {
      console.log(error);
      setText("Balance error");
    },
    onSuccess(data) {
      setText("Balance: " + data.formatted + " " + data.symbol); //{data.formatted} + {data.symbol}
    },
  });

  return (
    <Card>
      <CardBody margin={-2}>
        <Flex>
          {isDepositing ? (
            <HStack>
              <Text>Deposit {data?.symbol}</Text>
              <NumberInput
                value={value}
                onChange={handleChange}
                hidden={!isDepositing}
              >
                <NumberInputField />
              </NumberInput>
            </HStack>
          ) : (
            <Box>
              <Text>{text}</Text>
            </Box>
          )}

          <Spacer />
          <Button
            colorScheme="gray"
            size="xs"
            onClick={setIsDepositing.toggle}
            alignSelf="center"
          >
            {isDepositing ? "Cancel" : "Deposit"}
          </Button>

          <Button
            colorScheme="green"
            size="xs"
            hidden={!isDepositing}
            alignSelf="center"
          >
            Confirm
          </Button>
        </Flex>
      </CardBody>
    </Card>
  );
}
