import Foundation

/// Decoders for the subset of `/api/beliefs` and `/api/beliefs/[id]` shapes the
/// native Browse and trading-game tabs consume. Only the fields needed for
/// traversing reasons to agree / disagree, rendering scores, and pricing
/// positions are modeled — not the full canonical belief payload (Values,
/// Interests, etc.). Mirrors `android/.../model/Belief.kt`; when a new field is
/// needed on either platform, add it here too.

// MARK: - List endpoint

struct BeliefListResponse: Decodable {
    let beliefs: [BeliefSummary]
    let count: Int
}

struct BeliefSummary: Decodable, Identifiable, Hashable {
    let beliefId: String
    let canonicalText: String
    let slug: String?
    let parentTopicId: String?
    let spectrumCoordinates: SpectrumCoordinates?

    var id: String { beliefId }

    enum CodingKeys: String, CodingKey {
        case beliefId = "belief_id"
        case canonicalText = "canonical_text"
        case slug
        case parentTopicId = "parent_topic_id"
        case spectrumCoordinates = "spectrum_coordinates"
    }
}

struct SpectrumCoordinates: Decodable, Hashable {
    let valence: Int?
    let specificity: Int?
    let intensity: Int?
}

// MARK: - Detail endpoint

struct BeliefDetailResponse: Decodable {
    let belief: BeliefDetail
    let scores: BeliefScores
}

struct BeliefDetail: Decodable, Identifiable {
    let id: Int
    let slug: String?
    let statement: String
    let category: String?
    let subcategory: String?
    let arguments: [Argument]
    let costBenefitAnalysis: CostBenefitAnalysis?
    let impactAnalysis: ImpactAnalysis?
}

struct BeliefScores: Decodable {
    let totalPro: Double?
    let totalCon: Double?
    let totalSupportingEvidence: Double?
    let totalWeakeningEvidence: Double?
    let overallScore: Double?
    let cbaLikelihoodScore: Double?
    let claimStrength: Double?
    let strengthAdjustedScore: Double?
}

/// One argument in the belief's tree. `side` is "agree" or "disagree".
/// `belief` here is the *child* belief that this argument leans on — tapping
/// it lets the user traverse one level deeper.
struct Argument: Decodable, Identifiable, Hashable {
    let id: Int
    let side: String
    let linkageScore: Double
    let impactScore: Double
    let importanceScore: Double?
    let belief: ChildBelief

    var isPro: Bool { side.lowercased() == "agree" }

    static func == (lhs: Argument, rhs: Argument) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}

struct ChildBelief: Decodable, Hashable {
    let id: Int
    let slug: String?
    let statement: String
    let positivity: Double?
}

// MARK: - Cost / benefit / impact

struct CostBenefitAnalysis: Decodable, Hashable {
    let benefits: String?
    let benefitLikelihood: Double?
    let costs: String?
    let costLikelihood: Double?
}

struct ImpactAnalysis: Decodable, Hashable {
    let shortTermEffects: String?
    let shortTermCosts: String?
    let longTermEffects: String?
    let longTermChanges: String?
}
