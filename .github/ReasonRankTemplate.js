import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faSearch, faDownload } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
      <FontAwesomeIcon
        icon={showSubScores ? faChevronUp : faChevronDown}
        className={`mt-1 text-gray-500 transition-transform duration-300 ${showSubScores ? "rotate-180" : ""}`}
      />
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
      {filteredItems.length > 0 ? 
