"""Original file-search helper, including failure tail; DOS search entirely simulated."""
import argparse,itertools,json,re,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INTR
from unicorn.x86_const import *
d=Cs(CS_ARCH_X86,CS_MODE_16);normalized=[];cases=0
fields={0x3fdc:0x408a,0x3f76:0x4024,0x3fda:0x4088,0x3ffa:0x40a8}
for index,(path,segment,start,dta,output) in enumerate([(a.legacy,0x209e,0x15ae,0x3fdc,0x3f76),(a.modern,0x20e5,0x15b0,0x408a,0x4024)]):
 image=path.read_bytes();ops=list(d.disasm(image[segment*16+start:segment*16+start+90],start));assert sum(i.size for i in ops)==90
 anchors={i.address:n for n,i in enumerate(ops)};rows=[]
 for i in ops:
  operand=i.op_str
  if i.mnemonic.startswith(('j','loop')):operand='instruction:'+str(anchors[int(operand,16)])
  elif not index:operand=re.sub(r'0x[0-9a-f]+',lambda m:hex(fields.get(int(m[0],16),int(m[0],16))),operand)
  rows.append((i.mnemonic,operand))
 normalized.append(rows)
 for pattern,name,found in itertools.product(['*.HIG','C:*.HIG','C:\\SAVES\\*.HIG','C:/SAVES/*.HIG'],['TEST.HIG','RUN.RPL'],[False,True]):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  m.mem_write(0x65000,pattern.encode()+b'\0');m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,0x5000));events=[]
  def interrupt(machine,number,user):
   assert number==0x21;ah=machine.reg_read(UC_X86_REG_AH);events.append(ah)
   if ah==0x1a:assert machine.reg_read(UC_X86_REG_DX)==dta
   else:
    assert ah==0x4e and machine.reg_read(UC_X86_REG_CL)==6 and machine.reg_read(UC_X86_REG_DX)==0x5000
    flags=machine.reg_read(UC_X86_REG_EFLAGS);machine.reg_write(UC_X86_REG_EFLAGS,(flags&~1) if found else flags|1)
    machine.reg_write(UC_X86_REG_AX,0 if found else 2)
    if found:machine.mem_write(0x60000+dta+30,(name.encode()+b'\0').ljust(13,b'\0'))
  m.hook_add(UC_HOOK_INTR,interrupt)
  for reg,value in [(UC_X86_REG_CS,segment),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_SI,0x1234),(UC_X86_REG_DI,0x5678),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(segment*16+start,0x1000,count=10000)
  assert events==[0x1a,0x4e] and m.reg_read(UC_X86_REG_AX)==(output if found else 0)
  if found:
   end=max(pattern.rfind(':'),pattern.rfind('\\'))+1
   assert bytes(m.mem_read(0x60000+output,100)).split(b'\0')[0]==(pattern[:end]+name).encode()
  assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_DS)==0x6000 and m.reg_read(UC_X86_REG_SI)==0x1234 and m.reg_read(UC_X86_REG_DI)==0x5678
  assert bytes(m.mem_read(0x65000,len(pattern)+1))==pattern.encode()+b'\0';cases+=1
 assert path.read_bytes()==image
assert normalized[0]==normalized[1]
print(json.dumps({'complete90ByteBodiesMatch':True,'originalFileSearchCases':cases,'bothVersionsSuccessAndFailureVerified':True,'registersAndInputRetained':True,'allDOSRequestsSimulated':True,'pass':True}))
