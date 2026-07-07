/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  LOGO_URL, SITE_URL, main, container, logo, h1, text, link, button, buttonWrap, footer,
} from './_styles.ts'
import { LegalFooter } from './_legal-footer.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to That's A Wrap — confirm your email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="That's A Wrap" style={logo} />
        <Heading style={h1}>Welcome to That's A Wrap ✨</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={SITE_URL} style={link}><strong>That's A Wrap.app</strong></Link>
          {' '}— your AI-native film studio.
        </Text>
        <Text style={text}>
          Confirm <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link> to start creating:
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>Start Creating Free →</Button>
        </Section>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <LegalFooter />
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
