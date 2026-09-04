"""Versioned domain-pack loading, merge, install/update and compatibility semantics."""
from __future__ import annotations
import copy, hashlib, json, os, tempfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

class DomainPackError(ValueError): pass
@dataclass(frozen=True)
class DomainPack:
    data: dict[str,Any]; source: str
    @classmethod
    def load(cls,path): data=json.loads(path.read_text(encoding="utf-8")); validate_pack(data,str(path)); return cls(data,str(path))
    @property
    def name(self): return str(self.data["name"])
    @property
    def version(self): return str(self.data.get("pack_version","0.0.0"))
@dataclass(frozen=True)
class DomainPackLock:
    schema: str; name: str; pack_version: str; digest: str; source: str; harness_version: int
@dataclass(frozen=True)
class InstallPlan:
    action: str; reason: str; lock: DomainPackLock

def _semver(value):
    try: parts=tuple(int(p) for p in value.split("."))
    except ValueError as exc: raise DomainPackError(f"invalid pack version {value!r}; expected MAJOR.MINOR.PATCH") from exc
    if len(parts)!=3 or any(p<0 for p in parts): raise DomainPackError(f"invalid pack version {value!r}; expected MAJOR.MINOR.PATCH")
    return parts
def _digest(data): return "sha256:"+hashlib.sha256(json.dumps(data,sort_keys=True,separators=(",",":")).encode()).hexdigest()
def _atomic_json(path,data):
    path.parent.mkdir(parents=True,exist_ok=True); fd,tmp=tempfile.mkstemp(prefix=path.name+".",dir=path.parent)
    try:
        with os.fdopen(fd,"w",encoding="utf-8") as fh: json.dump(data,fh,indent=2,sort_keys=True); fh.write("\n"); fh.flush(); os.fsync(fh.fileno())
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
def validate_pack(data,source="<memory>"):
    if data.get("schema")!="yaaw.domain-pack/v1": raise DomainPackError(f"{source}: unsupported or missing domain-pack schema")
    if not isinstance(data.get("name"),str) or not data["name"].strip(): raise DomainPackError(f"{source}: pack name is required")
    if "pack_version" in data:
        if not isinstance(data.get("pack_version"),str): raise DomainPackError(f"{source}: pack_version must be a string")
        _semver(data["pack_version"])
    requires=data.get("requires_yaaw",{})
    if not isinstance(requires,dict): raise DomainPackError(f"{source}: requires_yaaw must be an object")
    owners={}
    for rule in data.get("ownership",[]):
        pattern=rule.get("pattern"); owner=rule.get("owner")
        if not pattern or not owner: raise DomainPackError(f"{source}: ownership rule requires pattern and owner")
        if pattern in owners and owners[pattern]!=owner: raise DomainPackError(f"{source}: conflicting owner for {pattern}: {owners[pattern]} vs {owner}")
        owners[pattern]=owner
def require_harness_compatibility(pack,harness_version):
    requires=pack.data.get("requires_yaaw",{}); minimum=int(requires.get("min_harness_version",1)); maximum=requires.get("max_harness_version")
    if harness_version<minimum: raise DomainPackError(f"{pack.name} requires yaaw harness >= {minimum}, got {harness_version}")
    if maximum is not None and harness_version>int(maximum): raise DomainPackError(f"{pack.name} requires yaaw harness <= {maximum}, got {harness_version}")
def load_lock(path):
    if not path.exists(): return None
    data=json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema")!="yaaw.domain-pack-lock/v1": raise DomainPackError(f"{path}: unsupported domain-pack lock schema")
    return DomainPackLock(**data)
def plan_install(pack,current,*,harness_version,allow_downgrade=False,allow_replace=False):
    require_harness_compatibility(pack,harness_version); lock=DomainPackLock("yaaw.domain-pack-lock/v1",pack.name,pack.version,_digest(pack.data),pack.source,harness_version)
    if current is None: return InstallPlan("INSTALL","no installed domain pack",lock)
    if current.name!=pack.name and not allow_replace: raise DomainPackError(f"installed pack is {current.name!r}; replacing with {pack.name!r} requires explicit allow_replace")
    if current.name==pack.name:
        old,new=_semver(current.pack_version),_semver(pack.version)
        if new<old and not allow_downgrade: raise DomainPackError(f"domain-pack downgrade {current.pack_version} -> {pack.version} requires explicit allow_downgrade")
        if current.digest==lock.digest: return InstallPlan("NOOP","installed digest already matches",lock)
        if new==old: return InstallPlan("UPDATE","same version with different digest; explicit source update",lock)
        return InstallPlan("UPDATE",f"version {current.pack_version} -> {pack.version}",lock)
    return InstallPlan("REPLACE",f"replace {current.name} with {pack.name}",lock)
def install_pack(source,destination,lock_path,*,harness_version,write=False,allow_downgrade=False,allow_replace=False):
    pack=DomainPack.load(source); plan=plan_install(pack,load_lock(lock_path),harness_version=harness_version,allow_downgrade=allow_downgrade,allow_replace=allow_replace)
    if write and plan.action!="NOOP": _atomic_json(destination,pack.data); _atomic_json(lock_path,asdict(plan.lock))
    return plan
def _merge_named_list(base,overlay,key,label):
    result={i[key]:copy.deepcopy(i) for i in base}
    for item in overlay:
        identity=item[key]
        if identity in result and not item.get("override",False): raise DomainPackError(f"{label} {identity!r} already exists; explicit override=true required")
        clean=copy.deepcopy(item); clean.pop("override",None); result[identity]=clean
    return list(result.values())
def merge_packs(*packs):
    if not packs: raise DomainPackError("at least one pack is required")
    merged=copy.deepcopy(packs[0].data); chain=[packs[0].source]
    for pack in packs[1:]:
        chain.append(pack.source); overlay=pack.data
        for field,key,label in (("ownership","pattern","ownership pattern"),("verification","id","verification id"),("risk_boundaries","pattern","risk pattern"),("specialists","id","specialist id"),("environments","id","environment id")): merged[field]=_merge_named_list(merged.get(field,[]),overlay.get(field,[]),key,label)
        for scalar in ("repository_map","model_profile","branch_policy","pack_version"):
            if scalar in overlay: merged[scalar]=copy.deepcopy(overlay[scalar])
        merged["name"]=overlay.get("name",merged["name"])
    validate_pack(merged," + ".join(chain)); return DomainPack(merged," -> ".join(chain))
