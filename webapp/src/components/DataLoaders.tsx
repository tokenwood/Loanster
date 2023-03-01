import React, { useEffect, useState } from "react";
import { Box, VStack } from "@chakra-ui/react";
import { eventEmitter, EventId, EventType } from "libs/eventEmitter";

export interface MakeListItemProps {
  id: any;
  callback: () => any;
}

interface ListLoaderProps {
  fetchIds: () => Promise<any[]>;
  makeListItem: (props: MakeListItemProps) => JSX.Element;
  reloadEvents?: EventId[];
}

export default function ListLoader(props: ListLoaderProps) {
  return (
    <DataLoader
      defaultValue={[]}
      fetcher={() => props.fetchIds()}
      reloadEvents={props.reloadEvents}
      makeChildren={(childProps: ChildProps) => {
        return (
          <VStack>
            {childProps.data.map((id: any) =>
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

export interface ChildProps {
  data: any;
  refetchData: () => any;
}

interface DataLoaderProps {
  defaultValue?: any;
  reloadEvents?: EventId[];
  fetcher: () => Promise<any>;
  makeChildren: (props: ChildProps) => JSX.Element;
}

export function DataLoader(props: DataLoaderProps) {
  const [data, setData] = useState<any>(props.defaultValue);
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
