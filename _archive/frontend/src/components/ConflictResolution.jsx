import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageCircle,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Users,
  TrendingUp,
  Shield,
  Target
} from 'lucide-react';

/**
 * ConflictResolution Component
 *
 * Displays automated conflict resolution workflows for beliefs
 * where supporters and opponents are in active disagreement.
 *
 * Based on conflict resolution theory:
 * - IBR (Interest-Based Relational)
 * - Dual Concern Model (Thomas-Kilmann)
 * - Glasl's Escalation Model
 */
const ConflictResolution = ({ beliefId, conflict, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [proposalText, setProposalText] = useState('');
  const [communicationText, setCommunicationText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!conflict) {
    return null;
  }

  const {
    status,
    resolutionTemplate,
    intensity,
    workflow,
    ibrData,
    collaborationData,
    compromiseData,
    deescalation,
    conflictSources,
    supporters,
    opponents
  } = conflict;

  // Get template display info
  const getTemplateInfo = () => {
    const templates = {
      collaborating: {
        name: 'Collaboration (Win-Win)',
        description: 'Working together to find a solution that benefits both supporters and opponents',
        icon: <Users className="w-5 h-5" />,
        color: 'green'
      },
      compromising: {
        name: 'Compromise',
        description: 'Each side gives up something to reach middle ground',
        icon: <Target className="w-5 h-5" />,
        color: 'blue'
      },
      ibr: {
        name: 'Interest-Based Relational (IBR)',
        description: 'Focus on underlying interests, not positions',
        icon: <Lightbulb className="w-5 h-5" />,
        color: 'purple'
      },
      mediation: {
        name: 'Mediation',
        description: 'Third-party facilitates discussion between parties',
        icon: <Shield className="w-5 h-5" />,
        color: 'orange'
      },
      nvc: {
        name: 'Nonviolent Communication',
        description: 'Express needs and feelings without blame',
        icon: <MessageCircle className="w-5 h-5" />,
        color: 'teal'
      }
    };
    return templates[resolutionTemplate] || templates.collaborating;
  };

  const templateInfo = getTemplateInfo();

  // Get escalation level info
  const getEscalationInfo = () => {
    const level = intensity.escalationLevel;
    if (level <= 3) {
      return { label: 'Low', color: 'green', description: 'Win-win solutions possible' };
    } else if (level <= 6) {
      return { label: 'Medium', color: 'yellow', description: 'Compromise recommended' };
    } else if (level <= 8) {
      return { label: 'High', color: 'orange', description: 'Mediation required' };
    } else {
      return { label: 'Critical', color: 'red', description: 'Immediate intervention needed' };
    }
  };

  const escalationInfo = getEscalationInfo();

  // Handle proposal submission
  const handleProposeSolution = async () => {
    if (!proposalText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/conflicts/${conflict._id}/propose-solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          description: proposalText,
          meetsInterestsOf: ['supporters', 'opponents']
        })
      });

      if (response.ok) {
        setProposalText('');
        onRefresh && onRefresh();
      }
    } catch (error) {
      console.error('Error proposing solution:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle communication
  const handleSendMessage = async () => {
    if (!communicationText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/conflicts/${conflict._id}/communicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: communicationText,
          communicationType: 'normal',
          emotionalTone: 'constructive'
        })
      });

      if (response.ok) {
        setCommunicationText('');
        onRefresh && onRefresh();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle advancing workflow
  const handleAdvanceWorkflow = async (outcome) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/conflicts/${conflict._id}/advance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ outcome })
      });

      if (response.ok) {
        onRefresh && onRefresh();
      }
    } catch (error) {
      console.error('Error advancing workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-6 my-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-full bg-${templateInfo.color}-100`}>
            {templateInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-800">
                Active Conflict Detected
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {templateInfo.name} - {templateInfo.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-${escalationInfo.color}-100 text-${escalationInfo.color}-800`}>
            {escalationInfo.label} Escalation (Level {intensity.escalationLevel}/9)
          </div>
          <span className="text-xs text-gray-500">
            {intensity.participantCount} participants • {intensity.argumentCount} arguments
          </span>
        </div>
      </div>

      {/* Cooling Off Banner */}
      {deescalation?.coolingOffPeriod?.enabled && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900">Cooling-Off Period Active</h4>
            <p className="text-sm text-blue-700">
              No new arguments until {new Date(deescalation.coolingOffPeriod.endsAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'workflow'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Workflow ({workflow.currentStep}/{workflow.totalSteps})
        </button>
        <button
          onClick={() => setActiveTab('solutions')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'solutions'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Solutions
        </button>
        <button
          onClick={() => setActiveTab('dialogue')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'dialogue'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Dialogue
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Conflict Sources</h4>
              <div className="flex flex-wrap gap-2">
                {conflictSources?.map((source, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <h5 className="font-semibold text-gray-800">Supporters</h5>
                </div>
                <p className="text-2xl font-bold text-green-600">{supporters?.length || 0}</p>
                <p className="text-xs text-gray-500">people agreeing</p>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  <h5 className="font-semibold text-gray-800">Opponents</h5>
                </div>
                <p className="text-2xl font-bold text-red-600">{opponents?.length || 0}</p>
                <p className="text-xs text-gray-500">people disagreeing</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-blue-900 mb-2">Resolution Goal</h5>
              <p className="text-sm text-blue-800">
                {escalationInfo.description}. The current template ({templateInfo.name}) is designed to help both sides reach a mutually satisfactory outcome.
              </p>
            </div>
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 mb-3">Resolution Steps</h4>

            {workflow.steps?.map((step, idx) => (
              <div
                key={idx}
                className={`border-l-4 pl-4 py-3 ${
                  step.status === 'completed'
                    ? 'border-green-500 bg-green-50'
                    : step.status === 'in_progress'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {step.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {step.status === 'in_progress' && (
                        <TrendingUp className="w-5 h-5 text-orange-600 animate-pulse" />
                      )}
                      {step.status === 'pending' && (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <h5 className="font-semibold text-gray-800">
                        Step {step.stepNumber}: {step.name}
                      </h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                    {step.outcome && (
                      <p className="text-sm text-green-700 bg-green-100 p-2 rounded">
                        <strong>Outcome:</strong> {step.outcome}
                      </p>
                    )}
                  </div>

                  {step.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        const outcome = prompt(`Enter outcome for "${step.name}":`);
                        if (outcome) handleAdvanceWorkflow(outcome);
                      }}
                      className="ml-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                      disabled={loading}
                    >
                      Complete Step
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Solutions Tab */}
        {activeTab === 'solutions' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Propose a Solution</h4>
              <textarea
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                placeholder="Describe a solution that could satisfy both supporters and opponents..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows="4"
              />
              <button
                onClick={handleProposeSolution}
                disabled={loading || !proposalText.trim()}
                className="mt-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Propose Solution'}
              </button>
            </div>

            {/* Display existing solutions */}
            {(resolutionTemplate === 'ibr' ? ibrData?.proposedSolutions : collaborationData?.brainstormedSolutions)?.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-800 mb-3">Proposed Solutions</h5>
                <div className="space-y-3">
                  {(resolutionTemplate === 'ibr'
                    ? ibrData.proposedSolutions
                    : collaborationData.brainstormedSolutions
                  ).map((solution, idx) => (
                    <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                      <p className="text-gray-800 mb-2">
                        {solution.description || solution.solution}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          👍 {solution.votesFor || solution.supportedBy?.length || 0}
                        </span>
                        <span className="text-gray-600">
                          👎 {solution.votesAgainst || solution.opposedBy?.length || 0}
                        </span>
                        <span className="text-gray-500 text-xs">
                          Proposed by user #{solution.proposedBy || solution.createdBy}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dialogue Tab */}
        {activeTab === 'dialogue' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Regulated Communication</h4>
              <p className="text-sm text-gray-600 mb-3">
                Use respectful, constructive language to communicate with other parties.
              </p>
              <textarea
                value={communicationText}
                onChange={(e) => setCommunicationText(e.target.value)}
                placeholder="Express your perspective respectfully..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows="4"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !communicationText.trim() || deescalation?.coolingOffPeriod?.enabled}
                className="mt-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>

            {/* Display communications */}
            {conflict.communications?.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-800 mb-3">Communication Log</h5>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {conflict.communications.map((comm, idx) => (
                    <div key={idx} className="border-l-2 border-gray-300 pl-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {new Date(comm.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{comm.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConflictResolution;
