"""Original modern OPL write helper, virtual ports only."""
import argparse,sys,zipfile,random,json,base64,struct
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--initialize',action='store_true');a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
with zipfile.ZipFile(a.package) as z:original=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='AD15.DRV'))
r=random.Random(19910225);rows=[]
for case in range(1 if a.initialize else 200):
 driver=bytearray(original);struct.pack_into('<H',driver,0x972,0x388);register=r.randrange(256);value=r.randrange(256);driver[0x97d+register]=value if case%2 else value^255
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,bytes(driver));m.mem_write(0x6f000,struct.pack('<H',0xf000));writes=[]
 def out(machine,port,size,value,user):writes.append([port,value])
 def inp(machine,port,size,user):return 0
 m.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 for reg,n in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_AX,register*256+value)]:m.reg_write(reg,n)
 m.emu_start(0x2003f if a.initialize else 0x207c7,0x2f000,count=100000);assert m.reg_read(UC_X86_REG_SP)==0xf002
 rows.append(dict(initialize=a.initialize,register=register,value=value,before=base64.b64encode(driver).decode(),after=base64.b64encode(bytes(m.mem_read(0x20000,len(driver)))).decode(),writes=writes))
with a.output.open('x') as f:json.dump(rows,f)
print(str(len(rows))+' original AD15 cases captured with virtual ports only')
