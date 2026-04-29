package com.ideastockexchange.app.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Subset of /api/beliefs and /api/beliefs/[id] needed to traverse the
// reasons-to-agree / reasons-to-disagree graph and surface the cost-benefit
// columns. Mirrors ios/Sources/Native/Models.swift — when a new field is
// needed on either platform, add it here too.

@Serializable
data class BeliefListResponse(
    val beliefs: List<BeliefSummary> = emptyList(),
    val count: Int = 0,
)

@Serializable
data class BeliefSummary(
    @SerialName("belief_id") val beliefId: String,
    @SerialName("canonical_text") val canonicalText: String,
    val slug: String? = null,
    @SerialName("parent_topic_id") val parentTopicId: String? = null,
    @SerialName("spectrum_coordinates") val spectrumCoordinates: SpectrumCoordinates? = null,
)

@Serializable
data class SpectrumCoordinates(
    val valence: Int? = null,
    val specificity: Int? = null,
    val intensity: Int? = null,
)

@Serializable
data class BeliefDetailResponse(
    val belief: BeliefDetail,
    val scores: BeliefScores,
)

@Serializable
data class BeliefDetail(
    val id: Int,
    val slug: String? = null,
    val statement: String,
    val category: String? = null,
    val subcategory: String? = null,
    val arguments: List<Argument> = emptyList(),
    val costBenefitAnalysis: CostBenefitAnalysis? = null,
    val impactAnalysis: ImpactAnalysis? = null,
)

@Serializable
data class BeliefScores(
    val totalPro: Double? = null,
    val totalCon: Double? = null,
    val totalSupportingEvidence: Double? = null,
    val totalWeakeningEvidence: Double? = null,
    val overallScore: Double? = null,
    val cbaLikelihoodScore: Double? = null,
    val claimStrength: Double? = null,
    val strengthAdjustedScore: Double? = null,
)

@Serializable
data class Argument(
    val id: Int,
    val side: String,
    val linkageScore: Double = 0.0,
    val impactScore: Double = 0.0,
    val importanceScore: Double = 0.0,
    val belief: ChildBelief,
) {
    val isPro: Boolean get() = side.equals("agree", ignoreCase = true)
}

@Serializable
data class ChildBelief(
    val id: Int,
    val slug: String? = null,
    val statement: String,
    val positivity: Double? = null,
)

@Serializable
data class CostBenefitAnalysis(
    val benefits: String? = null,
    val benefitLikelihood: Double? = null,
    val costs: String? = null,
    val costLikelihood: Double? = null,
)

@Serializable
data class ImpactAnalysis(
    val shortTermEffects: String? = null,
    val shortTermCosts: String? = null,
    val longTermEffects: String? = null,
    val longTermChanges: String? = null,
)
