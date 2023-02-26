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
import { ADDRESS_TO_TOKEN } from "libs/constants";
import { DEFAULT_SIZE } from "components/Theme";
import {
  DepositInfo,
  getSupplyABI,
  getSupplyAddress,
} from "libs/unilend_utils";
import { getTokenName } from "libs/uniswap_utils";
import { Address, useContractRead } from "wagmi";
import { ContractCallButton } from "./BaseComponents";
import {
  actionInitColorScheme,
  defaultBorderRadius,
  headerButtonHoverStyle,
  level2BorderColor,
} from "./Theme";

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
    <Card w="100%" layerStyle={"level2"} borderColor={level2BorderColor}>
      <CardBody margin="-2">
        <Flex>
          <VStack align={"left"}>
            <Heading size="xs" layerStyle={"level2"} border={0}>
              {getHeaderText(depositInfo)}
            </Heading>
            <Box layerStyle={"level2"} border={0}>
              <Text>{getBodyText(depositInfo)}</Text>
            </Box>
          </VStack>
          <Spacer />
          <Button
            colorScheme={actionInitColorScheme}
            borderRadius={defaultBorderRadius}
            // backgroundColor={"blue.600"}
            // _hover={headerButtonHoverStyle}
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
