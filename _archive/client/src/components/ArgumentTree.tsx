import React, { useState } from 'react';
import ArgumentNode from './ArgumentNode';
import './ArgumentTree.css';

interface Argument {
  id: string;
  content: string;
  position: 'PRO' | 'CON' | 'NEUTRAL';
  author: {
    id: string;
    username: string;
  };
  media: any[];
  children?: Argument[];
  reasonRank?: number;
  truthScore?: number;
  importanceScore?: number;
  relevanceScore?: number;
  _count: {
    children: number;
    votes: number;
  };
}

interface ArgumentTreeProps {
  arguments: Argument[];
  onRefresh: () => void;
}

const ArgumentTree: React.FC<ArgumentTreeProps> = ({ arguments, onRefresh }) => {
  // Group arguments by position
  const proArguments = arguments.filter(arg => arg.position === 'PRO');
  const conArguments = arguments.filter(arg => arg.position === 'CON');
  const neutralArguments = arguments.filter(arg => arg.position === 'NEUTRAL');

  return (
    <div className="argument-tree">
      {proArguments.length > 0 && (
        <div className="argument-section pro-section">
          <h3 className="section-title pro-title">Pro Arguments</h3>
          {proArguments.map(arg => (
            <ArgumentNode
              key={arg.id}
              argument={arg}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {conArguments.length > 0 && (
        <div className="argument-section con-section">
          <h3 className="section-title con-title">Con Arguments</h3>
          {conArguments.map(arg => (
            <ArgumentNode
              key={arg.id}
              argument={arg}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {neutralArguments.length > 0 && (
        <div className="argument-section neutral-section">
          <h3 className="section-title neutral-title">Informational</h3>
          {neutralArguments.map(arg => (
            <ArgumentNode
              key={arg.id}
              argument={arg}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArgumentTree;
