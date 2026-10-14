"""Mouse wrapper comparison/execution, with only the DOS interrupt bridge doubled."""
import argparse,itertools,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--static-only',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
d=Cs(CS_ARCH_X86,CS_MODE_16);rows=[];cases=0
fields={0x9406:0x9696,0x9408:0x9698,0x940a:0x969a,0x940c:0x969c,0x4b1c:0x4bca}
for index,(path,seg,start,buffer,scale,bridge) in enumerate([(a.legacy,0x2d2c,0x1c0,0x9406,0x4b1c,0x1ec10+0x17c0),(a.modern,0x2d8c,0x1bc,0x9696,0x4bca,0x1f070+0x17c8)]):
 image=path.read_bytes();ops=list(d.disasm(image[seg*16+start:seg*16+start+58],start));assert sum(i.size for i in ops)==58 and ops[-1].mnemonic=='retf'
 normalized=[]
 for i in ops:
  operand=i.op_str
  if not index:
   if i.mnemonic=='lcall':assert operand=='0x1ec1, 0x17c0';operand='0x1f07, 0x17c8'
   else:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  normalized.append((i.mnemonic,operand))
 rows.append(normalized)
 fixtures=[] if a.static_only else itertools.product([0,1,319,639,32768,65535],[0,199],[0,3],[0,1,2,15,16,31,32,255])
 for x,y,buttons,shift in fixtures:
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000+scale,bytes([shift]))
  def hook(uc,address,size,user):
   if address!=bridge:return
   assert struct.unpack('<H',uc.mem_read(0x60000+buffer,2))[0]==3
   uc.mem_write(0x60000+buffer+2,struct.pack('<3H',buttons,x,y))
   sp=uc.reg_read(UC_X86_REG_SP);ip,cs=struct.unpack('<2H',uc.mem_read(0x60000+sp,4))
   uc.reg_write(UC_X86_REG_SP,sp+4);uc.reg_write(UC_X86_REG_CS,cs);uc.reg_write(UC_X86_REG_IP,ip)
  m.hook_add(UC_HOOK_CODE,hook);m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,0x1000,0x1002,0x1004))
  for reg,value in [(UC_X86_REG_CS,seg),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(seg*16+start,0x1000,count=100)
  assert struct.unpack('<3H',m.mem_read(0x61000,6))==(buttons,x>>(shift&31),y)
  assert m.reg_read(UC_X86_REG_SP)==0xf004;cases+=1
 assert path.read_bytes()==image
assert rows[0]==rows[1]
print(json.dumps({'completeWrapperBytes':58,'bothBodiesMatch':True,'actualWrapperCases':cases,'staticOnly':a.static_only,'interruptBridgeExplicitlyDoubled':not a.static_only,'sourceFilesUnchanged':True,'pass':True}))
