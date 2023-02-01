//src/components/header.tsx
import NextLink from "next/link"
import { Flex, Button, useColorModeValue, Spacer, Heading, Box, LinkOverlay } from '@chakra-ui/react'
import { ConnectKitButton } from 'connectkit';

const siteTitle="Unilend"
export default function Header() {

  return (
    <Flex as='header' bg={useColorModeValue('gray.100', 'gray.900')} p={4} alignItems='center'>
      <Box>
        <Heading size="md">{siteTitle}</Heading>
      </Box>      
      <Spacer />
      <ConnectKitButton showBalance={false} showAvatar={false} />
    </Flex>
  )
}
