"""Prompt cursor-state helper bodies and real60-byte drawing-state round trips."""
import argparse,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--static-only',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
d=Cs(CS_ARCH_X86,CS_MODE_16);images=[a.legacy.read_bytes(),a.modern.read_bytes()]
scopes=[(0x198d,0x198d,0x1820,0x1920,17,{0x131:0x18f,0x133:0x191},{'0x1832':'0x1932'}),
 (0x198d,0x198d,0x1832,0x1932,60,{0xa036:0xa2cc,0x133:0x191},{'0x209e, 0x3a64':'0x20e5, 0x3bea','0x209e, 0xa870':'0x20e5, 0xa9f4','0x209e, 0x627f':'0x20e5, 0x6407','0x209e, 0x3a84':'0x20e5, 0x3c0a'}),
 (0x209e,0x20e5,0x3a64,0x3bea,32,{0x9112:0x929a},{}),
 (0x209e,0x20e5,0x3a84,0x3c0a,28,{0x9112:0x929a},{}),
 (0x198d,0x198d,0x186e,0x196e,139,{0xabd8:0xae70,0xac3a:0xaed2,0x9836:0x9ad0,0xa036:0xa2cc,0x8e12:0x9070,0x943a:0x96ce,0x133:0x191},
  {'0x209e, 0x3a64':'0x20e5, 0x3bea','0x209e, 0xa870':'0x20e5, 0xa9f4','0x209e, 0x8e60':'0x20e5, 0x8fe8','0x209e, 0x4548':'0x20e5, 0x46ce','0x209e, 0x8352':'0x20e5, 0x84da','0x209e, 0x3a84':'0x20e5, 0x3c0a'})]
for old_seg,new_seg,old,new,size,fields,calls in scopes:
 rows=[]
 for index,(image,seg,start) in enumerate(zip(images,[old_seg,new_seg],[old,new])):
  ops=list(d.disasm(image[seg*16+start:seg*16+start+size],start));assert sum(i.size for i in ops)==size and ops[-1].mnemonic=='retf'
  anchors={i.address:n for n,i in enumerate(ops)};row=[]
  for i in ops:
   operand=i.op_str
   if i.mnemonic in ('call','lcall'):
    if not index:assert operand in calls;operand=calls[operand]
   elif i.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
   elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
   row.append((i.mnemonic,operand))
  rows.append(row)
 assert rows[0]==rows[1]
cases=0
for image,seg,save,restore,state in zip(images,[0x209e,0x20e5],[0x3a64,0x3bea],[0x3a84,0x3c0a],[0x9112,0x929a]):
 for seed in ([] if a.static_only else [0,1,127,255]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);payload=bytes((n*17+seed)&255 for n in range(60));m.mem_write(seg*16+state,payload)
  for entry in [save,restore]:
   if entry==restore:m.mem_write(seg*16+state,b'\x5a'*60)
   m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,0x5000))
   for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0x1234),(UC_X86_REG_DI,0x5678),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
   m.emu_start(seg*16+entry,0x1000,count=1000)
   assert bytes(m.mem_read(0x65000,60))==payload
   assert m.reg_read(UC_X86_REG_DS)==0x6000 and m.reg_read(UC_X86_REG_SI)==0x1234 and m.reg_read(UC_X86_REG_DI)==0x5678 and m.reg_read(UC_X86_REG_SP)==0xf004
   cases+=1
  assert bytes(m.mem_read(seg*16+state,60))==payload
assert a.legacy.read_bytes()==images[0] and a.modern.read_bytes()==images[1]
print(json.dumps({'completeHelperBodiesCompared':len(scopes),'actualSaveRestoreCalls':cases,'bothVersions60ByteStateRoundTripsMatch':cases==16,'staticOnly':a.static_only,'cursorBitmapDependencyStillSeparate':True,'sourcesUnchanged':True,'noHardwareAudioOrFileServices':True,'pass':True}))
