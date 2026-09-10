import hashlib
import tempfile
import unittest
from pathlib import Path
from prepare_assets import copy_verified, source_files

class PreparationTests(unittest.TestCase):
    def test_original_not_modified_and_bad_checksum_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root);source=root/'original';source.mkdir();out=root/'output'
            f=source/'test.res';f.write_bytes(b'original')
            files=source_files(source)
            row={'source':'TEST.RES','path':'game/TEST.RES','sha256':hashlib.sha256(b'original').hexdigest()}
            self.assertEqual(copy_verified(files,[row],out),[])
            self.assertEqual((out/'game/TEST.RES').read_bytes(),b'original')
            self.assertEqual(f.read_bytes(),b'original')
            row['sha256']='0'*64
            with self.assertRaisesRegex(ValueError,'checksum'):
                copy_verified(files,[row],out)

    def test_path_escape_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root);f=root/'original';f.write_bytes(b'original')
            row={'source':'A','path':'../escape','sha256':hashlib.sha256(b'original').hexdigest()}
            with self.assertRaisesRegex(ValueError,'Invalid output path'):
                copy_verified({'A':f},[row],root/'out')
            self.assertFalse((root/'escape').exists())

    def test_missing_input_is_reported(self):
        self.assertEqual(copy_verified({},[{'source':'A','path':'game/A','sha256':'0'*64}],Path('unused')),['A'])
