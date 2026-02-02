/**
 * Idea Stock Exchange - Main JavaScript
 * Interactive features for the ISE platform
 */

// ===================================
// Smooth Scrolling for Internal Links
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll to sections
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add active state to TOC links
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                document.querySelectorAll('.toc-list a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        rootMargin: '-100px 0px -66%'
    });

    document.querySelectorAll('section[id]').forEach(section => {
        observer.observe(section);
    });
});

// ===================================
// Argument Tree Data Structure
// ===================================
class ArgumentTree {
    constructor() {
        this.nodes = new Map();
        this.relationships = [];
    }

    addNode(id, content, type = 'conclusion') {
        this.nodes.set(id, {
            id,
            content,
            type,
            score: 0,
            agreementArgs: [],
            disagreementArgs: []
        });
    }

    addRelationship(parentId, childId, agreementType = 'agree', linkageScore = 1.0) {
        const relationship = {
            parent: parentId,
            child: childId,
            agreementType,
            linkageScore
        };
        this.relationships.push(relationship);

        const parent = this.nodes.get(parentId);
        if (parent) {
            if (agreementType === 'agree') {
                parent.agreementArgs.push(childId);
            } else {
                parent.disagreementArgs.push(childId);
            }
        }
    }

    calculateScore(nodeId, depth = 0, maxDepth = 5) {
        if (depth > maxDepth) return 0;

        const node = this.nodes.get(nodeId);
        if (!node) return 0;

        let totalAgree = 0;
        let totalDisagree = 0;
        let totalReasons = 0;

        // Calculate scores for supporting arguments
        node.agreementArgs.forEach(argId => {
            const argScore = this.calculateScore(argId, depth + 1, maxDepth);
            const relationship = this.relationships.find(
                r => r.parent === nodeId && r.child === argId
            );
            const linkage = relationship ? relationship.linkageScore : 1.0;
            const contribution = (argScore * linkage) / (depth + 1);
            totalAgree += contribution;
            totalReasons++;
        });

        // Calculate scores for opposing arguments
        node.disagreementArgs.forEach(argId => {
            const argScore = this.calculateScore(argId, depth + 1, maxDepth);
            const relationship = this.relationships.find(
                r => r.parent === nodeId && r.child === argId
            );
            const linkage = relationship ? relationship.linkageScore : 1.0;
            const contribution = (argScore * linkage) / (depth + 1);
            totalDisagree += contribution;
            totalReasons++;
        });

        // Base case: if no arguments, assume neutral
        if (totalReasons === 0) {
            node.score = 0.5; // Neutral score
            return 0.5;
        }

        // Calculate normalized score
        const rawScore = totalAgree - totalDisagree;
        const normalizedScore = (rawScore / totalReasons + 1) / 2; // Normalize to 0-1
        node.score = Math.max(0, Math.min(1, normalizedScore));

        return node.score;
    }

    getScorePercentage(nodeId) {
        const score = this.calculateScore(nodeId);
        return Math.round((score * 2 - 1) * 100); // Convert to -100 to +100
    }

    getScoreLabel(score) {
        if (score >= 80) return 'Very Strong';
        if (score >= 60) return 'Strong';
        if (score >= 40) return 'Moderate';
        if (score >= 20) return 'Weak';
        if (score >= 0) return 'Very Weak';
        if (score >= -20) return 'Slightly Against';
        if (score >= -40) return 'Against';
        if (score >= -60) return 'Strongly Against';
        return 'Very Strongly Against';
    }
}

// ===================================
// Interactive Argument Viewer
// ===================================
class ArgumentViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tree = new ArgumentTree();
    }

    render(rootNodeId) {
        if (!this.container) return;

        const node = this.tree.nodes.get(rootNodeId);
        if (!node) return;

        const score = this.tree.getScorePercentage(rootNodeId);
        const scoreLabel = this.tree.getScoreLabel(score);

        let html = `
            <div class="argument-viewer">
                <div class="argument-conclusion">
                    <h3>${node.content}</h3>
                    <div class="argument-score">
                        <span class="score-value ${score >= 0 ? 'positive' : 'negative'}">
                            ${score >= 0 ? '+' : ''}${score}
                        </span>
                        <span class="score-label">${scoreLabel}</span>
                    </div>
                </div>

                <div class="argument-columns">
                    <div class="argument-column pro-column">
                        <h4>✅ Reasons to Agree (${node.agreementArgs.length})</h4>
                        <ol>
                            ${node.agreementArgs.map(argId => {
                                const arg = this.tree.nodes.get(argId);
                                const argScore = this.tree.getScorePercentage(argId);
                                return `
                                    <li>
                                        <div class="argument-item">
                                            <span class="argument-text">${arg.content}</span>
                                            <span class="argument-mini-score ${argScore >= 0 ? 'positive' : 'negative'}">
                                                ${argScore >= 0 ? '+' : ''}${argScore}
                                            </span>
                                        </div>
                                    </li>
                                `;
                            }).join('')}
                        </ol>
                    </div>

                    <div class="argument-column con-column">
                        <h4>❌ Reasons to Disagree (${node.disagreementArgs.length})</h4>
                        <ol>
                            ${node.disagreementArgs.map(argId => {
                                const arg = this.tree.nodes.get(argId);
                                const argScore = this.tree.getScorePercentage(argId);
                                return `
                                    <li>
                                        <div class="argument-item">
                                            <span class="argument-text">${arg.content}</span>
                                            <span class="argument-mini-score ${argScore >= 0 ? 'positive' : 'negative'}">
                                                ${argScore >= 0 ? '+' : ''}${argScore}
                                            </span>
                                        </div>
                                    </li>
                                `;
                            }).join('')}
                        </ol>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }
}

// ===================================
// Example Data: WWII Decision
// ===================================
function createWWIIExample() {
    const tree = new ArgumentTree();

    // Main conclusion
    tree.addNode('wwii-join', 'The United States should have joined WWII', 'conclusion');

    // Supporting arguments
    tree.addNode('nazis-bad', 'Nazi Germany was doing bad things', 'argument');
    tree.addNode('genocide', 'Nazis were committing systematic genocide', 'argument');
    tree.addNode('defend-allies', 'Need to defend allied nations', 'argument');
    tree.addNode('stop-expansion', 'Prevent Nazi territorial expansion', 'argument');

    // Opposing arguments
    tree.addNode('lives-lost', 'Cost in American lives was too high', 'argument');
    tree.addNode('economic-burden', 'Economic burden on US economy', 'argument');
    tree.addNode('isolationism', 'America should focus on domestic issues', 'argument');

    // Sub-arguments for "genocide"
    tree.addNode('holocaust-evidence', 'Historical evidence of Holocaust', 'argument');
    tree.addNode('concentration-camps', 'Concentration camps documented', 'argument');

    // Sub-arguments against "lives lost"
    tree.addNode('greater-good', 'Sacrifice necessary for greater good', 'argument');
    tree.addNode('moral-imperative', 'Moral imperative to stop genocide', 'argument');

    // Build relationships
    tree.addRelationship('wwii-join', 'nazis-bad', 'agree', 0.90);
    tree.addRelationship('wwii-join', 'genocide', 'agree', 0.98);
    tree.addRelationship('wwii-join', 'defend-allies', 'agree', 0.85);
    tree.addRelationship('wwii-join', 'stop-expansion', 'agree', 0.88);

    tree.addRelationship('wwii-join', 'lives-lost', 'disagree', 0.75);
    tree.addRelationship('wwii-join', 'economic-burden', 'disagree', 0.60);
    tree.addRelationship('wwii-join', 'isolationism', 'disagree', 0.55);

    tree.addRelationship('genocide', 'holocaust-evidence', 'agree', 0.99);
    tree.addRelationship('genocide', 'concentration-camps', 'agree', 0.99);

    tree.addRelationship('lives-lost', 'greater-good', 'disagree', 0.80);
    tree.addRelationship('lives-lost', 'moral-imperative', 'disagree', 0.85);

    return tree;
}

// ===================================
// Voting System
// ===================================
class VotingSystem {
    constructor() {
        this.votes = new Map();
    }

    vote(argumentId, userId, value) {
        const key = `${argumentId}-${userId}`;
        this.votes.set(key, {
            argumentId,
            userId,
            value, // -1 to +1
            timestamp: Date.now()
        });
    }

    getAverageScore(argumentId) {
        let total = 0;
        let count = 0;

        this.votes.forEach(vote => {
            if (vote.argumentId === argumentId) {
                total += vote.value;
                count++;
            }
        });

        return count > 0 ? total / count : 0;
    }

    getVoteCount(argumentId) {
        let count = 0;
        this.votes.forEach(vote => {
            if (vote.argumentId === argumentId) count++;
        });
        return count;
    }
}

// ===================================
// Evidence Tiers System
// ===================================
const EvidenceTiers = {
    PEER_REVIEWED_META_ANALYSIS: { weight: 1.0, label: 'Peer-Reviewed Meta-Analysis' },
    PEER_REVIEWED_STUDY: { weight: 0.9, label: 'Peer-Reviewed Study' },
    EXPERT_CONSENSUS: { weight: 0.85, label: 'Expert Consensus' },
    VERIFIED_DATA: { weight: 0.8, label: 'Verified Statistical Data' },
    NEWS_REPORTING: { weight: 0.6, label: 'News Reporting' },
    EXPERT_OPINION: { weight: 0.7, label: 'Expert Opinion' },
    ANECDOTAL: { weight: 0.3, label: 'Anecdotal Evidence' },
    OPINION: { weight: 0.2, label: 'Personal Opinion' }
};

class Evidence {
    constructor(id, content, tier, source, url) {
        this.id = id;
        this.content = content;
        this.tier = tier;
        this.source = source;
        this.url = url;
        this.weight = EvidenceTiers[tier].weight;
    }

    getHTML() {
        return `
            <div class="evidence-item" data-tier="${this.tier}">
                <div class="evidence-tier-badge">${EvidenceTiers[this.tier].label}</div>
                <div class="evidence-content">${this.content}</div>
                <div class="evidence-source">
                    Source: <a href="${this.url}" target="_blank">${this.source}</a>
                </div>
            </div>
        `;
    }
}

// ===================================
// ReasonRank Algorithm (like PageRank)
// ===================================
class ReasonRank {
    constructor(tree) {
        this.tree = tree;
        this.ranks = new Map();
        this.dampingFactor = 0.85;
        this.iterations = 20;
    }

    calculate() {
        // Initialize all ranks to 1/N
        const N = this.tree.nodes.size;
        this.tree.nodes.forEach((node, id) => {
            this.ranks.set(id, 1 / N);
        });

        // Iteratively calculate ranks
        for (let i = 0; i < this.iterations; i++) {
            const newRanks = new Map();

            this.tree.nodes.forEach((node, id) => {
                let rank = (1 - this.dampingFactor) / N;

                // Add contributions from supporting arguments
                node.agreementArgs.forEach(argId => {
                    const argNode = this.tree.nodes.get(argId);
                    const outLinks = argNode.agreementArgs.length + argNode.disagreementArgs.length;
                    if (outLinks > 0) {
                        rank += this.dampingFactor * (this.ranks.get(argId) / outLinks);
                    }
                });

                // Add contributions from opposing arguments (with negative weight)
                node.disagreementArgs.forEach(argId => {
                    const argNode = this.tree.nodes.get(argId);
                    const outLinks = argNode.agreementArgs.length + argNode.disagreementArgs.length;
                    if (outLinks > 0) {
                        rank += this.dampingFactor * (this.ranks.get(argId) / outLinks) * 0.5;
                    }
                });

                newRanks.set(id, rank);
            });

            this.ranks = newRanks;
        }

        return this.ranks;
    }

    getRank(nodeId) {
        return this.ranks.get(nodeId) || 0;
    }
}

// ===================================
// Interactive Demo Setup
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Create example argument tree
    const exampleTree = createWWIIExample();

    // Calculate scores
    console.log('WWII Decision Score:', exampleTree.getScorePercentage('wwii-join'));

    // Example of how to use the ArgumentViewer
    // Uncomment and add <div id="argument-demo"></div> to HTML to see it
    // const viewer = new ArgumentViewer('argument-demo');
    // viewer.tree = exampleTree;
    // viewer.render('wwii-join');

    // Add interactivity to score badges
    document.querySelectorAll('.score-badge, .score-inline').forEach(element => {
        element.addEventListener('click', function() {
            const score = this.textContent.match(/[+-]?\d+/);
            if (score) {
                console.log('Score clicked:', score[0]);
                // Could expand to show more details about the score
            }
        });
    });

    // Back to top button
    const backToTop = document.createElement('button');
    backToTop.innerHTML = '↑ Top';
    backToTop.className = 'back-to-top';
    backToTop.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background: var(--primary-blue);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1000;
    `;

    document.body.appendChild(backToTop);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.style.opacity = '1';
        } else {
            backToTop.style.opacity = '0';
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// ===================================
// Export for Node.js (if needed)
// ===================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ArgumentTree,
        ArgumentViewer,
        VotingSystem,
        Evidence,
        EvidenceTiers,
        ReasonRank
    };
}
