import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  Move,
} from 'lucide-react';

// ============================================================================
// FORCE-DIRECTED GRAPH SIMULATION
// ============================================================================

// Simple force simulation (no external library required)
const useForceSimulation = (nodes, edges, width, height) => {
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (nodes.length === 0) return;

    // Initialize positions
    const initialPositions = {};
    nodes.forEach((node, i) => {
      // Arrange supporting and opposing on different sides
      const isSupporting = node.type === 'supporting';
      const baseX = isSupporting ? width * 0.25 : width * 0.75;
      const baseY = height * 0.5;

      // Add some randomness
      initialPositions[node.id] = {
        x: baseX + (Math.random() - 0.5) * 200,
        y: baseY + (Math.random() - 0.5) * height * 0.6,
        vx: 0,
        vy: 0,
      };
    });

    // Create edge lookup
    const edgeMap = {};
    edges.forEach(edge => {
      if (!edgeMap[edge.source]) edgeMap[edge.source] = [];
      if (!edgeMap[edge.target]) edgeMap[edge.target] = [];
      edgeMap[edge.source].push(edge.target);
      edgeMap[edge.target].push(edge.source);
    });

    // Simulation parameters
    const alpha = 0.3;
    const alphaDecay = 0.02;
    const velocityDecay = 0.6;
    const centerForce = 0.01;
    const repulsionForce = 3000;
    const linkDistance = 100;
    const linkStrength = 0.3;

    let currentAlpha = alpha;
    let currentPositions = { ...initialPositions };
    let animationFrame;

    const tick = () => {
      if (currentAlpha < 0.001) {
        setPositions(currentPositions);
        return;
      }

      // Apply forces
      const forces = {};
      nodes.forEach(node => {
        forces[node.id] = { x: 0, y: 0 };
      });

      // Center force - pull toward center
      nodes.forEach(node => {
        const pos = currentPositions[node.id];
        const isSupporting = node.type === 'supporting';
        const targetX = isSupporting ? width * 0.3 : width * 0.7;
        const targetY = height * 0.5;

        forces[node.id].x += (targetX - pos.x) * centerForce;
        forces[node.id].y += (targetY - pos.y) * centerForce;
      });

      // Repulsion force - push nodes apart
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const posA = currentPositions[nodeA.id];
          const posB = currentPositions[nodeB.id];

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = repulsionForce / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          forces[nodeA.id].x -= fx;
          forces[nodeA.id].y -= fy;
          forces[nodeB.id].x += fx;
          forces[nodeB.id].y += fy;
        }
      }

      // Link force - pull connected nodes together
      edges.forEach(edge => {
        const posA = currentPositions[edge.source];
        const posB = currentPositions[edge.target];
        if (!posA || !posB) return;

        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = (distance - linkDistance) * linkStrength;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        forces[edge.source].x += fx;
        forces[edge.source].y += fy;
        forces[edge.target].x -= fx;
        forces[edge.target].y -= fy;
      });

      // Apply forces and update positions
      const newPositions = {};
      nodes.forEach(node => {
        const pos = currentPositions[node.id];
        const force = forces[node.id];

        // Update velocity
        let vx = (pos.vx + force.x * currentAlpha) * velocityDecay;
        let vy = (pos.vy + force.y * currentAlpha) * velocityDecay;

        // Update position
        let x = pos.x + vx;
        let y = pos.y + vy;

        // Boundary constraints
        const margin = 50;
        x = Math.max(margin, Math.min(width - margin, x));
        y = Math.max(margin, Math.min(height - margin, y));

        newPositions[node.id] = { x, y, vx, vy };
      });

      currentPositions = newPositions;
      currentAlpha *= (1 - alphaDecay);

      setPositions({ ...currentPositions });
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [nodes, edges, width, height]);

  return positions;
};

// ============================================================================
// ARGUMENT NETWORK GRAPH COMPONENT
// ============================================================================
const ArgumentNetworkGraph = ({
  belief,
  arguments: args,
  onNodeClick,
  selectedNodeId,
  showLabels = true,
  showScores = true,
  colorByType = true,
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Convert arguments to graph nodes and edges
  const { nodes, edges } = useMemo(() => {
    const nodeList = [];
    const edgeList = [];
    const processedIds = new Set();

    const processArgument = (arg, parentId = null, depth = 0) => {
      if (processedIds.has(arg._id)) return;
      processedIds.add(arg._id);

      // Filter by type
      if (filterType !== 'all' && arg.type !== filterType) return;

      nodeList.push({
        id: arg._id,
        label: arg.content?.slice(0, 50) + (arg.content?.length > 50 ? '...' : ''),
        fullContent: arg.content,
        type: arg.type,
        score: arg.scores?.overall || 0,
        reasonRankScore: arg.reasonRankScore || 0,
        depth,
        author: arg.author?.username,
        votes: arg.votes,
      });

      if (parentId) {
        edgeList.push({
          source: parentId,
          target: arg._id,
          type: arg.type,
        });
      }

      // Process sub-arguments
      if (arg.subArguments) {
        arg.subArguments.forEach(subArg => {
          processArgument(subArg, arg._id, depth + 1);
        });
      }
    };

    args.forEach(arg => processArgument(arg, null, 0));

    return { nodes: nodeList, edges: edgeList };
  }, [args, filterType]);

  // Get positions from force simulation
  const positions = useForceSimulation(nodes, edges, dimensions.width, dimensions.height);

  // Update canvas dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw the graph on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    edges.forEach(edge => {
      const sourcePos = positions[edge.source];
      const targetPos = positions[edge.target];
      if (!sourcePos || !targetPos) return;

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.strokeStyle = edge.type === 'supporting' ? '#86efac' : '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw arrow
      const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
      const arrowSize = 8;
      const arrowX = targetPos.x - Math.cos(angle) * 25;
      const arrowY = targetPos.y - Math.sin(angle) * 25;

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = edge.type === 'supporting' ? '#86efac' : '#fca5a5';
      ctx.fill();
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions[node.id];
      if (!pos) return;

      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNode === node.id;
      const radius = 20 + (node.reasonRankScore * 15);

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);

      // Fill
      if (colorByType) {
        ctx.fillStyle = node.type === 'supporting' ? '#dcfce7' : '#fee2e2';
      } else {
        const scoreColor = node.score >= 70 ? '#dcfce7' : node.score >= 40 ? '#fef3c7' : '#fee2e2';
        ctx.fillStyle = scoreColor;
      }
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected
        ? '#3b82f6'
        : isHovered
        ? '#6366f1'
        : node.type === 'supporting'
        ? '#22c55e'
        : '#ef4444';
      ctx.lineWidth = isSelected || isHovered ? 3 : 2;
      ctx.stroke();

      // Score text inside node
      if (showScores) {
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(node.score).toString(), pos.x, pos.y);
      }

      // Label below node
      if (showLabels && (isHovered || isSelected)) {
        ctx.fillStyle = '#1f2937';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Draw background for label
        const labelWidth = ctx.measureText(node.label).width + 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(pos.x - labelWidth / 2, pos.y + radius + 5, labelWidth, 16);

        ctx.fillStyle = '#1f2937';
        ctx.fillText(node.label, pos.x, pos.y + radius + 8);
      }
    });

    // Draw belief node at center top
    if (belief) {
      const beliefX = dimensions.width / 2;
      const beliefY = 40;

      ctx.beginPath();
      ctx.arc(beliefX, beliefY, 30, 0, Math.PI * 2);
      ctx.fillStyle = '#dbeafe';
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Belief icon (target)
      ctx.beginPath();
      ctx.arc(beliefX, beliefY, 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(beliefX, beliefY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      // Draw lines from root arguments to belief
      nodes.filter(n => n.depth === 0).forEach(node => {
        const pos = positions[node.id];
        if (!pos) return;

        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(beliefX, beliefY + 30);
        ctx.lineTo(pos.x, pos.y - 20);
        ctx.strokeStyle = node.type === 'supporting' ? '#86efac' : '#fca5a5';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    ctx.restore();
  }, [nodes, edges, positions, dimensions, zoom, pan, selectedNodeId, hoveredNode, showLabels, showScores, colorByType, belief]);

  // Handle mouse interactions
  const getNodeAtPosition = useCallback((clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;

    for (const node of nodes) {
      const pos = positions[node.id];
      if (!pos) continue;

      const radius = 20 + (node.reasonRankScore * 15);
      const dx = x - pos.x;
      const dy = y - pos.y;

      if (dx * dx + dy * dy < radius * radius) {
        return node;
      }
    }

    return null;
  }, [nodes, positions, zoom, pan]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    setHoveredNode(node?.id || null);

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (node && onNodeClick) {
      // Find the original argument
      const findArg = (argList, id) => {
        for (const arg of argList) {
          if (arg._id === id) return arg;
          if (arg.subArguments) {
            const found = findArg(arg.subArguments, id);
            if (found) return found;
          }
        }
        return null;
      };
      const originalArg = findArg(args, node.id);
      if (originalArg) {
        onNodeClick(originalArg);
      }
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.5, Math.min(2, z * delta)));
  };

  const handleZoomIn = () => setZoom(z => Math.min(2, z * 1.2));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z / 1.2));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-lg p-1 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-gray-100 rounded"
            title="Reset View"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border-none focus:ring-0"
          >
            <option value="all">All Arguments</option>
            <option value="supporting">Supporting Only</option>
            <option value="opposing">Opposing Only</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-100 border-2 border-green-500" />
            <span className="text-xs text-gray-600">Supporting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-500" />
            <span className="text-xs text-gray-600">Opposing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500" />
            <span className="text-xs text-gray-600">Main Claim</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
            <span className="text-xs text-gray-500">Node size = ReasonRank</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Nodes:</span>
            <span className="font-medium">{nodes.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Edges:</span>
            <span className="font-medium">{edges.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Zoom:</span>
            <span className="font-medium">{(zoom * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-[600px]"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
        />
      </div>

      {/* Hovered Node Tooltip */}
      {hoveredNode && positions[hoveredNode] && (
        <div
          className="absolute z-20 bg-white rounded-lg shadow-xl p-3 pointer-events-none max-w-xs"
          style={{
            left: positions[hoveredNode].x * zoom + pan.x + 30,
            top: positions[hoveredNode].y * zoom + pan.y - 20,
          }}
        >
          {(() => {
            const node = nodes.find(n => n.id === hoveredNode);
            if (!node) return null;
            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      node.type === 'supporting'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {node.type === 'supporting' ? 'PRO' : 'CON'}
                  </span>
                  <span className="text-xs text-gray-500">by {node.author || 'Anonymous'}</span>
                </div>
                <p className="text-sm text-gray-800 mb-2">{node.fullContent}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Score: <strong>{Math.round(node.score)}</strong></span>
                  <span>RR: <strong>{node.reasonRankScore?.toFixed(3)}</strong></span>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ArgumentNetworkGraph;
