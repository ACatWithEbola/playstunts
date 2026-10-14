"""Original PC15 output callback, virtual ports only, complete state comparisons."""
import argparse,sys,zipfile,json,struct,base64,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
r=random.Random(19910225);rows=[]
for index,path in enumerate([a.legacy,a.modern]):
 with zipfile.ZipFile(path) as z:original=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='PC15.DRV'))
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);writes=[];port61=0
 def write(machine,port,size,value,user):writes.append([port,value])
 def read(machine,port,size,user):assert port==0x61;return port61
 m.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN)
 for case in range(1000):
  before=bytearray(original);count=7 if index else 5;volume=0x1bd if index else 0x1b7;phase=0x1cb if index else 0x1c1;divisor=0x1af if index else 0x1ad
  for channel in range(count):
   before[0x1a8+channel]=r.choice([0,0,255]);before[volume+channel]=r.choice([0,0,127]);
   if channel:struct.pack_into('<H',before,divisor+channel*2,r.randrange(65536))
  before[phase]=r.randrange(256);port61=r.randrange(256)
  m.mem_write(0x20000,bytes(before));m.mem_write(0x6f000,bytes.fromhex('00000050'));writes.clear()
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x20030,0x50000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  rows.append(dict(engine='ms-1991' if index else 'ms-1990',port61=port61,before=base64.b64encode(before).decode(),after=base64.b64encode(bytes(m.mem_read(0x20000,len(before)))).decode(),writes=list(writes)))
with a.output.open('x') as f:json.dump(rows,f)
print('2000 original PC15 output cases captured; virtual I/O only, no audio')
