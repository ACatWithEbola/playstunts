"""Bounded real-mode string-copy diagnostic, independent of game logic."""
import argparse,json,sys,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--libraries',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_MEM_READ,UC_HOOK_MEM_WRITE
from unicorn.x86_const import *
rows=[]
for code in [bytes.fromhex('f2a5'),bytes.fromhex('f3a5'),bytes.fromhex('a5a5a5')]:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x1000,code)
 m.mem_write(0x8fffe,struct.pack('<H',0x1111));m.mem_write(0x80000,struct.pack('<2H',0x2222,0x3333));m.mem_write(0x90000,struct.pack('<2H',0x4444,0x5555))
 accesses=[]
 def access(machine,kind,address,size,value,user):accesses.append({'address':hex(address),'size':size,'si':hex(machine.reg_read(UC_X86_REG_SI)),'esi':hex(machine.reg_read(UC_X86_REG_ESI))})
 m.hook_add(UC_HOOK_MEM_READ,access,begin=0x80000,end=0x90004)
 for reg,val in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x8000),(UC_X86_REG_ES,0x7000),(UC_X86_REG_SI,0xfffe),(UC_X86_REG_DI,0x1000),(UC_X86_REG_CX,3),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,val)
 m.emu_start(0x1000,0x1000+len(code),count=100)
 rows.append({'code':code.hex(),'words':list(struct.unpack('<3H',bytes(m.mem_read(0x71000,6)))),'si':m.reg_read(UC_X86_REG_SI),'accesses':accesses})
print(json.dumps(rows))
