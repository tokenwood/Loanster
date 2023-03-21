import {
  Flex,
  Grid,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Token } from "@uniswap/sdk-core";
import { BigNumber, ethers } from "ethers";
import {
  formatDate,
  // FullDepositInfo,
  // getAmountLoanedForDepositInfo,
  getTokenName,
} from "libs/unilend_utils";
import { statFontSize } from "./Theme";

interface TokenBalanceViewProps {
  amount: BigNumber;
  token: Token;
}

export function TokenBalanceView(props: TokenBalanceViewProps) {
  return (
    <Flex w="100%">
      <Text>
        {parseFloat(
          ethers.utils.formatUnits(props.amount, props.token.decimals)
        ).toFixed(2) +
          " " +
          props.token.symbol}
      </Text>
      <Spacer />
    </Flex>
  );
}

// interface DepositViewProps {
//   data: FullDepositInfo;
// }

// export function DepositView(props: DepositViewProps) {
//   return (
//     <Flex w="100%">
//       <Stat>
//         <StatLabel>{getTokenName(props.data.depositInfo.token)}</StatLabel>
//         <StatNumber fontSize={statFontSize}>
//           {ethers.utils.formatUnits(
//             props.data.depositInfo.amountDeposited,
//             props.data.token.decimals
//           )}
//         </StatNumber>
//       </Stat>
//       <Stat>
//         <StatLabel>Claimable</StatLabel>
//         <StatNumber fontSize={statFontSize}>
//           {ethers.utils.formatUnits(
//             props.data.depositInfo.claimableInterest,
//             props.data.token.decimals
//           )}
//         </StatNumber>
//       </Stat>
//       <Stat>
//         <StatLabel>Loaned</StatLabel>
//         <StatNumber fontSize={statFontSize}>
//           {ethers.utils.formatUnits(
//             getAmountLoanedForDepositInfo(props.data),
//             props.data.token.decimals
//           )}
//         </StatNumber>
//       </Stat>
//       <Stat>
//         <StatLabel>Interest rate</StatLabel>
//         <StatNumber fontSize={statFontSize}>
//           {props.data.depositInfo.interestRateBPS.toNumber() / 100 + " %"}
//         </StatNumber>
//       </Stat>
//       <Stat>
//         <StatLabel>Min/max duration</StatLabel>
//         <StatNumber fontSize={statFontSize}>
//           {props.data.depositInfo.minLoanDuration +
//             "d / " +
//             props.data.depositInfo.maxLoanDuration +
//             "d"}
//         </StatNumber>
//       </Stat>

//       <Stat>
//         <StatLabel>Expiration date</StatLabel>
//         <StatNumber fontSize={statFontSize}>
//           {formatDate(props.data.depositInfo.expiration)}
//         </StatNumber>
//       </Stat>
//     </Flex>
//   );
// }
