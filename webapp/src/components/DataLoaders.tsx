import React, { useEffect, useState, useMemo, useCallback } from "react";
import { VStack } from "@chakra-ui/react";

export interface MakeListItemProps {
  id: any;
  callback: () => any;
}

interface ListLoaderProps {
  fetchIds: () => Promise<any[]>;
  makeListItem: (props: MakeListItemProps) => JSX.Element;
}

export default function ListLoader(props: ListLoaderProps) {
  return (
    <DataLoader
      defaultValue={[]}
      fetcher={() => props.fetchIds()}
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
  defaultValue: [];
  fetcher: () => Promise<any>;
  makeChildren: (props: ChildProps) => JSX.Element;
}

export function DataLoader(props: DataLoaderProps) {
  const [data, setData] = useState<any>(props.defaultValue);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const fetchData = async () => {
    const tokens = await props.fetcher();
    setIsLoaded(true);
    setData(tokens);
  };

  useEffect(() => {
    if (!isLoaded) {
      setIsLoaded(true);
      fetchData().catch((error) => {
        console.log(error);
        setIsLoaded(true);
      });
    }
  }, [data]);

  return props.makeChildren({
    data: data,
    refetchData: () => {
      fetchData();
    },
  });
}
