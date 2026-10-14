"""Optional raw reads with simulated DOS; no real file access."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--parameterized',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INTR
from unicorn.x86_const import *
results=[]
for path,segment,start in [(a.legacy,0x209e,0x20ba),(a.modern,0x20e5,0x20bc)]:
 if a.parameterized:start-=16
 image=path.read_bytes();rows=[]
 for length,mode in itertools.product([0,1,364,16384,16385,65535,65536,70000],['success','open-fail','read-fail','late-fail']):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  payload=bytes(index%251 for index in range(length));m.mem_write(0x80000,bytes([0xa5])*71000)
  m.mem_write(0x61000,b'TEST.HIG\0');m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0x1000,0,0x8000,0))
  cursor=[0];events=[];reads=[0]
  def syscall(machine,number,user):
   assert number==0x21
   service=machine.reg_read(UC_X86_REG_AH);carry=False;answer=0
   if service==0x3d:events.append('open');carry=mode=='open-fail';answer=7 if carry else 5
   elif service==0x3f:
    count=machine.reg_read(UC_X86_REG_CX);at=machine.reg_read(UC_X86_REG_DS)*16+machine.reg_read(UC_X86_REG_DX)
    carry=mode=='read-fail' or mode=='late-fail' and reads[0]>0;reads[0]+=1
    if carry:answer=7
    else:
     chunk=payload[cursor[0]:cursor[0]+count];answer=len(chunk)
     if chunk:machine.mem_write(at,chunk)
     cursor[0]+=answer
    events.append(('read',answer,carry))
   elif service==0x3e:events.append('close')
   else:raise AssertionError(('Unexpected DOS service',service))
   machine.reg_write(UC_X86_REG_AX,answer);flags=machine.reg_read(UC_X86_REG_EFLAGS);machine.reg_write(UC_X86_REG_EFLAGS,(flags|1) if carry else (flags&~1))
  m.hook_add(UC_HOOK_INTR,syscall)
  for reg,value in [(UC_X86_REG_CS,segment),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(segment*16+start,0x1000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004 and m.reg_read(UC_X86_REG_DS)==0x6000
  failed=mode in ('open-fail','read-fail') or mode=='late-fail' and length>=16384
  result=(m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_DX));assert result==((0,0) if failed else (0,0x8000))
  assert bytes(m.mem_read(0x80000,cursor[0]))==payload[:cursor[0]]
  assert bytes(m.mem_read(0x80000+cursor[0],32))==bytes([0xa5])*32,'Short reads must retain untouched bytes'
  rows.append({'length':length,'mode':mode,'result':result,'events':events,'copied':cursor[0]})
 assert path.read_bytes()==image
 results.append(rows)
assert results[0]==results[1]
print(json.dumps({'originalReadCases':len(results[0])*2,'parameterizedOptionalEntry':a.parameterized,'bothVersionsMatch':True,'shortReadTailPreserved':True,'failureAndSegmentedReadsVerified':True,'noRealFileAccess':True,'pass':True}))
