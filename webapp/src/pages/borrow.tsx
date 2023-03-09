import { Box, HStack } from "@chakra-ui/layout";
import {
  Heading,
  Select,
  Table,
  TableContainer,
  Tbody,
  Th,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { BasePage } from "components/BaseComponents";
import { ChildProps, DataLoader, TableLoader } from "components/DataLoaders";
import { BorrowInputs, LoanTroveInput } from "components/DepositInputs";
import { BigNumber, ethers } from "ethers";
import { ADDRESS_TO_TOKEN } from "libs/constants";
import {
  getLoans,
  getLoanStats,
  getNewTroveStats,
  LoanParameters,
  LoanStats,
  TroveStats,
} from "libs/market_utils";

import { useState } from "react";
import { useAccount, useProvider } from "wagmi";

export default function BorrowPage() {
  const { address: account, isConnecting, isDisconnected } = useAccount();
  const provider = useProvider();
  const [loanParams, setLoanParams] = useState<LoanParameters>();
  const [loanStats, setLoanStats] = useState<LoanStats>();
  const [troveId, setTroveId] = useState<number>();

  function isValidLoanParams(loanParams: LoanParameters | undefined) {
    if (loanParams == undefined) {
      return false;
    }
    return loanParams.amount > 0 && loanParams.tokenAddress != undefined;
  }

  function showTroveStats(
    loanStats: LoanStats | undefined,
    troveId: number | undefined
  ) {
    return troveId != undefined && loanStats != undefined;
  }

  return (
    <BasePage
      account={account}
      isConnecting={isConnecting}
      isDisconnected={isDisconnected}
    >
      <HStack w="100%" alignItems="start" spacing="5">
        <VStack align="left" spacing="4" w="50%">
          <Box>
            <Heading as="h6" size="sm" mb="3">
              Borrow
            </Heading>
            <BorrowInputs
              account={account!}
              callback={(params) => {
                // console.log("setting loan params");
                setLoanParams(params);
              }}
            ></BorrowInputs>
          </Box>

          {isValidLoanParams(loanParams) ? (
            <TableLoader
              key={loanParams?.amount! + loanParams?.tokenAddress!} //todo hash loanParms
              fetchData={() => getLoans(provider, loanParams!)}
              dataLoaded={(tableData) => {
                setLoanStats(getLoanStats(tableData));
              }}
              makeTableHead={() => {
                return (
                  <Tr>
                    <Th isNumeric>deposit id</Th>
                    <Th isNumeric>
                      {ADDRESS_TO_TOKEN[loanParams!.tokenAddress].symbol}
                    </Th>
                    <Th isNumeric>Rate</Th>
                    <Th isNumeric>Min Duration</Th>
                  </Tr>
                );
              }}
              makeTableRow={(props) => {
                return (
                  <Tr key={props.id[0].depositId}>
                    <Th isNumeric>{props.id[0].depositId}</Th>
                    <Th isNumeric>
                      {ethers.utils.formatUnits(
                        props.id[1],
                        props.id[0].token.decimals
                      )}
                    </Th>
                    <Th isNumeric>
                      {props.id[0].depositInfo.interestRateBPS.toNumber() /
                        100 +
                        " %"}
                    </Th>
                    <Th isNumeric>
                      {props.id[0].depositInfo.minLoanDuration.toNumber()}
                    </Th>
                  </Tr>
                );
              }}
              makeTableFooter={(tableData) => {
                const loanStats = getLoanStats(tableData);
                return (
                  <Tr borderTopColor={"gray.500"} borderTopWidth={"1.5px"}>
                    <Th isNumeric>{"total"}</Th>
                    <Th isNumeric>
                      {ethers.utils.formatUnits(
                        loanStats.amount,
                        tableData[0][0].token.decimals // what if empty array?
                      )}
                    </Th>
                    <Th isNumeric>{loanStats.rate.toNumber() / 100 + " %"}</Th>
                    <Th isNumeric>todo</Th>
                  </Tr>
                );
              }}
            ></TableLoader>
          ) : (
            <></>
          )}
        </VStack>
        <VStack w="50%" spacing={0}>
          <Box w="100%">
            <Heading textAlign={"right"} size="sm" mb="3" w="100%">
              In Trove
            </Heading>
          </Box>
          <LoanTroveInput
            account={account!}
            callback={(troveId: number) => {
              setTroveId(troveId);
            }}
          ></LoanTroveInput>

          {showTroveStats(loanStats, troveId) ? (
            <DataLoader
              fetcher={() => {
                return getNewTroveStats(provider, loanStats!, troveId!);
              }}
              makeChildren={(childProps) => {
                return (
                  <TableContainer w="100%">
                    <Table variant="simple">
                      <Tbody>
                        <Tr>
                          <Th>Collateral value</Th>
                          <Th isNumeric>
                            {childProps.data.collateralValueEth.toNumber()}
                          </Th>
                        </Tr>
                        <Tr>
                          <Th>Loan value</Th>
                          <Th isNumeric>
                            {childProps.data.loanValueEth.toNumber()}
                          </Th>
                        </Tr>
                        <Tr>
                          <Th>Health factor</Th>
                          <Th isNumeric>{childProps.data.healthFactor}</Th>
                        </Tr>
                        <Tr>
                          <Th>Liquidation price</Th>
                          <Th isNumeric>todo</Th>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                );
              }}
            ></DataLoader>
          ) : (
            <></>
          )}
        </VStack>
      </HStack>
    </BasePage>
  );
}
