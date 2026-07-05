/**
 * Signed snapshot attestations: the one-way export that lets external
 * markets (conditional-token pools, Kalshi-style data consumers) settle
 * against ISE epoch snapshots.
 *
 * The integration rule, enforced by construction: this module only READS
 * snapshot rows and signs them. Nothing here (and nothing anywhere in the
 * market layer) pipes external prices back into scoring.
 *
 * Keys: set ORACLE_PRIVATE_KEY_PEM (PKCS8 Ed25519) in production. Without
 * it, a per-process dev keypair is generated and the response says so —
 * an ephemeral dev signature must never be presented as a stable oracle.
 */

import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, type KeyObject } from 'crypto'

export interface SnapshotAttestationPayload {
  snapshotId: string
  beliefId: number
  beliefSlug: string
  epoch: string
  truthScore: number
  algorithmVersion: string
  createdAt: string // ISO timestamp of the snapshot row
}

export interface SignedAttestation {
  payload: SnapshotAttestationPayload
  /** Base64 Ed25519 signature over the canonical payload encoding. */
  signature: string
  publicKeyPem: string
  keySource: 'env' | 'ephemeral-dev'
}

let devKeyPair: { privateKey: KeyObject; publicKey: KeyObject } | null = null

function keyPair(): { privateKey: KeyObject; publicKey: KeyObject; source: 'env' | 'ephemeral-dev' } {
  const pem = process.env.ORACLE_PRIVATE_KEY_PEM
  if (pem) {
    const privateKey = createPrivateKey(pem)
    return { privateKey, publicKey: createPublicKey(privateKey), source: 'env' }
  }
  if (!devKeyPair) {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    devKeyPair = { privateKey, publicKey }
  }
  return { ...devKeyPair, source: 'ephemeral-dev' }
}

/** Canonical encoding: JSON with keys sorted, so signatures are stable
 *  across serializers. */
export function canonicalPayload(payload: SnapshotAttestationPayload): Buffer {
  const sorted = Object.fromEntries(
    Object.entries(payload).sort(([a], [b]) => (a < b ? -1 : 1)),
  )
  return Buffer.from(JSON.stringify(sorted), 'utf8')
}

export function signAttestation(payload: SnapshotAttestationPayload): SignedAttestation {
  const { privateKey, publicKey, source } = keyPair()
  const signature = sign(null, canonicalPayload(payload), privateKey).toString('base64')
  return {
    payload,
    signature,
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    keySource: source,
  }
}

export function verifyAttestation(
  payload: SnapshotAttestationPayload,
  signatureB64: string,
  publicKeyPem: string,
): boolean {
  return verify(
    null,
    canonicalPayload(payload),
    createPublicKey(publicKeyPem),
    Buffer.from(signatureB64, 'base64'),
  )
}
