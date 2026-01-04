"""
Pydantic schemas for API request/response validation.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.models import DimensionType, ArgumentDirection


# Topic Schemas
class TopicBase(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = None


class TopicCreate(TopicBase):
    pass


class TopicResponse(TopicBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TopicWithCriteria(TopicResponse):
    criteria: List['CriterionResponse'] = []


# Criterion Schemas
class CriterionBase(BaseModel):
    name: str = Field(..., max_length=500)
    description: Optional[str] = None


class CriterionCreate(CriterionBase):
    topic_id: int


class CriterionResponse(CriterionBase):
    id: int
    topic_id: int
    overall_score: float
    validity_score: float
    reliability_score: float
    independence_score: float
    linkage_score: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CriterionWithArguments(CriterionResponse):
    dimension_arguments: List['DimensionArgumentResponse'] = []


# Dimension Argument Schemas
class DimensionArgumentBase(BaseModel):
    dimension: DimensionType
    direction: ArgumentDirection
    content: str


class DimensionArgumentCreate(DimensionArgumentBase):
    criterion_id: int
    evidence_quality: float = Field(default=50.0, ge=0, le=100)
    logical_validity: float = Field(default=50.0, ge=0, le=100)
    importance: float = Field(default=50.0, ge=0, le=100)


class DimensionArgumentUpdate(BaseModel):
    content: Optional[str] = None
    evidence_quality: Optional[float] = Field(None, ge=0, le=100)
    logical_validity: Optional[float] = Field(None, ge=0, le=100)
    importance: Optional[float] = Field(None, ge=0, le=100)


class DimensionArgumentResponse(DimensionArgumentBase):
    id: int
    criterion_id: int
    evidence_quality: float
    logical_validity: float
    importance: float
    weight: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Argument Evidence Schemas
class ArgumentEvidenceBase(BaseModel):
    source: str = Field(..., max_length=500)
    description: str
    url: Optional[str] = Field(None, max_length=1000)


class ArgumentEvidenceCreate(ArgumentEvidenceBase):
    argument_id: int
    reliability_score: float = Field(default=50.0, ge=0, le=100)


class ArgumentEvidenceResponse(ArgumentEvidenceBase):
    id: int
    argument_id: int
    reliability_score: float
    created_at: datetime

    class Config:
        from_attributes = True


# Evidence Schemas
class EvidenceBase(BaseModel):
    claim: str
    measurement_value: Optional[str] = Field(None, max_length=200)
    source: str = Field(..., max_length=500)
    url: Optional[str] = Field(None, max_length=1000)


class EvidenceCreate(EvidenceBase):
    criterion_id: int


class EvidenceResponse(EvidenceBase):
    id: int
    criterion_id: int
    weight: float
    created_at: datetime

    class Config:
        from_attributes = True


# Criteria View Schemas
class CriteriaViewWeightBase(BaseModel):
    criterion_id: int
    weight: float = Field(default=1.0, ge=0)


class CriteriaViewBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None


class CriteriaViewCreate(CriteriaViewBase):
    topic_id: int
    weights: List[CriteriaViewWeightBase]


class CriteriaViewResponse(CriteriaViewBase):
    id: int
    topic_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Score Breakdown Schemas
class ArgumentScoreInfo(BaseModel):
    id: int
    content: str
    weight: float
    evidence_quality: float
    logical_validity: float
    importance: float


class DimensionScoreBreakdown(BaseModel):
    score: float
    supporting_arguments: List[ArgumentScoreInfo]
    opposing_arguments: List[ArgumentScoreInfo]
    total_support_weight: float
    total_oppose_weight: float
    balance: float


class CriterionScoreBreakdown(BaseModel):
    criterion_id: int
    criterion_name: str
    overall_score: float
    argument_count: int
    dimensions: dict  # Maps dimension name to DimensionScoreBreakdown


# Update forward references
TopicWithCriteria.model_rebuild()
CriterionWithArguments.model_rebuild()
