"""Complete results UI input polling bodies; hardware dependencies separate."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
fields={at:at+0xd4 for at in range(0x3382,0x3397,2)}
fields.update({0x131:0x18f,0x132:0x190,0x133:0x191,0x9f30:0xa1c8,0xac3a:0xaed2,0xabd8:0xae70,0x8d96:0x8ff4})
calls={'0x209e, 0x1af9':'0x20e5, 0x1af5','0x209e, 0x1bdc':'0x20e5, 0x1bd8','0x209e, 0x1b18':'0x20e5, 0x1b14','0x2d2c, 0x1c0':'0x2d8c, 0x1bc','0x1832':'0x1932','0x186e':'0x196e','0x2b5e':'0x2df2','0x122e':'0x132e'}
results=[]
for old,new,size,label in [(0x122e,0x132e,541,'UI input poll'),(0x194e,0x1a4e,66,'wait for released controls'),(0x1808,0x1908,24,'enable cursor')]:
 rows=[];nested=set()
 for index,(image,start) in enumerate(zip(images,[old,new])):
  ops=list(d.disasm(image[0x198d0+start:0x198d0+start+size],start))
  assert sum(i.size for i in ops)==size and ops[-1].mnemonic=='retf'
  anchors={i.address:n for n,i in enumerate(ops)};row=[]
  for i in ops:
   operand=i.op_str
   if i.mnemonic in ('call','lcall'):
    if not index:assert operand in calls;operand=calls[operand];nested.add(operand)
   elif i.mnemonic.startswith(('j','loop')):
    assert int(operand,16) in anchors;operand='instruction:'+str(anchors[int(operand,16)])
   elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
   row.append((i.mnemonic,operand))
  rows.append(row)
 assert rows[0]==rows[1],(label,[(x,y) for x,y in zip(*rows) if x!=y])
 results.append({'helper':label,'bytes':size,'instructions':len(rows[0]),'completeBodyMatches':True,'nestedCalls':sorted(nested)})
service_fields={at:at+0xae for at in range(0x430a,0x4339)}
service_fields.update({0x43dc:0x448a,0x4602:0x46b0,0x40dc:0x418a,0x415c:0x420a,0x41e2:0x4290,0x41e4:0x4292})
service_calls={'0x209e, 0x19e4':'0x20e5, 0x19e0','0x209e, 0x1bdc':'0x20e5, 0x1bd8'}
for old,new,size,label in [(0x1af9,0x1af5,31,'BIOS keyboard poll including post-return branch'),(0x1b18,0x1b14,144,'keyboard control mask'),(0x1bdc,0x1bd8,440,'joystick sampling including post-return tails'),(0x19e4,0x19e0,90,'key callback dispatch including indirect table and return tails')]:
 rows=[]
 for index,(image,base,start) in enumerate(zip(images,[0x209e0,0x20e50],[old,new])):
  ops=list(d.disasm(image[base+start:base+start+size],start));assert sum(i.size for i in ops)==size
  anchors={i.address:n for n,i in enumerate(ops)};row=[]
  for i in ops:
   operand=i.op_str
   if i.mnemonic=='lcall' and not index and operand.startswith('0x'):assert operand in service_calls;operand=service_calls[operand]
   elif i.mnemonic.startswith(('j','loop')):
    assert int(operand,16) in anchors;operand='instruction:'+str(anchors[int(operand,16)])
   elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(service_fields.get(int(m[0],16),int(m[0],16))),operand)
   row.append((i.mnemonic,operand))
  rows.append(row)
 assert rows[0]==rows[1],(label,[(x,y) for x,y in zip(*rows) if x!=y])
 results.append({'helper':label,'bytes':size,'instructions':len(rows[0]),'completeBodyMatches':True})
print(json.dumps({'helpers':results,'hardwareAndNestedExecutionAccepted':False,'pass':True}))
