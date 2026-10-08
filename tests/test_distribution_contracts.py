import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CORE=ROOT/'.yaaw-core'; SYSTEM=CORE/'system'
KERNEL=json.loads((SYSTEM/'kernel.yaml').read_text())

class DistributionContractsTest(unittest.TestCase):
    def test_compact_system_is_only_package_managed_semantic_surface(self):
        self.assertEqual({p.name for p in SYSTEM.iterdir()},{'SYSTEM.md','kernel.yaml','roles','modules','schemas','templates','engine'})
        for name in ('core','workflows','rules','registries','expertise','tools'):
            self.assertFalse((SYSTEM/name).exists())

    def test_one_root_paths_have_no_global_state(self):
        paths=KERNEL['paths']
        self.assertEqual(paths['workspace_root'],'.')
        self.assertEqual(paths['system_root'],'.yaaw-core/system')
        self.assertEqual(paths['project_root'],'.yaaw-core/project')
        self.assertEqual(paths['runtime_root'],'.yaaw-core/runtime')
        self.assertEqual(paths['install_root'],'.yaaw-core/install')
        self.assertNotIn('state',paths)

    def test_framework_runtime_is_package_managed(self):
        for rel in ('SYSTEM.md','kernel.yaml','engine/integrity.mjs','engine/repository-identity.mjs','engine/routing.mjs','engine/runtime.mjs'):
            self.assertTrue((SYSTEM/rel).is_file(),rel)

    def test_provider_adapter_directories_are_generated(self):
        for name in ('.agents','.codex','.claude','.gemini','.cline'):
            self.assertFalse((ROOT/name).exists(),name)

    def test_bootstraps_are_thin_and_compact(self):
        root=ROOT/'installer/templates/bootstrap'
        for name in ('codex.md','claude-code.md','gemini-cli.md','cline.md'):
            text=(root/name).read_text()
            for marker in ('.yaaw-core/system/SYSTEM.md','.yaaw-core/system/kernel.yaml','.yaaw-core/system/engine/runtime.mjs'):
                self.assertIn(marker,text)
            self.assertLessEqual(len(text.splitlines()),30)

    def test_no_live_legacy_yaaw_root_references(self):
        legacy=re.compile(r'(?<!-)\.yaaw/')
        for base in (CORE,ROOT/'skills',ROOT/'src',ROOT/'installer'):
            for path in base.rglob('*'):
                if path.is_file() and path.suffix.lower() in {'.md','.json','.ts','.mjs','.yaml'}:
                    self.assertIsNone(legacy.search(path.read_text(errors='ignore')),str(path))

if __name__=='__main__': unittest.main()
