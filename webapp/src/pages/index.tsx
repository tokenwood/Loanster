// src/pages/index.tsx
import { Box } from "@chakra-ui/react";
import type { NextPage } from "next";
import { Router, useRouter } from "next/router";
import { useEffect } from "react";
// import SupplyPage from "./supply";

const Home: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/supply");
  }, []);

  return <Box>index</Box>;
};

export default Home;
