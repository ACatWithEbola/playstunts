"""Complete type-2 decoder including out-of-line post-return paths."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);rows=[]
fields={0x4092:0x4218,0x40b2:0x4238,0x40d2:0x4258}
for index,(path,base,start) in enumerate([(a.legacy,0x209e0,0x41d2),(a.modern,0x20e50,0x4358)]):
 image=path.read_bytes();ops=list(d.disasm(image[base+start:base+start+649],start));assert sum(i.size for i in ops)==649 and ops[-1].mnemonic=='retf'
 assert image[base+start+664:base+start+667]==bytes.fromhex('558bec')
 anchors={i.address:n for n,i in enumerate(ops)};row=[]
 for i in ops:
  assert i.mnemonic not in ('call','lcall','int','ljmp')
  operand=i.op_str
  if i.mnemonic.startswith(('j','loop')):assert int(operand,16) in anchors,(hex(i.address),operand);operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  row.append((i.mnemonic,operand))
 rows.append(row)
assert rows[0]==rows[1]
print(json.dumps({'type2DecoderBytes':649,'pairedInstructions':len(rows[0]),'allBranchesClosed':True,'noHelperCalls':True,'completeBodyMatches':True,'executionNotInferred':True,'pass':True}))
