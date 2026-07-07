/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  LOGO_URL, main, container, logo, h1, text, button, buttonWrap, footer,
} from './_styles.ts'
import { LegalFooter } from './_legal-footer.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your That's A Wrap password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="That's A Wrap" style={logo} />
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for That's A Wrap.
          Click below to choose a new one.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>Reset Password →</Button>
        </Section>
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email — your password won't change.
        </Text>
        <LegalFooter />
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
