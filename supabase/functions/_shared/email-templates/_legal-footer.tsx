/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Link, Text } from 'npm:@react-email/components@0.0.22'
import { SITE_URL, footerLink } from './_styles.ts'

const legalRow = {
  fontSize: '12px',
  color: '#666666',
  margin: '12px 0 0',
  textAlign: 'center' as const,
}
const sep = { color: '#444444', padding: '0 8px' }

export const LegalFooter = () => (
  <Text style={legalRow}>
    <Link href={SITE_URL} style={footerLink}>aifilmz.app</Link>
    <span style={sep}>·</span>
    <Link href={`${SITE_URL}/privacy`} style={footerLink}>Privacy Policy</Link>
    <span style={sep}>·</span>
    <Link href={`${SITE_URL}/terms`} style={footerLink}>Terms of Service</Link>
  </Text>
)

export default LegalFooter
