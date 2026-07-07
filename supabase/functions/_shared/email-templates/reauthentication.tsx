/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  LOGO_URL, main, container, logo, h1, text, footer, codeStyle,
} from './_styles.ts'
import { LegalFooter } from './_legal-footer.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your That's A Wrap verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="That's A Wrap" style={logo} />
        <Heading style={h1}>Verification code</Heading>
        <Text style={text}>Use this code to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. If you didn't request this, you can safely ignore this email.
        </Text>
        <LegalFooter />
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
