"""Cross-repository coordinated change-set contracts and dependency validation."""
from __future__ import annotations
from dataclasses import dataclass

class ChangeSetError(ValueError): pass

@dataclass(frozen=True)
class RepoChange:
    id: str
    repository: str
    work_id: str
    base_ref: str
    head_ref: str
    depends_on: tuple[str,...]=()
    required_checks: tuple[str,...]=()
    release_environment: str|None=None

@dataclass(frozen=True)
class ChangeSet:
    id: str
    state: str
    changes: tuple[RepoChange,...]
    release_order: tuple[str,...]=()
    @classmethod
    def from_dict(cls,data):
        if data.get("schema")!="yaaw.change-set/v1": raise ChangeSetError("unsupported change-set schema")
        changes=tuple(RepoChange(str(i["id"]),str(i["repository"]),str(i["work_id"]),str(i["base_ref"]),str(i["head_ref"]),tuple(str(v) for v in i.get("depends_on",[])),tuple(str(v) for v in i.get("required_checks",[])),i.get("release_environment")) for i in data.get("changes",[]))
        result=cls(str(data["id"]),str(data.get("state","DRAFT")),changes,tuple(str(v) for v in data.get("release_order",[]))); result.validate(); return result
    def validate(self):
        if self.state not in {"DRAFT","READY","INTEGRATING","DONE","CANCELLED"}: raise ChangeSetError(f"invalid change-set state {self.state!r}")
        ids=[i.id for i in self.changes]
        if len(ids)!=len(set(ids)): raise ChangeSetError("duplicate change id")
        known=set(ids)
        for item in self.changes:
            missing=set(item.depends_on)-known
            if missing: raise ChangeSetError(f"{item.id} depends on unknown changes: {', '.join(sorted(missing))}")
        if self.release_order and (set(self.release_order)!=known or len(self.release_order)!=len(known)): raise ChangeSetError("release_order must contain every change exactly once")
        if self._cycles(): raise ChangeSetError("cross-repository dependency cycle detected")
    def _cycles(self):
        graph={i.id:i.depends_on for i in self.changes}; visiting=set(); visited=set(); stack=[]; cycles=[]
        def walk(node):
            if node in visited: return
            if node in visiting: cycles.append(tuple(stack[stack.index(node):]+[node])); return
            visiting.add(node); stack.append(node)
            for dep in graph[node]: walk(dep)
            stack.pop(); visiting.remove(node); visited.add(node)
        for node in sorted(graph): walk(node)
        return cycles
    def ready_changes(self,completed): return sorted([i for i in self.changes if i.id not in completed and set(i.depends_on).issubset(completed)],key=lambda i:i.id)
    def release_sequence_valid(self,completed):
        if not self.release_order: return True
        seen=set(completed)
        for change_id in self.release_order:
            item=next(i for i in self.changes if i.id==change_id)
            if not set(item.depends_on).issubset(seen): return False
            seen.add(change_id)
        return True
