import hashlib
import tempfile
import unittest
from pathlib import Path
from prepare_assets import copy_verified, source_files
from extract import extract

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

    def test_recognized_distribution_variant_is_accepted(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root);source=root/'original';source.mkdir();out=root/'output'
            f=source/'test.res';f.write_bytes(b'public-distribution')
            row={'source':'TEST.RES','path':'game/TEST.RES','sha256':hashlib.sha256(b'original').hexdigest(),'acceptedSha256':[hashlib.sha256(b'public-distribution').hexdigest()]}
            self.assertEqual(copy_verified(source_files(source),[row],out),[])
            self.assertEqual((out/'game/TEST.RES').read_bytes(),b'public-distribution')

    def test_missing_input_is_reported(self):
        self.assertEqual(copy_verified({},[{'source':'A','path':'game/A','sha256':'0'*64}],Path('unused')),['A'])

    def test_supplied_tracks_and_replays_are_catalogued(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root);source=root/'source';source.mkdir()
            (source/'DEFAULT.TRK').write_bytes(bytes(1802));(source/'RUN.RPL').write_bytes(b'replay')
            assets=extract(source,root/'decoded')
            self.assertEqual([track['name'] for track in assets['tracks']],['DEFAULT'])
            self.assertEqual(assets['replays'],[{'name':'RUN','file':'RUN.RPL','bytes':6,'sha256':hashlib.sha256(b'replay').hexdigest()}])
