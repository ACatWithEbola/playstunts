"""Whole disk-prompt loop: explicit index reuse, tables and color change."""
import argparse,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()];rows=[];messages=[]
fields={0x4ec2:0x50b6,0x340c:0x3414,0x3414:0x341c,0x975c:0x9c,0x975e:0x9e,0x132:0x190}
calls={'0x150c':'0x160c','0x1e0':'0x1e4','0x1820':'0x1920','0x209e, 0x15ae':'0x20e5, 0x15b0'}
for index,(image,start,size,ds,resource_table,probe_table,colour) in enumerate(zip(images,[0x2ad4,0x2d6c],[89,85],[0x32090,0x32a90],[0x340c,0x3414],[0x3414,0x341c],[0x4ec2,0x50b6])):
 ops=list(d.disasm(image[0x198d0+start:0x198d0+start+size],start));assert sum(i.size for i in ops)==size and ops[-1].mnemonic=='retf'
 if not index:
  assert [(i.mnemonic,i.op_str) for i in ops if i.address in [0x2ae7,0x2aea]]==[('mov','bx, word ptr [bp + 6]'),('shl','bx, 1')]
 else:
  assert [(i.mnemonic,i.op_str) for i in ops if i.address in [0x2d6f,0x2dbe]]==[('push','si'),('pop','si')]
 kept=[i for i in ops if i.mnemonic!='nop' and i.address not in ([0x2ae7,0x2aea] if not index else [0x2d6f,0x2dbe])]
 anchors={i.address:n for n,i in enumerate(kept)};row=[]
 for i in kept:
  operand=i.op_str
  if i.mnemonic in ('call','lcall') and not index:assert operand in calls;operand=calls[operand]
  elif i.mnemonic.startswith('j'):assert int(operand,16) in anchors;operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:
   operand=re.sub(r'\bbx\b','si',operand)
   operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  row.append((i.mnemonic,operand))
 rows.append(row);texts=[]
 for table in [resource_table,probe_table]:
  for kind in range(1,5):
   at=struct.unpack_from('<H',image,ds+table+kind*2)[0];texts.append(image[ds+at:image.index(b'\0',ds+at,ds+at+128)])
 messages.append(texts)
 assert struct.unpack_from('<H',image,ds+colour)[0]==(0x4444 if not index else 0x1111)
assert rows[0]==rows[1];assert messages[0]==messages[1]
print(json.dumps({'completeBodyBytes':[89,85],'pairedCoreInstructions':len(rows[0]),'explicitIndexReuseClassified':True,'fourResourceAndProbeStringsMatch':True,'colourChange':[0x4444,0x1111],'nestedDialogExecutionNotInferred':True,'pass':True}))
