"""Read-only original route-table comparison; no executable or asset writes."""
import argparse,json,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path)
a=p.parse_args()
def read(path,base,objects):
 b=path.read_bytes()[base:base+65536];assert len(b)==65536
 result=[]
 for tile in range(198):
  at=objects+tile*14;ptr=struct.unpack_from('<H',b,at)[0]
  count=b[ptr] if ptr else 0
  assert count<=8,(tile,count)
  rows=[]
  for index in range(count):
   record=list(b[ptr+index*14:ptr+(index+1)*14]);n=record[5]
   assert n<=64,(tile,index,n)
   first=record[8]+256*record[9];second=record[10]+256*record[11]
   vectors=lambda addr:[list(struct.unpack_from('<3h',b,addr+i*6)) for i in range(n*2)] if addr else None
   vec=lambda addr:list(struct.unpack_from('<3h',b,addr))
   samples=[vec((second if direction and second else first)+n*12) for direction in (0,1)]
   directions=[vec((second if direction and second else first)+n*12+(12 if direction else 6)) for direction in (0,1)]
   rows.append(dict(record=record[:8]+record[12:],primary=vectors(first),alternate=vectors(second),samples=samples,directions=directions))
  result.append(dict(tile=tile,object=list(b[at+8:at+14]),rotation=struct.unpack_from('<H',b,at+2)[0],rows=rows))
 return result
old=read(a.legacy,0x32090,0x2018);new=read(a.modern,0x32a90,0x209e)
assert old[43]['rows'][0]['record'][5]==3 and new[43]['rows'][0]['record'][5]==2
differences=[dict(tile=x['tile'],legacy=x,modern=y) for x,y in zip(old,new) if x!=y]
assert [row['tile'] for row in differences]==list(range(40,48)), 'Unexpected route-data differences require review'
for difference in differences:
 assert difference['legacy']['rows'][0]['samples']==difference['modern']['rows'][0]['samples']
 assert difference['legacy']['rows'][0]['directions']==difference['modern']['rows'][0]['directions']
print(json.dumps(dict(comparedTiles=198,differingTiles=len(differences),differences=differences)))
