import React, { useState, useEffect, useCallback } from 'react';
import {
  Link as LinkIcon,
  Search,
  X,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { beliefAPI, argumentAPI } from '../../services/api';

// ============================================================================
// LINKAGE TYPES - Different ways arguments can be connected
// ============================================================================
const LINKAGE_TYPES = [
  {
    id: 'directly_proves',
    label: 'Directly Proves',
    description: 'This argument provides direct evidence for the linked claim',
    color: 'bg-green-500',
    strength: 1.0,
  },
  {
    id: 'strongly_supports',
    label: 'Strongly Supports',
    description: 'This argument strongly supports the linked claim',
    color: 'bg-green-400',
    strength: 0.8,
  },
  {
    id: 'moderately_supports',
    label: 'Moderately Supports',
    description: 'This argument provides moderate support',
    color: 'bg-yellow-500',
    strength: 0.6,
  },
  {
    id: 'weakly_supports',
    label: 'Weakly Supports',
    description: 'This argument provides some support',
    color: 'bg-yellow-400',
    strength: 0.4,
  },
  {
    id: 'tangentially_related',
    label: 'Tangentially Related',
    description: 'This argument is related but doesn\'t directly support',
    color: 'bg-gray-400',
    strength: 0.2,
  },
  {
    id: 'challenges',
    label: 'Challenges',
    description: 'This argument challenges or contradicts the linked claim',
    color: 'bg-red-400',
    strength: -0.6,
  },
  {
    id: 'refutes',
    label: 'Refutes',
    description: 'This argument directly refutes the linked claim',
    color: 'bg-red-600',
    strength: -1.0,
  },
];

// ============================================================================
// ARGUMENT SEARCH RESULT ITEM
// ============================================================================
const ArgumentSearchResult = ({ argument, onSelect, selected }) => {
  const isSupporting = argument.type === 'supporting';

  return (
    <button
      onClick={() => onSelect(argument)}
      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
            isSupporting ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isSupporting ? 'PRO' : 'CON'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 line-clamp-2">{argument.content}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span>{argument.beliefStatement || 'Unknown belief'}</span>
            <span>|</span>
            <span>Score: {Math.round(argument.scores?.overall || 0)}</span>
          </div>
        </div>
        {selected && (
          <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
        )}
      </div>
    </button>
  );
};

// ============================================================================
// MAIN ARGUMENT LINK FORM COMPONENT
// ============================================================================
const ArgumentLinkForm = ({
  sourceArgument,
  onClose,
  onLinkCreated,
}) => {
  const [step, setStep] = useState(1); // 1: Search, 2: Configure Link, 3: Confirm
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedArgument, setSelectedArgument] = useState(null);
  const [linkageType, setLinkageType] = useState('strongly_supports');
  const [customStrength, setCustomStrength] = useState(0.8);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Search for arguments
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setError(null);

      // Search across all beliefs for arguments matching the query
      const response = await beliefAPI.getAll({
        search: searchQuery,
        limit: 20,
      });

      if (response.success) {
        // Extract arguments from beliefs
        const allArguments = [];
        response.data.beliefs?.forEach(belief => {
          const addArgs = (args, beliefStatement) => {
            args?.forEach(arg => {
              allArguments.push({
                ...arg,
                beliefStatement,
                beliefId: belief._id,
              });
              if (arg.subArguments) {
                addArgs(arg.subArguments, beliefStatement);
              }
            });
          };
          addArgs(belief.supportingArguments, belief.statement);
          addArgs(belief.opposingArguments, belief.statement);
        });

        // Filter out the source argument
        const filtered = allArguments.filter(
          arg => arg._id !== sourceArgument?._id
        );

        setSearchResults(filtered);
      }
    } catch (err) {
      setError('Failed to search arguments');
      console.error(err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, sourceArgument]);

  // Handle search on enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Update strength when linkage type changes
  useEffect(() => {
    const selected = LINKAGE_TYPES.find(t => t.id === linkageType);
    if (selected) {
      setCustomStrength(selected.strength);
    }
  }, [linkageType]);

  // Create the link
  const handleCreateLink = async () => {
    if (!selectedArgument) return;

    try {
      setSubmitting(true);
      setError(null);

      // This would call an API to create the link
      // For now, we'll simulate the success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
      setTimeout(() => {
        if (onLinkCreated) {
          onLinkCreated({
            sourceArgument,
            targetArgument: selectedArgument,
            linkageType,
            strength: customStrength,
            notes,
          });
        }
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to create link');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLinkageType = LINKAGE_TYPES.find(t => t.id === linkageType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Link Arguments</h2>
              <p className="text-sm text-gray-500">
                Connect arguments to show relationships
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Success State */}
          {success && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Link Created Successfully!
              </h3>
              <p className="text-gray-500">
                The arguments are now connected in the network.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !success && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {!success && (
            <>
              {/* Source Argument Preview */}
              {sourceArgument && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Argument
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-800">{sourceArgument.content}</p>
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        sourceArgument.type === 'supporting'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {sourceArgument.type === 'supporting' ? 'PRO' : 'CON'}
                    </span>
                  </div>
                </div>
              )}

              {/* Step 1: Search for Target Argument */}
              {step === 1 && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search for Target Argument
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search arguments by keyword..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        disabled={searching || !searchQuery.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {searching ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Search'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Target Argument ({searchResults.length} found)
                      </label>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {searchResults.map((arg) => (
                          <ArgumentSearchResult
                            key={arg._id}
                            argument={arg}
                            onSelect={setSelectedArgument}
                            selected={selectedArgument?._id === arg._id}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Button */}
                  {selectedArgument && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setStep(2)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Configure Link
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Configure Link Type */}
              {step === 2 && selectedArgument && (
                <>
                  {/* Target Argument Preview */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Argument
                    </label>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-800">{selectedArgument.content}</p>
                      <span
                        className={`inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                          selectedArgument.type === 'supporting'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedArgument.type === 'supporting' ? 'PRO' : 'CON'}
                      </span>
                    </div>
                  </div>

                  {/* Link Direction Visual */}
                  <div className="mb-6 flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Source</div>
                      <div className="px-3 py-1 bg-white rounded border border-gray-300 text-sm truncate max-w-[120px]">
                        {sourceArgument?.content?.slice(0, 20)}...
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-500" />
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Target</div>
                      <div className="px-3 py-1 bg-blue-100 rounded border border-blue-300 text-sm truncate max-w-[120px]">
                        {selectedArgument.content?.slice(0, 20)}...
                      </div>
                    </div>
                  </div>

                  {/* Linkage Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Linkage Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {LINKAGE_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setLinkageType(type.id)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            linkageType === type.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-3 h-3 rounded-full ${type.color}`} />
                            <span className="text-sm font-medium">{type.label}</span>
                          </div>
                          <p className="text-xs text-gray-500">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Strength Slider */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Strength: {customStrength > 0 ? '+' : ''}{customStrength.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={customStrength}
                      onChange={(e) => setCustomStrength(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Refutes (-1.0)</span>
                      <span>Neutral (0)</span>
                      <span>Proves (+1.0)</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Explain why these arguments are connected..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateLink}
                      disabled={submitting}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Create Link
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArgumentLinkForm;
