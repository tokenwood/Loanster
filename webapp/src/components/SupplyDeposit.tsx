import {
  Card,
  CardBody,
  Flex,
  VStack,
  Heading,
  Spacer,
  Button,
  Text,
  Box,
  getToken,
  useBoolean,
} from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { ADDRESS_TO_TOKEN, DEFAULT_SIZE } from "libs/constants";
import {
  DepositInfo,
  getSupplyABI,
  getSupplyAddress,
} from "libs/unilend_utils";
import { getTokenName } from "libs/uniswap_utils";
import { Address, useContractRead } from "wagmi";
import { ContractCallButton } from "./BaseComponents";

interface Props {
  account: `0x${string}`;
  depositId: BigNumber;
  callback: () => any;
}

export default function SupplyDeposit(props: Props) {
  const [isWithdrawing, setIsWithdrawing] = useBoolean();
  const { data: depositInfo, refetch: refetchDepositInfo } = useContractRead({
    address: getSupplyAddress(),
    abi: getSupplyABI(),
    functionName: "getDeposit",
    args: [props.depositId],
    onSuccess(data: DepositInfo) {
      console.log("loaded position info");
    },
  });

  const getHeaderText = (depositInfo: DepositInfo | undefined) => {
    if (depositInfo) {
      return getTokenName(depositInfo.token);
    } else {
      return "not loaded";
    }
  };

  const getBodyText = (depositInfo: DepositInfo | undefined) => {
    if (depositInfo) {
      return ethers.utils.formatUnits(
        depositInfo.amountDeposited,
        ADDRESS_TO_TOKEN[depositInfo.token].decimals
      );
    } else {
      return "";
    }
  };

  return (
    <Card w="100%">
      <CardBody margin="-2">
        <Flex>
          <VStack align={"left"}>
            <Heading size="xs">{getHeaderText(depositInfo)}</Heading>
            <Box>
              <Text>{getBodyText(depositInfo)}</Text>
            </Box>
          </VStack>
          <Spacer />
          <Button
            colorScheme="gray"
            size={DEFAULT_SIZE}
            onClick={setIsWithdrawing.toggle}
            alignSelf="center"
          >
            {isWithdrawing ? "Cancel" : "Withdraw"}
          </Button>
          <ContractCallButton
            contractAddress={getSupplyAddress()}
            abi={getSupplyABI()}
            functionName={"changeAmountDeposited"}
            args={[props.depositId, 0]}
            hidden={!isWithdrawing}
            enabled={isWithdrawing}
            callback={() => {
              refetchDepositInfo();
              props.callback();
            }}
          ></ContractCallButton>
        </Flex>
      </CardBody>
    </Card>
  );
}
