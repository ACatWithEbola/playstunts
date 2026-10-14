"""Read-only packed-resource classification; never treats decoding failure as parity."""
import argparse,json,hashlib,zipfile,struct
from pathlib import Path
from extract import unpack,resources
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);a=p.parse_args()
def digest(b):return hashlib.sha256(b).hexdigest()
before=[digest(x.read_bytes()) for x in [a.legacy,a.modern]]
def files(path):
 with zipfile.ZipFile(path) as z:
  out={}
  for name in z.namelist():
   if name.endswith('/'):continue
   key=name.split('/')[-1].upper();assert key not in out;out[key]=z.read(name)
  return out
old,new=files(a.legacy),files(a.modern);rows=[];identical_resources=[]
for name in sorted(old.keys()&new.keys()):
 if old[name]==new[name]:
  if Path(name).suffix in ['.PRE','.PES','.PVS','.P3S','.RES','.VCE']:
   identical_resources.append(dict(name=name,bytes=len(old[name]),sha256=digest(old[name])))
  continue
 row=dict(name=name,packedBytes=[len(old[name]),len(new[name])])
 if Path(name).suffix not in ['.PRE','.PES','.PVS','.P3S','.RES','.VCE']:
  row['status']='other-format-unclassified';rows.append(row);continue
 try:
  if Path(name).suffix in ['.RES','.VCE']:
   source=[old[name],new[name]];sizes=[struct.unpack_from('<I',b)[0] for b in source]
   assert all(6<=size<=len(b) for b,size in zip(source,sizes))
   decoded=[b[:size] for b,size in zip(source,sizes)]
   row['rawTrailingBytes']=[len(b)-size for b,size in zip(source,sizes)]
  else:decoded=[unpack(old[name]),unpack(new[name])]
  row.update(decodedBytes=list(map(len,decoded)),decodedHashes=list(map(digest,decoded)),status='decoded-identical' if decoded[0]==decoded[1] else 'decoded-different')
  banks=[resources(b) for b in decoded]
  row['changedEntries']=[key for key in sorted(banks[0].keys()&banks[1].keys()) if banks[0][key]!=banks[1][key]]
  row['entryDifferences']={key:dict(lengths=[len(banks[0][key]),len(banks[1][key])],hashes=[digest(banks[0][key]),digest(banks[1][key])],changedBytes=sum(x!=y for x,y in zip(banks[0][key],banks[1][key]))+abs(len(banks[0][key])-len(banks[1][key]))) for key in row['changedEntries']}
  if Path(name).suffix=='.VCE':
   row['voiceDifferences']={key:dict(lengths=[len(banks[0][key]),len(banks[1][key])],changes=[[i,x,y] for i,(x,y) in enumerate(zip(banks[0][key],banks[1][key])) if x!=y]) for key in row['changedEntries']}
  if Path(name).suffix in ['.PVS','.PES']:
   row['bitmapDifferences']={}
   for key in row['changedEntries']:
    left,right=banks[0][key],banks[1][key]
    differences=[i for i,(x,y) in enumerate(zip(left,right)) if x!=y]
    row['bitmapDifferences'][key]=dict(lengths=[len(left),len(right)],changedBytes=len(differences),firstChanged=differences[0] if differences else None,lastChanged=differences[-1] if differences else None,payloadAfter16Identical=left[16:]==right[16:])
  row['removedEntries']=sorted(banks[0].keys()-banks[1].keys());row['addedEntries']=sorted(banks[1].keys()-banks[0].keys())
 except (ValueError,IndexError,struct.error) as e:
  row['status']='decode-or-resource-parse-unverified';row['error']=str(e)
 rows.append(row)
assert before==[digest(x.read_bytes()) for x in [a.legacy,a.modern]]
print(json.dumps(dict(changedSharedFiles=len(rows),files=rows,byteIdenticalSharedResources=identical_resources,oldOnlyFiles=sorted(old.keys()-new.keys()),newOnlyFiles=sorted(new.keys()-old.keys()),sourceUnchanged=True)))
