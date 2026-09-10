import hashlib, tempfile, unittest
from pathlib import Path
from check_assets import check
class Checks(unittest.TestCase):
    def test_missing_changed_and_matching(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d); row={'path':'sample','sha256':hashlib.sha256(b'expected').hexdigest()}
            self.assertEqual(check(p,[row]),[('MISSING','sample')])
            (p/'sample').write_bytes(b'changed')
            self.assertEqual(check(p,[row]),[('DIFFERENT','sample')])
            (p/'sample').write_bytes(b'expected')
            self.assertEqual(check(p,[row]),[])
