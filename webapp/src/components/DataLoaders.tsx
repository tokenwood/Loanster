import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { eventEmitter, EventId, EventType } from "libs/eventEmitter";

export interface MakeListItemProps<T> {
  id: T;
  callback: () => any;
}

interface ListLoaderProps<T> {
  fetchData: () => Promise<T[]>;
  makeListItem: (props: MakeListItemProps<T>) => JSX.Element;
  reloadEvents?: EventId[];
}

export default function ListLoader<T>(props: ListLoaderProps<T>) {
  return (
    <DataLoader
      defaultValue={[]}
      fetcher={() => props.fetchData()}
      reloadEvents={props.reloadEvents}
      makeChildren={(childProps: ChildProps<T[]>) => {
        return (
          <VStack>
            {childProps.data.map((id: T) =>
              props.makeListItem({
                id: id,
                callback: childProps.refetchData,
              })
            )}
          </VStack>
        );
      }}
    ></DataLoader>
  );
}

interface TableLoaderProps<T> {
  fetchData: () => Promise<T[]>;
  makeTableRow: (tableData: MakeListItemProps<T>) => JSX.Element;
  makeTableHead?: (tableData: T[]) => JSX.Element;
  makeTableFooter?: (props: T[]) => JSX.Element;
  dataLoaded?: (value: T[]) => any;
  tableCaption?: string;
  reloadEvents?: EventId[];
}

export function TableLoader<T>(props: TableLoaderProps<T>) {
  return (
    <DataLoader
      defaultValue={[]}
      fetcher={() => props.fetchData()}
      reloadEvents={props.reloadEvents}
      dataLoaded={props.dataLoaded}
      makeChildren={(childProps: ChildProps<T[]>) => {
        return (
          <TableContainer>
            <Table variant="simple">
              {props.tableCaption ? (
                <TableCaption>{props.tableCaption}</TableCaption>
              ) : (
                <></>
              )}
              {props.makeTableHead ? (
                <Thead>{props.makeTableHead(childProps.data)}</Thead>
              ) : (
                <></>
              )}
              <Tbody>
                {childProps.data.map((id: T) =>
                  props.makeTableRow({
                    id: id,
                    callback: childProps.refetchData,
                  })
                )}
              </Tbody>
              {props.makeTableFooter ? (
                <Tfoot>{props.makeTableFooter(childProps.data)}</Tfoot>
              ) : (
                <></>
              )}
            </Table>
          </TableContainer>
        );
      }}
    ></DataLoader>
  );
}

export interface ChildProps<T> {
  data: T;
  refetchData: () => any;
}

interface DataLoaderProps<T> {
  defaultValue?: any;
  reloadEvents?: EventId[];
  fetcher: () => Promise<T>;
  makeChildren: (props: ChildProps<T>) => JSX.Element;
  dataLoaded?: (value: T) => any;
}

export function DataLoader<T>(props: DataLoaderProps<T>) {
  const [data, setData] = useState<T>(props.defaultValue);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const fetchData = async () => {
    const tokens = await props.fetcher();
    setIsLoaded(true);
    setIsLoading(false);
    setData(tokens);
    if (props.dataLoaded != undefined) {
      props.dataLoaded(tokens);
    }
  };

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      setIsLoading(true);
      fetchData().catch((error) => {
        console.log(error);
        setIsLoaded(true);
        setIsLoading(false);
      });
    }
  }, [data]);

  useEffect(() => {
    if (props.reloadEvents !== undefined) {
      props.reloadEvents.forEach((eventType: EventId) => {
        eventEmitter.subscribe(eventType, () => {
          fetchData();
        });
      });
    }
    return () => {
      if (props.reloadEvents !== undefined) {
        props.reloadEvents.forEach((eventType: EventId) => {
          eventEmitter.unsubscribe(eventType);
        });
      }
    };
  }, []);

  return isLoaded ? (
    props.makeChildren({
      data: data,
      refetchData: () => {
        fetchData();
      },
    })
  ) : isLoading ? (
    <Box>loading...</Box>
  ) : (
    <Box>error...</Box>
  );
}
