/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import {
  LOGO_URL, SITE_URL, main, container, logo, h1, text, link, button, buttonWrap, footer,
} from './_styles.ts'
import { LegalFooter } from './_legal-footer.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to That's A Wrap</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="That's A Wrap" style={logo} />
        <Heading style={h1}>You're invited ✨</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={SITE_URL} style={link}><strong>That's A Wrap.app</strong></Link>
          . Accept below to create your account.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>Accept Invitation →</Button>
        </Section>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
        <LegalFooter />
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
