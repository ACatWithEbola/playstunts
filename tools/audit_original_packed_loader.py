"""Complete packed loader code with its two far decoder pointers kept as data."""
import argparse,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
calls={'0x209e, 0x2902':'0x20e5, 0x2946','0x209e, 0x1500':'0x20e5, 0x1502','0x209e, 0x27e0':'0x20e5, 0x2824','0x209e, 0x145c':'0x20e5, 0x145e','0x209e, 0x20aa':'0x20e5, 0x20ac','0x209e, 0x276d':'0x20e5, 0x27b1','0x209e, 0xe':'0x20e5, 6','0x209e, 0x2c3a':'0x20e5, 0x2c7e'}
fields={0x3209:0x32a9,0x24de:0x24e0,0x4627:0x46d5};rows=[];tables=[]
for index,(image,base,start,table,end) in enumerate(zip(images,[0x209e0,0x20e50],[0x23c0,0x23c2],[0x24de,0x24e0],[0x252a,0x252c])):
 ops=[]
 for low,high in [(start,table),(table+8,end)]:
  chunk=list(d.disasm(image[base+low:base+high],low));assert sum(i.size for i in chunk)==high-low;ops.extend(chunk)
 anchors={i.address:n for n,i in enumerate(ops)};row=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic=='lcall' and operand.startswith('0x') and not index:assert operand in calls;operand=calls[operand]
  elif i.mnemonic.startswith(('j','loop')):assert int(operand,16) in anchors;operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  row.append((i.mnemonic,operand))
 assert ops[-1].mnemonic=='retf';rows.append(row);tables.append(struct.unpack('<4H',image[base+table:base+table+8]))
assert rows[0]==rows[1],[(x,y) for x,y in zip(*rows) if x!=y]
assert tables==[(0x213c,0x209e,0x41d2,0x209e),(0x213e,0x20e5,0x4358,0x20e5)]
print(json.dumps({'spanBytes':362,'embeddedTableBytes':8,'decoderFarPointers':2,'pairedCodeInstructions':len(rows[0]),'completeCodeAndTableCompared':True,'decoderExecutionAccepted':False,'pass':True}))
