import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  Text,
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
  index: number;
  callback: () => any;
}

interface ListLoaderProps<T> {
  fetchData: () => Promise<T[]>;
  makeListItem: (props: MakeListItemProps<T>) => JSX.Element;
  makeHeader?: (data: T[]) => JSX.Element;
  placeholderText?: string;
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
            {childProps.data.length == 0 && props.placeholderText ? (
              <Text>{props.placeholderText}</Text>
            ) : (
              <></>
            )}
            {childProps.data.length > 0 && props.makeHeader ? (
              props.makeHeader(childProps.data)
            ) : (
              <></>
            )}
            {childProps.data.map((id: T, index: number) =>
              props.makeListItem({
                id: id,
                index: index,
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
          <TableContainer layerStyle={"level1"}>
            <Table>
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
                {childProps.data.map((id: T, index: number) =>
                  props.makeTableRow({
                    id: id,
                    index: index,
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
  const [isError, setIsError] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const tokens = await props.fetcher();

      if (tokens !== null && tokens !== undefined) {
        setData(tokens);
        if (props.dataLoaded !== undefined) {
          props.dataLoaded(tokens);
        }
      } else {
        setIsError(true);
      }
    } catch (error) {
      console.log(error);
      setIsError(true);
    } finally {
      setIsLoaded(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      fetchData();
    }
  }, [data]);

  useEffect(() => {
    const eventCallback = () => {
      fetchData();
    };
    if (props.reloadEvents !== undefined) {
      props.reloadEvents.forEach((eventType: EventId) => {
        eventEmitter.subscribe(eventType, eventCallback);
      });
    }
    return () => {
      if (props.reloadEvents !== undefined) {
        props.reloadEvents.forEach((eventType: EventId) => {
          eventEmitter.unsubscribe(eventType, eventCallback);
        });
      }
    };
  }, []);

  return isLoaded ? (
    !isError ? (
      props.makeChildren({
        data: data,
        refetchData: () => {
          fetchData();
        },
      })
    ) : (
      <Box>Error...</Box>
    )
  ) : isLoading ? (
    <Box>Loading...</Box>
  ) : (
    <Box>Error...</Box>
  );
}
