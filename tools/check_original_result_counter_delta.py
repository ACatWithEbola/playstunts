"""Original result counter-delta wrapper and complete nested timer helper."""
import argparse,itertools,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
d=Cs(CS_ARCH_X86,CS_MODE_16);rows=[];sizes=[];cases=0
values=[(hi<<16)|lo for hi,lo in itertools.product([0,1,65535],[0,1,32767,65535])]
fields={0x4dcc:0x4eaa,0x4dce:0x4eac,0x407a:0x4128,0x407c:0x412a}
for index,(path,seg,entry,helper,previous,current) in enumerate([(a.legacy,0x209e,0x2b5e,0x3bf0,0x4dcc,0x407a),(a.modern,0x20e5,0x2df2,0x3d76,0x4eaa,0x4128)]):
 image=path.read_bytes();ops=[]
 for i in d.disasm(image[seg*16+helper:seg*16+helper+80],helper):
  ops.append(i)
  if i.mnemonic=='retf':break
 assert len(ops)==11 and ops[-1].mnemonic=='retf'
 assert all(i.mnemonic not in ('call','lcall','int') and not i.mnemonic.startswith('j') for i in ops)
 normalized=[]
 for i in ops:
  operand=i.op_str
  if not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  normalized.append((i.mnemonic,operand))
 rows.append(normalized);sizes.append(sum(i.size for i in ops))
 wrapper=list(d.disasm(image[0x198d0+entry:0x198d0+entry+6],entry))
 assert [(i.mnemonic,i.op_str) for i in wrapper]==[('lcall',f'{hex(seg)}, {hex(helper)}'),('retf','')]
 for before,now in itertools.product(values,repeat=2):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  m.mem_write(0x60000+previous,struct.pack('<I',before));m.mem_write(0x60000+current,struct.pack('<I',now));m.mem_write(0x6f000,struct.pack('<2H',0x1000,0))
  for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(0x198d0+entry,0x1000,count=100)
  result=(m.reg_read(UC_X86_REG_DX)<<16)|m.reg_read(UC_X86_REG_AX)
  assert result==(now-before)&0xffffffff
  assert struct.unpack('<I',m.mem_read(0x60000+previous,4))[0]==now
  assert struct.unpack('<I',m.mem_read(0x60000+current,4))[0]==now and m.reg_read(UC_X86_REG_SP)==0xf004
  cases+=1
 assert path.read_bytes()==image
assert rows[0]==rows[1]
print(json.dumps({'helperBytes':sizes,'wrapperBytes':6,'originalCounterCases':cases,'completeBodiesMatch':True,'wordCarryAnd32BitWrapMatch':True,'previousCounterUpdated':True,'noHardwareAudioOrFileServices':True,'pass':True}))
