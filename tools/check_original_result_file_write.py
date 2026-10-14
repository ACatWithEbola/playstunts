"""DOS services simulated in memory; no filesystem access or real interrupts."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INTR
from unicorn.x86_const import *
results=[]
for path,segment,start in [(a.legacy,0x209e,0x3961),(a.modern,0x20e5,0x3ae7)]:
 image=path.read_bytes();rows=[]
 for length,mode in itertools.product([0,1,364,16384,16385,65535,65536,70000],['success','create-fail','write-fail','short-write']):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
  payload=bytes(index%251 for index in range(length));m.mem_write(0x80000,payload)
  m.mem_write(0x61000,b'TEST.HIG\0');m.mem_write(0x6efc0,bytes(64))
  m.mem_write(0x6f000,struct.pack('<7H',0x1000,0,0x1000,0,0x8000,length&65535,length>>16))
  events=[];written=bytearray()
  def syscall(machine,number,user):
   assert number==0x21
   service=machine.reg_read(UC_X86_REG_AH);carry=False;answer=0
   if service==0x3c:events.append('create');carry=mode=='create-fail';answer=7 if carry else 5
   elif service==0x40:
    count=machine.reg_read(UC_X86_REG_CX);at=machine.reg_read(UC_X86_REG_DS)*16+machine.reg_read(UC_X86_REG_DX)
    events.append(('write',count));carry=mode=='write-fail';answer=7 if carry else count-(1 if mode=='short-write' else 0)
    if not carry:written.extend(bytes(machine.mem_read(at,answer)))
   elif service==0x3e:events.append('close')
   elif service==0x41:events.append('delete')
   else:raise AssertionError(('Unexpected DOS service',service))
   machine.reg_write(UC_X86_REG_AX,answer);flags=machine.reg_read(UC_X86_REG_EFLAGS);machine.reg_write(UC_X86_REG_EFLAGS,(flags|1) if carry else (flags&~1))
  m.hook_add(UC_HOOK_INTR,syscall)
  for reg,value in [(UC_X86_REG_CS,segment),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
  m.emu_start(segment*16+start,0x1000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  result=m.reg_read(UC_X86_REG_AX)
  failed=mode=='create-fail' or length>0 and mode in ('write-fail','short-write')
  assert result==(1 if mode=='short-write' and failed else 7 if failed else 0)
  assert ('delete' in events)==failed
  if not failed:assert bytes(written)==payload
  rows.append({'length':length,'mode':mode,'result':result,'events':events,'writtenBytes':len(written)})
 assert path.read_bytes()==image
 results.append(rows)
assert results[0]==results[1]
print(json.dumps({'originalWriteCases':len(results[0])*2,'successShortWriteAndFailureMatch':True,'chunkedWritesVerified':True,'noRealFileAccess':True,'sourcesUnchanged':True,'pass':True}))
