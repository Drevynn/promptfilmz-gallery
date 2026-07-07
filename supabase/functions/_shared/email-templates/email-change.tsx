/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  LOGO_URL, main, container, logo, h1, text, link, button, buttonWrap, footer,
} from './_styles.ts'
import { LegalFooter } from './_legal-footer.tsx'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your That's A Wrap email change</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="That's A Wrap" style={logo} />
        <Heading style={h1}>Confirm email change</Heading>
        <Text style={text}>
          You requested to change your That's A Wrap email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          to <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>Confirm Email Change →</Button>
        </Section>
        <Text style={footer}>
          If you didn't request this, please secure your account immediately.
        </Text>
        <LegalFooter />
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
