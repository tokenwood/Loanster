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
  makeTableRow: (props: MakeListItemProps<T>) => JSX.Element;
  makeTableHead: () => JSX.Element;
  tableCaption: string;
  reloadEvents?: EventId[];
}

export function TableLoader<T>(props: TableLoaderProps<T>) {
  return (
    <DataLoader
      defaultValue={[]}
      fetcher={() => props.fetchData()}
      reloadEvents={props.reloadEvents}
      makeChildren={(childProps: ChildProps<T[]>) => {
        return (
          <TableContainer>
            <Table variant="simple">
              <TableCaption>{props.tableCaption}</TableCaption>
              <Thead>{props.makeTableHead()}</Thead>
              <Tbody>
                {childProps.data.map((id: T) =>
                  props.makeTableRow({
                    id: id,
                    callback: childProps.refetchData,
                  })
                )}
              </Tbody>
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
