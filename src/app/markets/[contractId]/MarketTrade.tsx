'use client'

/**
 * API-backed trade widget. LMSR markets get a market-order form (buy/sell
 * shares against the maker); graduated markets get a limit-order form.
 * Positions live server-side under a play-money username.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MarketTradeProps {
  contractId: string
  pricingMode: string
  priceYes: number
  feeRate: number
}

type Outcome = 'YES' | 'NO'
type OrderSide = 'BUY' | 'SELL'

export default function MarketTrade({ contractId, pricingMode, priceYes, feeRate }: MarketTradeProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [outcome, setOutcome] = useState<Outcome>('YES')
  const [side, setSide] = useState<OrderSide>('BUY')
  const [shares, setShares] = useState('10')
  const [limitPrice, setLimitPrice] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('ise-market-username')
    if (saved) setUsername(saved)
  }, [])

  async function submit() {
    setBusy(true)
    setMessage(null)
    setError(null)
    window.localStorage.setItem('ise-market-username', username)
    try {
      const quantity = parseFloat(shares)
      let response: Response
      if (pricingMode === 'LMSR') {
        response = await fetch(`/api/v1/market/contracts/${contractId}/trade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, outcome, side, shares: quantity }),
        })
      } else {
        response = await fetch(`/api/v1/market/contracts/${contractId}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username, outcome, side,
            limitPrice: parseFloat(limitPrice),
            quantity,
          }),
        })
      }
      const body = await response.json()
      if (!response.ok) {
        setError(body.error ?? `HTTP ${response.status}`)
      } else if (pricingMode === 'LMSR') {
        setMessage(
          `Filled ${quantity} ${outcome} at avg ${(body.pricePerShare * 100).toFixed(1)}¢ ` +
          `(fee $${body.fee.toFixed(2)}). New YES price: ${(body.priceYes * 100).toFixed(1)}¢.` +
          (body.graduated ? ' This market just graduated to the order book.' : ''),
        )
        router.refresh()
      } else {
        const filled = body.order.filledQuantity
        setMessage(
          filled > 0
            ? `Order ${body.order.status}: ${filled.toFixed(1)} filled across ${body.fills.length} fill(s).`
            : 'Order resting on the book.',
        )
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const canSubmit =
    username.trim().length > 0 &&
    parseFloat(shares) > 0 &&
    (pricingMode === 'LMSR' || (parseFloat(limitPrice) > 0 && parseFloat(limitPrice) < 1))

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-bold">
          {pricingMode === 'LMSR' ? 'Trade against the market maker' : 'Place a limit order'}
        </h2>
        <span className="text-xs text-gray-500">
          fee {feeRate / 100}% · YES {(priceYes * 100).toFixed(1)}&cent;
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm items-end">
        <label className="flex flex-col gap-1 col-span-2 md:col-span-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Username</span>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="play-money id"
            className="border border-gray-300 rounded px-2 py-1 bg-white"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Side</span>
          <select
            value={side}
            onChange={e => setSide(e.target.value as OrderSide)}
            className="border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Outcome</span>
          <select
            value={outcome}
            onChange={e => setOutcome(e.target.value as Outcome)}
            className="border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Shares</span>
          <input
            type="number"
            min="0"
            step="1"
            value={shares}
            onChange={e => setShares(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 bg-white"
          />
        </label>
        {pricingMode !== 'LMSR' && (
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-gray-500">Limit (0–1)</span>
            <input
              type="number"
              min="0.01"
              max="0.99"
              step="0.01"
              value={limitPrice}
              onChange={e => setLimitPrice(e.target.value)}
              placeholder="0.62"
              className="border border-gray-300 rounded px-2 py-1 bg-white"
            />
          </label>
        )}
        <button
          type="button"
          disabled={!canSubmit || busy}
          onClick={submit}
          className="bg-blue-700 text-white font-medium px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-40"
        >
          {busy ? 'Working…' : pricingMode === 'LMSR' ? 'Trade' : 'Place order'}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-3 text-xs text-gray-500">
        Play money. New usernames start with $10,000; winning shares pay $1.00 at settlement.
        Positions: <code className="text-xs">/api/v1/market/positions?username=&lt;you&gt;</code> ·
        leverage: <code className="text-xs">/api/v1/market/margin</code> ·
        spreads: <code className="text-xs">/api/v1/market/bundles</code>
      </p>
    </div>
  )
}
