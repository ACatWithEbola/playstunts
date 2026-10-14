"""All distribution model banks versus both releases and actual browser assets.
This verifies model data, not every executable geometry helper or renderer."""
import argparse,hashlib,json,zipfile
from pathlib import Path
from extract import unpack,resources,shape
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('assets',type=Path);a=p.parse_args()
digest=lambda data:hashlib.sha256(data).hexdigest()
before=[digest(path.read_bytes()) for path in [a.legacy,a.modern,a.assets]]
web=json.loads(a.assets.read_text())['shapes'];rows=[]
catalog_root=a.assets.parent/'original-resources'
catalog=json.loads((catalog_root/'manifest.json').read_text())['files']
with zipfile.ZipFile(a.legacy) as old,zipfile.ZipFile(a.modern) as new:
 def inventory(archive):
  result={}
  for name in archive.namelist():
   if name.upper().endswith('.P3S'):
    key=Path(name).name.upper();assert key not in result;result[key]=name
  return result
 left,right=inventory(old),inventory(new);assert set(left)==set(right),'Added/removed model banks require classification'
 for name in sorted(left):
  old_packed=old.read(left[name]);new_packed=new.read(right[name])
  entry=catalog[name];browser_packed=(catalog_root/entry['file']).read_bytes()
  assert browser_packed==old_packed==new_packed,'Native supplied model resource differs: '+name
  assert len(browser_packed)==entry['bytes'] and digest(browser_packed)==entry['sha256']
  old_bytes=unpack(old_packed);new_bytes=unpack(new_packed)
  assert old_bytes==new_bytes,'Changed geometry bank needs version routing: '+name
  bank=resources(new_bytes);expected={key:shape(data) for key,data in bank.items()}
  assert web[Path(name).stem]==expected,'Browser model geometry differs: '+name
  rows.append({'bank':name,'models':len(bank),'decodedBytes':len(new_bytes),'sha256':digest(new_bytes)})
 assert set(web)=={Path(name).stem for name in left},'Browser model set differs from original distribution'
assert before==[digest(path.read_bytes()) for path in [a.legacy,a.modern,a.assets]]
print(json.dumps({'modelBanks':len(rows),'models':sum(row['models'] for row in rows),'bothOriginalsIdentical':True,'allBrowserModelsMatch':True,'allNativePackedBanksMatch':True,'sourceUnchanged':True,'executableGeometryNotInferred':True,'banks':rows}))
