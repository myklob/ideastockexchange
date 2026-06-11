/**
 * Trading interface for buying YES/NO shares on a criterion's prediction market.
 * Includes amount input, buy buttons, and recent trade history.
 */
import React, { useState } from 'react';
import { Criterion, BetType, MarketStatus, TradeResponse } from '../types';
import { tradeAPI } from '../services/api';

interface TradingPanelProps {
  criterion: Criterion;
  userId: number | null;
  userBalance: number;
  onTradeComplete: (trade: TradeResponse) => void;
}

const TradingPanel: React.FC<TradingPanelProps> = ({
  criterion,
  userId,
  userBalance,
  onTradeComplete,
}) => {
  const [amount, setAmount] = useState<number>(10);
  const [trading, setTrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<TradeResponse | null>(null);

  const marketPercent = Math.round(criterion.market_price * 100);
  const isOpen = criterion.market_status === MarketStatus.OPEN;

  const handleTrade = async (betType: BetType) => {
    if (!userId) {
      setError('Please select a user to trade');
      return;
    }

    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amount > userBalance) {
      setError('Insufficient balance');
      return;
    }

    setTrading(true);
    setError(null);

    try {
      const result = await tradeAPI.executeTrade({
        user_id: userId,
        criterion_id: criterion.id,
        bet_type: betType,
        amount: amount,
      });
      setLastTrade(result);
      onTradeComplete(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Trade failed');
    } finally {
      setTrading(false);
    }
  };

  const presetAmounts = [5, 10, 25, 50, 100];

  if (!isOpen) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
        <div className="text-center text-gray-600">
          <p className="font-bold mb-1">Market Closed</p>
          <p className="text-sm">
            This market has been resolved{' '}
            <span className={criterion.market_status === MarketStatus.RESOLVED_YES ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {criterion.market_status === MarketStatus.RESOLVED_YES ? 'YES' : 'NO'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
        Trade
      </h4>

      {/* Current prices */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
          <div className="text-xs text-green-700 font-medium">YES Price</div>
          <div className="text-lg font-bold text-green-800">{marketPercent}%</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
          <div className="text-xs text-red-700 font-medium">NO Price</div>
          <div className="text-lg font-bold text-red-800">{100 - marketPercent}%</div>
        </div>
      </div>

      {/* Amount input */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Amount to wager
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          step="1"
          disabled={!userId || trading}
        />
        <div className="flex gap-1 mt-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              className="flex-1 text-xs py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-700"
              disabled={!userId || trading}
            >
              ${preset}
            </button>
          ))}
        </div>
      </div>

      {/* Balance display */}
      {userId && (
        <div className="text-xs text-gray-500 mb-3">
          Balance: <span className="font-bold">${userBalance.toFixed(2)}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Buy buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => handleTrade(BetType.YES)}
          disabled={!userId || trading || amount <= 0}
          className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-sm transition-colors"
        >
          {trading ? 'Trading...' : `Buy YES`}
        </button>
        <button
          onClick={() => handleTrade(BetType.NO)}
          disabled={!userId || trading || amount <= 0}
          className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-sm transition-colors"
        >
          {trading ? 'Trading...' : `Buy NO`}
        </button>
      </div>

      {!userId && (
        <p className="text-xs text-gray-500 text-center">
          Select a user above to start trading
        </p>
      )}

      {/* Last trade confirmation */}
      {lastTrade && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <p className="font-bold">Trade executed!</p>
          <p>
            Bought {lastTrade.shares_bought.toFixed(2)} {lastTrade.bet_type.toUpperCase()} shares
            for ${lastTrade.amount_spent.toFixed(2)}
          </p>
          <p>New market price: {(lastTrade.new_market_price * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
};

export default TradingPanel;
