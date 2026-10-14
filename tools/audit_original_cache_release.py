"""Compare complete cache-release wrapper, allocator body and paragraph mover."""
import argparse,json,re,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
d=Cs(CS_ARCH_X86,CS_MODE_16)
images=[a.legacy.read_bytes(),a.modern.read_bytes()]
fields={0x4b12:0x4bc0,0x4b14:0x4bc2,0x4b16:0x4bc4,0x46f5:0x47a3,0x209e:0x20e5,0x2a14:0x2a58,0x276d:0x27b1,0xe:6}
fields.update({0x9a40:0x9bc4,0x4b94:0x4c72,0x2bd9:0x2c1d})
fields.update({0x4b18:0x4bc6,0x4788:0x4836,0x46c2:0x4770,0x468a:0x4738,0x27c0:0x2804,0x2725:0x2769,0x2895:0x28d9})
fields.update({0x4723:0x47d1,0x4753:0x4801})
results=[]
for name,seg0,start0,seg1,start1,size in [
 ('wrapper',0x198d,0x14e2,0x198d,0x15e2,19),
 ('release',0x209e,0x2a14,0x20e5,0x2a58,169),
 ('mover',0x209e,0x276d,0x20e5,0x27b1,83),
 ('discard',0x209e,0x2bd9,0x20e5,0x2c1d,59),
 ('bitmap-release',0x209e,0x3900,0x20e5,0x3a86,80),
 ('allocator',0x209e,0x27e0,0x20e5,0x2824,181),
 ('compactor',0x209e,0x2895,0x20e5,0x28d9,109),
 ('cache-acquire',0x209e,0x2902,0x20e5,0x2946,274),
 ('forward-mover',0x209e,0x2725,0x20e5,0x2769,72),
 ('basename',0x209e,0x27c0,0x20e5,0x2804,32),
 ('resize',0x209e,0x2c3a,0x20e5,0x2c7e,144),
]:
 pairs=[]
 for index,(seg,start) in enumerate([(seg0,start0),(seg1,start1)]):
  body=images[index][seg*16+start:seg*16+start+size];ops=list(d.disasm(body,start))
  assert sum(i.size for i in ops)==size
  if name=='bitmap-release':
   assert ops[-1].mnemonic=='lcall' and ops[-1].op_str in ('0x209e, 0xe','0x20e5, 6')
   assert images[index][seg*16+start+size:seg*16+start+size+3]==bytes.fromhex('558bec')
  elif name in ('allocator','resize'):assert ops[-1].mnemonic=='lcall' and any(i.mnemonic=='retf' for i in ops)
  elif name=='compactor':assert ops[-1].mnemonic=='jmp' and any(i.mnemonic=='retf' for i in ops)
  else:assert ops[-1].mnemonic=='retf'
  normalized=[]
  for i in ops:
   operand=i.op_str
   if i.mnemonic.startswith('j') or i.mnemonic=='loop':
    target=int(operand,16)
    if start<=target<start+size:operand=hex(target-start)
    else:
     assert name in ('discard','resize') and target==(0x2a30 if index==0 else 0x2a74)
     operand='verified-release-fatal-tail'
   elif i.mnemonic=='lcall':
    values=[int(v.strip(),0) for v in operand.split(',')]
    operand=', '.join(hex(fields.get(v,v) if index==0 else v) for v in values)
   elif index==0:
    # Map only absolute globals and far-call operands, not BP/descriptor offsets.
    operand=re.sub(r'(?<=\[)0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
    if name=='release' and i.mnemonic=='mov' and operand=='ax, 0x46f5':operand='ax, 0x47a3'
    if name in ('allocator','resize') and i.mnemonic=='mov' and operand.startswith('ax, 0x'):
     value=int(operand[4:],16);operand='ax, '+hex(fields.get(value,value))
   normalized.append((i.mnemonic,operand))
  pairs.append(normalized)
 assert pairs[0]==pairs[1],(name,[(x,y) for x,y in zip(*pairs) if x!=y])
 results.append({'name':name,'bytes':size,'instructions':len(pairs[0]),'completeBodyMatches':True})
messages=[]
for image,base,at in zip(images,[0x32090,0x32a90],[0x4b94,0x4c72]):messages.append(image[base+at:image.index(b'\0',base+at,base+at+256)])
assert messages[0]==messages[1]
print(json.dumps({'routines':results,'nativeRuntimeNotInferred':True,'fatalUiNotVerified':True,'pass':True}))
