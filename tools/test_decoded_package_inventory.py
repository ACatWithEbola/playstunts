"""Pin the complete changed resource set; do not infer runtime compatibility."""
import json,subprocess,sys,zipfile
from pathlib import Path
from extract import unpack,resources
if __name__ != '__main__':
 import unittest
 raise unittest.SkipTest('Standalone archive check: run with untouched MS90 and MS91 ZIP paths')
assert len(sys.argv)==3,'Provide untouched MS90 and MS91 ZIP paths'
audit=Path(__file__).with_name('audit_original_decoded_packages.py')
result=json.loads(subprocess.check_output([sys.executable,str(audit),*sys.argv[1:]]))
expected={'GAME.PRE':['emdo','emen','erbf'],'MAIN.RES':['edos','efex','emer','emrl'],
 'MISC.PRE':['emid','emop','gver'],'TEDIT.PRE':['echl','echx','emen','emss'],
 'PCENG1.VCE':['BLOW','BUMP','CRAS','SCRA','STAR','STOP'],
 'SDTITL.PVS':['titl'],'STDAJAGU.PVS':['ins3'],
 **{f'OPP{i}.PRE':['sped'] for i in range(1,7)}}
changed={row['name']:row for row in result['files'] if row['status']=='decoded-different'}
assert set(changed)==set(expected)
for name,keys in expected.items():
 row=changed[name];assert row['changedEntries']==keys,(name,row['changedEntries'])
 assert set(row['entryDifferences'])==set(keys)
 assert not row['removedEntries']
 assert row['addedEntries']==(['ejox','emrs'] if name=='MAIN.RES' else [])
 for entry in row['entryDifferences'].values():
  assert entry['changedBytes']>0 and entry['hashes'][0]!=entry['hashes'][1]
assert len(result['byteIdenticalSharedResources'])==79
assert not any(row['status']=='decode-or-resource-parse-unverified' for row in result['files'])
assert result['sourceUnchanged']
with zipfile.ZipFile(sys.argv[1]) as old,zipfile.ZipFile(sys.argv[2]) as modern:
 def bank(archive,name):
  data=archive.read(name)
  if name.endswith(('.RES','.VCE')):
   size=int.from_bytes(data[:4],'little');data=data[:size]
  else:data=unpack(data)
  return resources(data)
 classified=0
 for name,keys in expected.items():
  left,right=bank(old,name),bank(modern,name)
  for key in keys:
   a,b=left[key],right[key]
   differences=[(i,x,y) for i,(x,y) in enumerate(zip(a,b)) if x!=y]
   if name.startswith('OPP'):
    number=int(name[3]);expected_changes=[(9,[80,110,90,90,100,150][number-1],[90,120,110,120,140,175][number-1])]
    if number==6:expected_changes.extend([(11,40,60),(12,30,50)])
    assert differences==expected_changes and len(a)==len(b)==16
   elif name=='PCENG1.VCE':
    assert differences==[(12,10,20 if key in ['STAR','STOP'] else 96)] and len(a)==len(b)==93
   elif name=='STDAJAGU.PVS':
    assert differences==[(8,136,0),(10,148,0)] and a[16:]==b[16:]
   elif name=='SDTITL.PVS':
    assert [row for row in differences if row[0]<16]==[(4,144,95),(6,136,69)]
    assert len([row for row in differences if row[0]>=16])==370
    assert len(a)==len(b)==64016
   else:
    assert key.startswith('e') or key=='gver'
    assert b'\0' in a and b'\0' in b
   classified+=1
 assert classified==28
print(json.dumps({'identicalSharedResourceFiles':79,'changedDecodedResourceFiles':len(changed),
 'changedEntries':sum(len(row['changedEntries']) for row in changed.values()),
 'newEntries':2,'classifiedChangedEntries':classified,'sourceUnchanged':True,'runtimeRoutingNotInferred':True}))
