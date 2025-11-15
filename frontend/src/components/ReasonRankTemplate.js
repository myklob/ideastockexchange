import React, { useState, useMemo } from "react";

// Simple Tooltip component
const Tooltip = ({ children, content }) => (
  <div className="group relative inline-block">
    {children}
    <div className="invisible group-hover:visible absolute z-10 w-48 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-12 left-1/2 -translate-x-1/2">
      {content}
      <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
    </div>
  </div>
);

// Helper functions for score visualization
const getScoreColorClass = (score) => {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  return "bg-red-500";
};

const getScoreDescription = (key) => ({
  logical: "Measures the logical coherence of the argument",
  linkage: "Indicates how well the argument connects to the belief",
  importance: "Reflects the significance of the argument in the context",
  overall: "Combined score based on all factors",
}[key] || "No description available");

// SubScores Display Component
const SubScoresDisplay = ({ subScores }) => (
  <div className="bg-gray-100 p-3 rounded mt-2 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
    {Object.entries(subScores).map(([key, value]) => (
      <Tooltip key={key} content={getScoreDescription(key)}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-700 capitalize">{key}:</span>
          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreColorClass(value)}`}
              style={{ width: `${value}%` }}
              aria-valuenow={value}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
          <span className="ml-1 text-xs font-medium">{value}%</span>
        </div>
      </Tooltip>
    ))}
  </div>
);

// Score Display Component
const ScoreDisplay = ({ score, label, subScores, categoryType }) => {
  const [showSubScores, setShowSubScores] = useState(false);
  const colorClass = categoryType === "supporting"
    ? "bg-green-100 hover:bg-green-200"
    : categoryType === "opposing"
      ? "bg-red-100 hover:bg-red-200"
      : "bg-blue-100 hover:bg-blue-200";

  return (
    <button
      className={`flex flex-col items-center p-2 rounded transition-all duration-300 ${colorClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
      onClick={() => setShowSubScores((prev) => !prev)}
      aria-expanded={showSubScores}
      aria-label={`Toggle sub-scores for ${label}`}
    >
      <span className="font-bold text-lg">{score}%</span>
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`mt-1 text-gray-500 transition-transform duration-300 ${showSubScores ? "rotate-180" : ""}`}>
        {showSubScores ? "▲" : "▼"}
      </span>
      {showSubScores && <SubScoresDisplay subScores={subScores} />}
    </button>
  );
};

// Argument Item Component
const ArgumentItem = ({ index, content, scores, categoryType }) => (
  <div className="border rounded p-3 bg-white flex justify-between items-center shadow-sm hover:shadow-md transition-all">
    <span className="text-sm">
      {index}. {content}
    </span>
    <ScoreDisplay score={scores.overall} label="Score" subScores={scores} categoryType={categoryType} />
  </div>
);

// Content Section with Filtering and Sorting
const ContentSection = ({ title, items, searchTerm, filterOption, categoryType }) => {
  const filteredItems = useMemo(() => {
    return items
      .filter(
        (item) =>
          item.content.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (filterOption === "all" ||
            (filterOption === "high" && item.scores.overall >= 90) ||
            (filterOption === "medium" && item.scores.overall >= 70 && item.scores.overall < 90) ||
            (filterOption === "low" && item.scores.overall < 70))
      )
      .sort((a, b) => b.scores.overall - a.scores.overall);
  }, [items, searchTerm, filterOption]);

  return (
    <div className="border rounded p-4 bg-gray-50">
      <h3 className="font-semibold text-lg mb-3">{title}</h3>
      {filteredItems.length > 0 ? (
        <div className="space-y-2">
          {filteredItems.map((item, idx) => (
            <ArgumentItem
              key={idx}
              index={idx + 1}
              content={item.content}
              scores={item.scores}
              categoryType={categoryType}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No arguments found matching your criteria.</p>
      )}
    </div>
  );
};

// Main ReasonRank Template Component
const ReasonRankTemplate = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState("all");

  // Sample data - in production, this would come from API
  const sampleData = {
    supporting: [
      {
        content: "Strong empirical evidence supports this conclusion",
        scores: {
          overall: 92,
          logical: 95,
          linkage: 88,
          importance: 93,
        },
      },
      {
        content: "Multiple independent studies confirm this finding",
        scores: {
          overall: 85,
          logical: 87,
          linkage: 82,
          importance: 86,
        },
      },
    ],
    opposing: [
      {
        content: "Methodology has significant limitations",
        scores: {
          overall: 78,
          logical: 80,
          linkage: 75,
          importance: 79,
        },
      },
      {
        content: "Alternative explanations are not adequately addressed",
        scores: {
          overall: 65,
          logical: 70,
          linkage: 60,
          importance: 66,
        },
      },
    ],
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(sampleData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reason-rank-data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">ReasonRank Analysis</h1>
        <p className="text-gray-600">
          Evaluate arguments based on logical coherence, linkage strength, and importance
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search arguments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Scores</option>
            <option value="high">High (90+)</option>
            <option value="medium">Medium (70-89)</option>
            <option value="low">Low (&lt;70)</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>📥</span> Export Data
        </button>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ContentSection
          title="Supporting Arguments"
          items={sampleData.supporting}
          searchTerm={searchTerm}
          filterOption={filterOption}
          categoryType="supporting"
        />
        <ContentSection
          title="Opposing Arguments"
          items={sampleData.opposing}
          searchTerm={searchTerm}
          filterOption={filterOption}
          categoryType="opposing"
        />
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold text-lg mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">
              {sampleData.supporting.length}
            </div>
            <div className="text-sm text-gray-600">Supporting</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">
              {sampleData.opposing.length}
            </div>
            <div className="text-sm text-gray-600">Opposing</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {(
                sampleData.supporting.reduce((sum, item) => sum + item.scores.overall, 0) /
                sampleData.supporting.length
              ).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Support Score</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {(
                sampleData.opposing.reduce((sum, item) => sum + item.scores.overall, 0) /
                sampleData.opposing.length
              ).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Opposition Score</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReasonRankTemplate;
