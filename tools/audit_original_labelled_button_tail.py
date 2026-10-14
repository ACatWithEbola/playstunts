"""Complete labelled-button text tail after symbolically verified border prefix."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);rows=[]
fields={0xae50:0xb0e6,0x51b0:0x4f1a}
calls={'0x209e, 0x9130':'0x20e5, 0x92b8','0x1540':'0x1640','0x1ec1, 0x1738':'0x1f07, 0x1740','0x209e, 0x3c99':'0x20e5, 0x3e1f','0x209e, 0x5de6':'0x20e5, 0x5f6e'}
for index,(path,start) in enumerate([(a.legacy,0x1ed0),(a.modern,0x1f80)]):
 image=path.read_bytes();ops=list(d.disasm(image[0x198d0+start:0x198d0+start+244],start));assert sum(i.size for i in ops)==244 and ops[-1].mnemonic=='retf'
 anchors={i.address:n for n,i in enumerate(ops)};row=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic in ('call','lcall') and not index:assert operand in calls;operand=calls[operand]
  elif i.mnemonic.startswith(('j','loop')):assert int(operand,16) in anchors;operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  row.append((i.mnemonic,operand))
 rows.append(row)
assert rows[0]==rows[1]
print(json.dumps({'textTailBytes':244,'pairedInstructions':len(rows[0]),'allBranchesClosed':True,'completeBodyMatches':True,'nestedPixelExecutionNotInferred':True,'pass':True}))
