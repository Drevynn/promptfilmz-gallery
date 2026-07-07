/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  LOGO_URL, main, container, logo, h1, text, button, buttonWrap, footer,
} from './_styles.ts'
import { LegalFooter } from './_legal-footer.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for That's A Wrap</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="That's A Wrap" style={logo} />
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Tap the button below to log in to That's A Wrap. This link expires shortly.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>Log In →</Button>
        </Section>
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email.
        </Text>
        <LegalFooter />
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
