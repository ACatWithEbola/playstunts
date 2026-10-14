"""Original PC15 initialization in isolated RAM; port writes recorded, never played."""
import argparse,sys,zipfile,json,base64
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
out=[]
for path in [a.legacy,a.modern]:
 with zipfile.ZipFile(path) as z:b=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='PC15.DRV'))
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,b);m.mem_write(0x6f000,bytes.fromhex('00000050'))
 writes=[]
 def write(machine,port,size,value,user):writes.append([port,size,value])
 def read(machine,port,size,user):return 0
 m.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN)
 for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
 m.emu_start(0x20000,0x50000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 out.append(dict(package=str(path),channels=m.reg_read(UC_X86_REG_AX),virtualPortWrites=writes,**(dict(before=base64.b64encode(b).decode(),after=base64.b64encode(bytes(m.mem_read(0x20000,len(b)))).decode()) if a.output else {})))
assert [r['channels'] for r in out]==[5,7]
result=dict(results=out,hardwareAccess=False,audioPlayback=False)
if a.output:
 with a.output.open('x') as f:json.dump(result,f)
 print('Original PC15 initialization snapshots retained; no hardware/audio')
else:print(json.dumps(result))
