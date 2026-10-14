"""Read-only decoded bank identity audit from untouched distribution archives."""
import argparse,hashlib,json,zipfile
from extract import unpack,resources
p=argparse.ArgumentParser();p.add_argument('legacy');p.add_argument('modern');p.add_argument('--text',action='store_true');a=p.parse_args()
rows=[]
with zipfile.ZipFile(a.legacy) as old,zipfile.ZipFile(a.modern) as new:
 for name in ['GAME.PRE','MAIN.RES','MISC.PRE','TEDIT.PRE']+[f'OPP{i}.PRE' for i in range(1,7)]:
  sources=[old.read(name),new.read(name)]
  banks=[resources(unpack(b) if name.endswith('.PRE') else b) for b in sources]
  shared=set(banks[0])&set(banks[1]);changed=[]
  for key in sorted(shared):
   x,y=banks[0][key],banks[1][key]
   if x!=y:
    item=dict(id=key,oldBytes=len(x),newBytes=len(y),changedBytes=sum(c!=d for c,d in zip(x,y))+abs(len(x)-len(y)))
    if a.text and key.startswith(('e','gver')):item.update(oldText=x.split(b'\0')[0].decode('cp437'),newText=y.split(b'\0')[0].decode('cp437'))
    changed.append(item)
  changed_shared=len(changed)
  if a.text:
   for key in sorted(set(banks[1])-shared):changed.append(dict(id=key,newText=banks[1][key].split(b'\0')[0].decode('cp437')))
  rows.append(dict(bank=name,oldEntries=len(banks[0]),newEntries=len(banks[1]),identical=len(shared)-changed_shared,changed=changed,oldOnly=sorted(set(banks[0])-shared),newOnly=sorted(set(banks[1])-shared)))
print(json.dumps(rows,indent=2))
