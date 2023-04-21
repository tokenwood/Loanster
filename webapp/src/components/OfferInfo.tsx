import { HStack, VStack, Text } from "@chakra-ui/react";
import { FullOfferInfo } from "libs/backend";
import {
  bigNumberString,
  offerHasEnoughAllowance,
  offerHasEnoughBalance,
} from "libs/helperFunctions";
import { Address, erc20ABI, useProvider } from "wagmi";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { ContractCallButton } from "./BaseComponents";
import { ethers } from "ethers";
import { getSupplyAddress } from "libs/chainUtils";

interface OfferInfoProps {
  fullOfferInfo: FullOfferInfo;
  callback: () => void;
}

export default function OfferInfo(props: OfferInfoProps) {
  const provider = useProvider();

  return (
    <VStack w="100%" alignItems="left" paddingX="4" paddingTop={"2"}>
      <HStack>
        <Check checked={offerHasEnoughAllowance(props.fullOfferInfo)}></Check>
        <Text>
          {"Allowance: " +
            bigNumberString(
              props.fullOfferInfo.allowance,
              props.fullOfferInfo.token
            )}
        </Text>
        {offerHasEnoughAllowance(props.fullOfferInfo) ? null : (
          <ContractCallButton
            contractAddress={props.fullOfferInfo.token.address as Address}
            abi={erc20ABI}
            functionName={"approve"}
            args={[getSupplyAddress(provider), ethers.constants.MaxUint256]}
            enabled={true}
            callback={() => props.callback()}
            buttonText="Approve"
          />
        )}
      </HStack>

      <HStack>
        <Check checked={offerHasEnoughBalance(props.fullOfferInfo)}></Check>
        <Text>
          {"Balance: " +
            (offerHasEnoughBalance(props.fullOfferInfo)
              ? " > "
              : bigNumberString(
                  props.fullOfferInfo.balance,
                  props.fullOfferInfo.token
                ) + " / ") +
            bigNumberString(
              props.fullOfferInfo.offer.amount.sub(
                props.fullOfferInfo.amountBorrowed
              ),
              props.fullOfferInfo.token
            )}
        </Text>
      </HStack>
    </VStack>
  );
}

interface CheckProps {
  checked: boolean;
}

export function Check(props: CheckProps) {
  return props.checked ? (
    <CheckIcon color={"green"} />
  ) : (
    <CloseIcon color="red" />
  );
}
