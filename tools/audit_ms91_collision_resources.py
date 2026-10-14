"""Read-only collision-table parity against both original releases and web assets."""
import argparse,hashlib,json,struct
from pathlib import Path
from extract import resources,unpack
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('target',type=Path);p.add_argument('web',type=Path);a=p.parse_args()
old=resources(unpack((a.legacy/'GAME.PRE').read_bytes()))
new=resources(unpack((a.target/'GAME.PRE').read_bytes()))
planes=[]
for offset in range(0,len(new['plan']),34):
    v=struct.unpack_from('<17h',new['plan'],offset)
    planes.append({'id':offset//34,'roll':v[0],'pitch':v[1],'origin':list(v[2:5]),'normal':list(v[5:8]),'rotation':list(v[8:17])})
walls=[]
for offset in range(0,len(new['wall']),6):
    v=struct.unpack_from('<3h',new['wall'],offset)
    walls.append({'id':offset//6,'orientation':v[0],'origin':list(v[1:])})
assert json.loads((a.web/'collision-planes.json').read_text())==planes,'Web plane bank differs from original MS91'
assert json.loads((a.web/'collision-walls.json').read_text())['walls']==walls,'Web wall bank differs from original MS91'
changed=sorted(key for key in set(old)|set(new) if old.get(key)!=new.get(key))
assert changed==['emdo','emen','erbf'],'Additional GAME.PRE differences require audit'
print(json.dumps({'planes':len(planes),'walls':len(walls),'originalBanksIdentical':{key:old[key]==new[key] for key in ['plan','wall']},'targetSha256':{key:hashlib.sha256(new[key]).hexdigest() for key in ['plan','wall']},'webMatchesTarget':True,'changedGameResources':{key:{'legacy':old[key].split(b'\0')[0].decode('cp437'),'target':new[key].split(b'\0')[0].decode('cp437')} for key in changed}},indent=2))
