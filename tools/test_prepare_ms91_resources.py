import base64
import json
import stat
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from prepare_ms91_resources import generate,install_missing,digest


class PreparationTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='stunts-ms91-preparation-')
        self.root=Path(self.temp.name)
        self.source=self.root/'original';self.source.mkdir()
        self.data={'DRIVER.DRV':b'own driver fixture','DEMO.RPL':b'own demo fixture'}
        for name,data in self.data.items():
            (self.source/name.lower()).write_bytes(data)
        entry=lambda name:dict(source=name,bytes=len(self.data[name]),sha256=digest(self.data[name]))
        self.recipes=dict(format='playstunts-ms91-resource-recipes-v1',outputs=[
            dict(path='driver.json',metadata=dict(source='fixture'),files=[entry('DRIVER.DRV')]),
            dict(path='bank.json',metadata={},layout='bank',files=[entry('DEMO.RPL')])])

    def tearDown(self):
        self.temp.cleanup()

    def test_directory_and_nested_zip_identical(self):
        original,used=generate(self.source,self.recipes)
        archive=self.root/'original.zip'
        with zipfile.ZipFile(archive,'w') as output:
            for name,data in self.data.items():
                output.writestr('GAME/'+name,data)
        self.assertEqual(generate(archive,self.recipes),(original,used))
        self.assertEqual(base64.b64decode(original['driver.json']['base64']),self.data['DRIVER.DRV'])

    def test_wrong_and_missing_inputs(self):
        (self.source/'driver.drv').write_bytes(b'changed original')
        with self.assertRaisesRegex(ValueError,'checksum'):
            generate(self.source,self.recipes)
        (self.source/'driver.drv').unlink()
        with self.assertRaisesRegex(ValueError,'Missing'):
            generate(self.source,self.recipes)

    def test_duplicate_and_symlink(self):
        archive=self.root/'duplicate.zip'
        with zipfile.ZipFile(archive,'w') as output:
            output.writestr('DRIVER.DRV',self.data['DRIVER.DRV'])
            output.writestr('driver.drv',self.data['DRIVER.DRV'])
        with self.assertRaisesRegex(ValueError,'Duplicate'):
            generate(archive,self.recipes)
        (self.source/'driver.drv').unlink()
        (self.source/'driver.drv').symlink_to(self.source/'demo.rpl')
        with self.assertRaisesRegex(ValueError,'regular'):
            generate(self.source,self.recipes)

    def test_zip_size_and_link(self):
        for linked in [False,True]:
            archive=self.root/('link.zip' if linked else 'size.zip')
            with zipfile.ZipFile(archive,'w') as output:
                info=zipfile.ZipInfo('DRIVER.DRV');info.create_system=3
                info.external_attr=(stat.S_IFLNK|0o777)<<16 if linked else 0
                output.writestr(info,self.data['DRIVER.DRV'] if linked else b'oversized wrong payload')
            with self.assertRaisesRegex(ValueError,'length/type'):
                generate(archive,self.recipes)

    def test_install_preflights_all_conflicts_and_preserves_identical(self):
        outputs,_=generate(self.source,self.recipes)
        target=self.root/'modules';target.mkdir()
        kept=target/'driver.json';kept.write_text(json.dumps(outputs['driver.json'],indent=4))
        before=kept.read_bytes()
        (target/'bank.json').write_text('{}')
        with self.assertRaisesRegex(ValueError,'differs'):
            install_missing(outputs,target)
        self.assertEqual(kept.read_bytes(),before)
        (target/'bank.json').unlink()
        self.assertEqual(install_missing(outputs,target),['bank.json'])
        self.assertEqual(kept.read_bytes(),before)
        self.assertEqual(install_missing(outputs,target),[])

    def test_output_path_escape_rejected(self):
        self.recipes['outputs'][0]['path']='../outside.json'
        with self.assertRaisesRegex(ValueError,'output'):
            generate(self.source,self.recipes)

    def test_cli_retains_existing_output_and_rejects_dangling_link(self):
        output=self.root/'existing';output.mkdir();(output/'keep').write_bytes(b'unchanged')
        script=Path(__file__).with_name('prepare_ms91_resources.py')
        for target in [output,self.root/'link']:
            if target.name=='link':
                target.symlink_to(self.root/'absent',target_is_directory=True)
            result=subprocess.run([sys.executable,str(script),'--original',str(self.source),'--output',str(target)],capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn('new output',result.stderr)
        self.assertEqual((output/'keep').read_bytes(),b'unchanged')
        self.assertFalse((self.root/'absent').exists())


if __name__=='__main__':
    unittest.main()
