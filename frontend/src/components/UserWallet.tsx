/**
 * User wallet component showing balance, portfolio positions, and trade history.
 */
import React, { useState, useEffect } from 'react';
import { User, Portfolio, PortfolioPosition, BetType } from '../types';
import { userAPI } from '../services/api';

interface UserWalletProps {
  userId: number;
}

const UserWallet: React.FC<UserWalletProps> = ({ userId }) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, [userId]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const data = await userAPI.getPortfolio(userId);
      setPortfolio(data);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-500">Loading wallet...</p>
      </div>
    );
  }

  if (!portfolio) return null;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Wallet
        </h4>
        <span className="text-xs text-gray-500">
          {expanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Balance summary - always visible */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded p-2 text-center">
          <div className="text-xs text-blue-600">Cash</div>
          <div className="text-sm font-bold text-blue-800">
            ${portfolio.balance.toFixed(0)}
          </div>
        </div>
        <div className="bg-purple-50 rounded p-2 text-center">
          <div className="text-xs text-purple-600">Invested</div>
          <div className="text-sm font-bold text-purple-800">
            ${portfolio.total_market_value.toFixed(0)}
          </div>
        </div>
        <div className={`rounded p-2 text-center ${
          portfolio.total_profit_loss >= 0 ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className={`text-xs ${
            portfolio.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>P/L</div>
          <div className={`text-sm font-bold ${
            portfolio.total_profit_loss >= 0 ? 'text-green-800' : 'text-red-800'
          }`}>
            {portfolio.total_profit_loss >= 0 ? '+' : ''}
            ${portfolio.total_profit_loss.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Expanded portfolio positions */}
      {expanded && (
        <div className="mt-4">
          <h5 className="text-xs font-bold text-gray-600 mb-2 uppercase">Active Positions</h5>
          {portfolio.positions.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">No active positions</p>
          ) : (
            <div className="space-y-2">
              {portfolio.positions.map((pos, idx) => (
                <PositionCard key={idx} position={pos} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PositionCard: React.FC<{ position: PortfolioPosition }> = ({ position }) => {
  const isYes = position.bet_type === BetType.YES;
  return (
    <div className={`p-2 rounded border text-xs ${
      isYes ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-gray-800">{position.criterion_name}</span>
          <span className={`ml-2 text-xs font-bold ${isYes ? 'text-green-700' : 'text-red-700'}`}>
            {position.bet_type.toUpperCase()}
          </span>
        </div>
        <div className={`font-bold ${position.profit_loss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {position.profit_loss >= 0 ? '+' : ''}${position.profit_loss.toFixed(2)}
        </div>
      </div>
      <div className="flex justify-between mt-1 text-gray-600">
        <span>{position.total_shares.toFixed(1)} shares</span>
        <span>Spent: ${position.total_spent.toFixed(2)}</span>
        <span>Value: ${position.market_value.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default UserWallet;
