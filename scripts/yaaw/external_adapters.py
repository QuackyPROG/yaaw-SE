"""Typed external tracker/provider observations with stable identity and observed-state rules."""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone

class ExternalObservationError(ValueError): pass

@dataclass(frozen=True)
class AdapterContract:
    id: str
    kind: str
    stable_identity_field: str
    observed_state_only: bool=True
    semantic_authority: str="EVIDENCE_ONLY"

@dataclass(frozen=True)
class ExternalObservation:
    schema: str
    adapter: str
    entity_kind: str
    stable_id: str
    observed_state: str
    observed_at: str
    source_ref: str
    freshness_token: str
    authority: str="EVIDENCE_ONLY"
    def validate(self):
        if self.schema!="yaaw.external-observation/v1": raise ExternalObservationError("unsupported external observation schema")
        for name,value in (("adapter",self.adapter),("entity_kind",self.entity_kind),("stable_id",self.stable_id),("observed_state",self.observed_state),("observed_at",self.observed_at),("source_ref",self.source_ref),("freshness_token",self.freshness_token)):
            if not str(value).strip(): raise ExternalObservationError(f"{name} is required")
        if self.authority!="EVIDENCE_ONLY": raise ExternalObservationError("external observations cannot grant semantic authority")
        try: datetime.fromisoformat(self.observed_at.replace("Z","+00:00"))
        except ValueError as exc: raise ExternalObservationError("observed_at must be ISO-8601") from exc
    def fresh_against(self, freshness_token: str) -> bool: return self.freshness_token==freshness_token

def normalize_observation(contract: AdapterContract, payload: dict, *, observed_state: str, source_ref: str, freshness_token: str, observed_at: str|None=None) -> ExternalObservation:
    stable=payload.get(contract.stable_identity_field)
    if stable is None or not str(stable).strip(): raise ExternalObservationError(f"adapter {contract.id} payload lacks stable identity field {contract.stable_identity_field!r}")
    observation=ExternalObservation("yaaw.external-observation/v1",contract.id,contract.kind,str(stable),str(observed_state),observed_at or datetime.now(timezone.utc).isoformat(),str(source_ref),str(freshness_token))
    observation.validate(); return observation
