"""Original MT15 instrument callback with virtual ready MPU ports only."""
import argparse,sys,zipfile,struct,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path);p.add_argument('--initialize',action='store_true');p.add_argument('--program',type=int,default=5);a=p.parse_args();sys.path.insert(0,str(a.libraries))
assert 0<=a.program<=255,'Program must fit original unmasked byte'
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
rows=[]
for index,path in enumerate([a.legacy,a.modern]):
 with zipfile.ZipFile(path) as z:driver=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='MT15.DRV'))
 for channel in ([0] if a.initialize else range(16)):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,driver)
  patch=bytearray(100);patch[18]=12;patch[68]=a.program;patch[69]=77;patch[70]=64;m.mem_write(0x90100,bytes(patch));m.mem_write(0x6f000,struct.pack('<7H',0,0x5000,channel,0xa036,0x801e,0x100,0x9000));writes=[]
  def out(machine,port,size,value,user):writes.append([port,value])
  def inp(machine,port,size,user):return 0
  m.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x20000 if a.initialize else 0x20021,0x50000,count=2000000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  rows.append(dict(engine='ms-1991' if index else 'ms-1990',channel=channel,writes=writes,patch=list(patch),result=m.reg_read(UC_X86_REG_AX),virtualOnly=True))
if a.output:
 with a.output.open('x') as f:json.dump(rows,f)
 print(str(len(rows))+' original MT15 callbacks captured, virtual ports only')
else:print(json.dumps(rows))
