import { Box } from "@chakra-ui/react";
import { Address } from "wagmi";

interface LoanProps {
  account: Address;
  loanId: number;
}

export default function Loan(props: LoanProps) {
  return <Box>Loan {props.loanId}</Box>;
}
