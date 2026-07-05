import { describe, it, expect } from 'vitest'
import { signAttestation, verifyAttestation, type SnapshotAttestationPayload } from '@/lib/markets/oracle'

const payload: SnapshotAttestationPayload = {
  snapshotId: 'snap_1',
  beliefId: 42,
  beliefSlug: 'carbon-pricing-reduces-emissions',
  epoch: '2026-07',
  truthScore: 0.6613,
  algorithmVersion: 'reasonrank-provisional-v0.1',
  createdAt: '2026-08-01T00:10:00.000Z',
}

describe('oracle attestations (the one-way export)', () => {
  it('signs and verifies a snapshot payload', () => {
    const attestation = signAttestation(payload)
    expect(attestation.keySource).toBe('ephemeral-dev') // no env key in tests
    expect(
      verifyAttestation(attestation.payload, attestation.signature, attestation.publicKeyPem),
    ).toBe(true)
  })

  it('rejects a tampered score', () => {
    const attestation = signAttestation(payload)
    const tampered = { ...payload, truthScore: 0.9 }
    expect(verifyAttestation(tampered, attestation.signature, attestation.publicKeyPem)).toBe(false)
  })

  it('signature is stable across key order (canonical encoding)', () => {
    const attestation = signAttestation(payload)
    const shuffled = JSON.parse(
      JSON.stringify(payload, ['createdAt', 'algorithmVersion', 'truthScore', 'epoch', 'beliefSlug', 'beliefId', 'snapshotId']),
    ) as SnapshotAttestationPayload
    expect(verifyAttestation(shuffled, attestation.signature, attestation.publicKeyPem)).toBe(true)
  })
})
