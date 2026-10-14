"""Complete lookup and localized-name wrapper comparison; fatal UI separate."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()];results=[]
for old,new,size,segment,fields,calls,label in [
 (0x2535,0x2579,221,True,{0x3209:0x32a9,0x463e:0x46ec,0x4664:0x4712},{'0x209e, 0xe':'0x20e5, 6'},'resource directory lookup'),
 (0x150c,0x160c,51,False,{0xaeca:0xb162},{'0x209e, 0x2535':'0x20e5, 0x2579'},'localized three-character resource identifier'),
 (0x14f6,0x15f6,22,False,{}, {'0x209e, 0x2535':'0x20e5, 0x2579'},'explicit resource directory pointer wrapper'),
]:
 rows=[]
 for index,(image,start) in enumerate(zip(images,[old,new])):
  base=([0x209e0,0x20e50][index] if segment else 0x198d0)
  ops=list(d.disasm(image[base+start:base+start+size],start));assert sum(i.size for i in ops)==size and ops[-1].mnemonic=='retf'
  anchors={i.address:n for n,i in enumerate(ops)};row=[]
  for i in ops:
   operand=i.op_str
   if i.mnemonic=='lcall':
    if not index:assert operand in calls;operand=calls[operand]
   elif i.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
   elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
   row.append((i.mnemonic,operand))
  rows.append(row)
 assert rows[0]==rows[1],label
 results.append({'helper':label,'bytesPerVersion':size,'instructions':len(rows[0]),'completeBodyMatches':True})
for old,new in [(0x463e,0x46ec),(0x4664,0x4712)]:
 values=[]
 for image,base,at in zip(images,[0x32090,0x32a90],[old,new]):values.append(image[base+at:image.index(b'\0',base+at,base+at+256)])
 assert values[0]==values[1]
print(json.dumps({'helpers':results,'missingResourceMessagesMatched':2,'fatalPresentationAccepted':False,'wholeItemAccepted':False}))
