import { extendTheme } from "@chakra-ui/react";

export const headerButtonHoverStyle = {
  color: "blackAlpha",
  bg: "blackAlpha.100",
};

export const tableRowHoverStyle = {
  // color: "blackAlpha",
  bg: "blackAlpha.200",
};
export const DEFAULT_SIZE = "sm";
export const headerButtonBorderRadius = "20px";
export const defaultBorderRadius = "20px";
export const level2BorderColor = "blue";
export const actionInitColorScheme = "blue";
export const cancelColorScheme = "blackAlpha";
export const statFontSize = "md";

const theme = extendTheme({
  layerStyles: {
    level0: {
      // border: "1px solid",
      color: "red",
      bgColor: "gray.100",
      // borderColor: "yellow",
    },
    level1: {
      border: "0px solid",
      borderRadius: defaultBorderRadius,
      color: "black",
      bgColor: "white",
      borderColor: "red",
    },
    level2: {
      border: "0px",
      borderRadius: defaultBorderRadius,
      color: "black",
      bgColor: "gray.100",
      borderColor: level2BorderColor,
    },

    level3: {
      border: "0px solid",
      borderRadius: "20px",
      color: "white",
      bgColor: "gray.600",
      borderColor: "orange",
    },
    actionInit: {
      colorScheme: "blue",
      borderRadius: defaultBorderRadius,
    },
    headerButton: {
      border: "0px",

      //   borderStyle: "solid",
      color: "gray.600",
      bgColor: "transparent",
      //   borderColor: "transparent",
    },
    headerButtonSelected: {
      border: "0px solid",
      color: "gray.900",
      bgColor: "transparent",
      radii: "20px",
      //   borderColor: "transparent",
    },
    header: {
      borderBottom: "0px",
      borderColor: "orange",
    },
  },

  textStyles: {
    h1: {
      fontSize: ["48px", "72px"],
      fontWeight: "bold",
      lineHeight: "110%",
      letterSpacing: "-2%",
    },
    h2: {
      fontSize: ["36px", "48px"],
      fontWeight: "semibold",
      lineHeight: "110%",
      letterSpacing: "-1%",
    },
    tableHeader: {
      fontSize: ["14px"],
      // fontWeight: "semibold"
      lineHeight: "200%",
      letterSpacing: "-1%",
      color: "gray.600",
    },
    tableRow: {
      fontSize: ["16px"],
      fontWeight: "semibold",
      // lineHeight: "200%",
      // letterSpacing: "-1%",
      // color: "gray.600",
    },
    price: {
      fontSize: ["14px"],
      // fontWeight: "thin",
      // lineHeight: "80%",
      // marginTop: "0px",
      // paddingTop: "0px",
      // letterSpacing: "-1%",
      color: "gray.600",
    },
    numberInput: {
      // fontSize: ["36px", "48px"],
      fontWeight: "bold",
      // lineHeight: "10%",
      // letterSpacing: "-1%",
    },
  },
  fonts: {
    // heading: `'inter', sans-serif`, //`'inter', sans-serif`,
    body: `'inter', sans-serif`, //`'Inknut Antiqua', sans-serif`,
  },
});

export default theme;
