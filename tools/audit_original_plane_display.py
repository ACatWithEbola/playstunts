"""Full patterned plane display code, indirect kernels and used data tables."""
import argparse,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()];rows=[]
fields={at:at+0x188 for at in [0x9114,0x911c,0x5b74,0x5b80,0x5b94,0x5bb4,0x5d9f,0x5db4]}
for index,(image,base,start) in enumerate(zip(images,[0x209e0,0x20e50],[0x5bfa,0x5d82])):
 ops=list(d.disasm(image[base+start:base+start+492],start));assert sum(i.size for i in ops)==492 and ops[-1].mnemonic=='jmp'
 assert image[base+start+492:base+start+495]==bytes.fromhex('558bec')
 anchors={i.address:n for n,i in enumerate(ops)};row=[]
 for i in ops:
  operand=i.op_str;assert i.mnemonic not in ('call','lcall','int','ljmp')
  if i.mnemonic.startswith(('j','loop')) and operand.startswith('0x'):assert int(operand,16) in anchors;operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  row.append((i.mnemonic,operand))
 rows.append(row)
assert rows[0]==rows[1]
for old,new,size in [(0x5b74,0x5cfc,16),(0x5b94,0x5d1c,32)]:assert images[0][0x209e0+old:0x209e0+old+size]==images[1][0x20e50+new:0x20e50+new+size]
tables=[struct.unpack('<16H',image[base+at:base+at+32]) for image,base,at in zip(images,[0x209e0,0x20e50],[0x5bb4,0x5d3c])]
assert all(y==(x+0x188 if x else 0) for x,y in zip(*tables))
assert set(tables[1])=={0,0x5eea,0x5f53}
print(json.dumps({'codeBytes':492,'pairedInstructions':len(rows[0]),'usedScheduleMasksAndPortTablesMatch':True,'indirectKernelPointersMatched':16,'postReturnKernelsIncluded':True,'hardwarePixelExecutionNotInferred':True,'pass':True}))
