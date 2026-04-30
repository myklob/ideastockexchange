/**
 * Battlefield of Ideas — RPG stat derivation.
 *
 * Maps platform engagement and epistemic data onto game-engine attributes
 * so a renderer can treat beliefs as battlefield units and users as
 * characters. All functions in this module are pure: they take already-
 * fetched data and return numbers. Database access lives in the API
 * routes that call into here.
 *
 * Stat scales are 0-100 unless noted; level uses a logarithmic curve.
 */

export interface BeliefUnitInput {
  /** -100..+100; net score across the argument ledger */
  positivity: number;
  /** 0..1; how settled the score is under scrutiny */
  stabilityScore: number;
  /** 0..1; how strong a claim is being made (Weak..Extreme) */
  claimStrength: number;
  /** Total arguments attached to this belief (both sides) */
  argumentCount: number;
  /** Arguments asserting the belief (side === "agree") */
  agreeArgumentCount: number;
  /** Arguments opposing the belief (side === "disagree") */
  disagreeArgumentCount: number;
  /** Evidence rows linked to this belief (both sides) */
  evidenceCount: number;
  /** Legal entries with side === "supporting" */
  supportingLawsCount: number;
  /** BeliefMappings where this belief is the upstream parent */
  downstreamCount: number;
  /** BeliefMappings flowing INTO this belief with side === "support" */
  upstreamSupportCount: number;
  /** Media resources linked to this belief */
  mediaCount: number;
  /** Objective criteria attached to this belief */
  criteriaCount: number;
}

export interface BeliefUnitStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  aoe: number;
  overall: number;
  level: number;
  /** A short label for the unit class based on dominant stat. */
  unitClass: BeliefUnitClass;
  breakdown: {
    contentVolume: number;
    withstoodAttacks: boolean;
    defenseMultiplier: number;
  };
}

export type BeliefUnitClass =
  | 'Fortress'  // high defense
  | 'Striker'   // high attack
  | 'Scout'     // high speed
  | 'Beacon'    // high aoe
  | 'Bulwark'   // high hp
  | 'Recruit';  // nothing notable yet

export interface PlayerCharacterInput {
  /** LinkageVote rows authored by the user */
  linkageVoteCount: number;
  /** Average LinkageVote.score across this user's votes (0..1) */
  avgLinkageScore: number;
  /** Distinct argumentIds the user has voted on */
  distinctArgumentsVoted: number;
  /** Votes with direction === "positive" (or score >= 0.5) */
  agreeVotes: number;
  /** Votes with direction === "negative" (or score < 0.5) */
  disagreeVotes: number;
  /** Number of votes whose updatedAt > createdAt — i.e. user changed their mind */
  changedVoteCount: number;
  /** Trade rows authored by the user */
  tradeCount: number;
  /** User.realizedPnl (any sign) */
  realizedPnl: number;
  /** User.roi as a decimal (0.15 = +15%) */
  roi: number;
}

export interface PlayerCharacterStats {
  prowess: number;
  research: number;
  persuasion: number;
  wisdom: number;
  experience: number;
  level: number;
  overall: number;
  characterClass: PlayerCharacterClass;
}

export type PlayerCharacterClass =
  | 'Logician'   // prowess dominant
  | 'Scholar'    // research dominant
  | 'Diplomat'   // persuasion dominant
  | 'Sage'       // wisdom dominant
  | 'Initiate';  // not enough activity yet

/**
 * Compute battlefield-unit stats for a single belief.
 *
 * Mapping rationale:
 *   HP      ← stabilityScore (how much damage the belief can absorb).
 *   Attack  ← claimStrength × log of argument count (bold, well-argued
 *             beliefs deal heavy damage).
 *   Defense ← supporting structure: laws, agreeing arguments, upstream
 *             support. A multiplier applies if the belief stays positive
 *             despite many opposing arguments ("withstood attacks").
 *   Speed   ← total content velocity (arguments + evidence + media).
 *             We don't yet track raw view counts; content is the proxy.
 *   AoE     ← downstream dependency count (how many beliefs lean on this).
 */
export function computeBeliefUnitStats(input: BeliefUnitInput): BeliefUnitStats {
  const stability = clamp01(input.stabilityScore);
  const claim = clamp01(input.claimStrength);

  const hp = round(stability * 100);

  const argLog = Math.log2(input.argumentCount + 1);
  const attackRaw = 10 + claim * 50 + argLog * 8 + input.evidenceCount * 0.5;
  const attack = round(clamp(attackRaw, 0, 100));

  const withstoodAttacks =
    input.disagreeArgumentCount >= 3 && input.positivity > 0;
  const defenseMultiplier = withstoodAttacks ? 1.2 : 1.0;
  const defenseRaw =
    (10 +
      input.supportingLawsCount * 6 +
      input.agreeArgumentCount * 2 +
      input.upstreamSupportCount * 3) *
    defenseMultiplier;
  const defense = round(clamp(defenseRaw, 0, 100));

  const contentVolume =
    input.argumentCount + input.evidenceCount + input.mediaCount + input.criteriaCount;
  const speedRaw = 10 + Math.log2(contentVolume + 1) * 12;
  const speed = round(clamp(speedRaw, 0, 100));

  const aoe = round(clamp(input.downstreamCount * 12, 0, 100));

  const overall = round((hp + attack + defense + speed + aoe) / 5);
  const level = Math.max(1, Math.floor(1 + Math.sqrt(contentVolume / 5)));

  return {
    hp,
    attack,
    defense,
    speed,
    aoe,
    overall,
    level,
    unitClass: classifyUnit({ hp, attack, defense, speed, aoe, contentVolume }),
    breakdown: {
      contentVolume,
      withstoodAttacks,
      defenseMultiplier,
    },
  };
}

function classifyUnit(s: {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  aoe: number;
  contentVolume: number;
}): BeliefUnitClass {
  // No activity at all: the belief exists in the DB but has not entered
  // the battlefield. Classify as Recruit even if default scalar fields
  // would otherwise nudge it into Bulwark.
  if (s.contentVolume === 0 && s.defense <= 10 && s.aoe === 0) return 'Recruit';
  const peak = Math.max(s.hp, s.attack, s.defense, s.speed, s.aoe);
  if (peak < 25) return 'Recruit';
  if (peak === s.defense) return 'Fortress';
  if (peak === s.attack) return 'Striker';
  if (peak === s.aoe) return 'Beacon';
  if (peak === s.speed) return 'Scout';
  return 'Bulwark';
}

/**
 * Compute player-character stats from the activity actually tracked in the
 * schema today. LinkageVotes are the only authored content with a userId,
 * so all four stats are derived from voting activity plus trading PnL.
 *
 * When the schema later gains author tracking on Argument and Evidence,
 * upgrade callers to pass those counts here — the formula shape allows
 * dropping in `argumentsCreated` and `evidenceSubmitted` without breaking
 * existing values.
 */
export function computePlayerStats(input: PlayerCharacterInput): PlayerCharacterStats {
  const totalVotes = input.linkageVoteCount;
  const avgScore = clamp01(input.avgLinkageScore);

  const prowess = round(
    clamp(10 + avgScore * 50 + totalVotes * 0.4, 0, 100),
  );

  const research = round(
    clamp(10 + input.distinctArgumentsVoted * 2 + Math.log2(totalVotes + 1) * 4, 0, 100),
  );

  const positivePnl = Math.max(0, input.realizedPnl);
  const persuasion = round(
    clamp(10 + positivePnl / 100 + Math.max(0, input.roi) * 30 + input.tradeCount * 0.3, 0, 100),
  );

  const balance = totalVotes > 0
    ? 1 - Math.abs(input.agreeVotes - input.disagreeVotes) / totalVotes
    : 0;
  const wisdom = round(
    clamp(10 + balance * 50 + input.changedVoteCount * 4, 0, 100),
  );

  const experience =
    totalVotes * 50 +
    input.tradeCount * 25 +
    input.changedVoteCount * 75 +
    Math.max(0, input.realizedPnl) / 10;
  const level = Math.max(1, Math.floor(1 + Math.sqrt(experience / 1000)));

  const overall = round((prowess + research + persuasion + wisdom) / 4);

  return {
    prowess,
    research,
    persuasion,
    wisdom,
    experience: round(experience),
    level,
    overall,
    characterClass: classifyCharacter({ prowess, research, persuasion, wisdom }),
  };
}

function classifyCharacter(s: {
  prowess: number;
  research: number;
  persuasion: number;
  wisdom: number;
}): PlayerCharacterClass {
  const peak = Math.max(s.prowess, s.research, s.persuasion, s.wisdom);
  if (peak < 20) return 'Initiate';
  if (peak === s.prowess) return 'Logician';
  if (peak === s.research) return 'Scholar';
  if (peak === s.persuasion) return 'Diplomat';
  return 'Sage';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
