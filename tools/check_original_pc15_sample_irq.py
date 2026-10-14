"""Original sample IRQ with isolated sample bytes, virtual ports/IVT, no audio."""
import argparse,sys,zipfile,json,struct,base64,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN,UC_HOOK_CODE
from unicorn.x86_const import *
r=random.Random(19910225);rows=[];enc=lambda b:base64.b64encode(b).decode()
for index,path in enumerate([a.legacy,a.modern]):
 with zipfile.ZipFile(path) as z:original=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='PC15.DRV'))
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x70000,bytes((i*7+19)&255 for i in range(65536)));writes=[];port61=0
 def write(machine,port,size,value,user):writes.append([port,value])
 def read(machine,port,size,user):assert port==0x61;return port61
 def stop(machine,address,size,user):
  if address in [0x50000,0x50100]:machine.emu_stop()
 m.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);m.hook_add(UC_HOOK_CODE,stop,begin=0x50000,end=0x50100)
 for case in range(1000):
  before=bytearray(original);shift=10 if index else 0
  for at in [0x1c2,0x1c6,0x1c8,0x1ca,0x1cc,0x1ce,0x2d7,0x2d9]:struct.pack_into('<H',before,at+shift,r.randrange(65536))
  struct.pack_into('<H',before,0x1d0+shift,0x7000);struct.pack_into('<HH',before,0x2d3+shift,0x100,0x5000);struct.pack_into('<H',before,0x2db+shift,r.choice([0,1,2,32768,65535]));before[0x1d2+shift]=r.choice([0,1,2]);before[0x1a8]=255;before[0x2dd+shift]=r.randrange(256)
  before[0x1d3+shift:0x2d3+shift]=r.randbytes(256);port61=r.randrange(256)
  m.mem_write(0x20000,bytes(before));m.mem_write(0x60000,bytes(65536));m.mem_write(0x20,bytes.fromhex('44332211'));m.mem_write(0x6f000,struct.pack('<3H',0,0x5000,2));writes.clear()
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x20000+(0x701 if index else 0x6dc),0x80000,count=10000)
  target=m.reg_read(UC_X86_REG_CS)*16+m.reg_read(UC_X86_REG_IP);assert target in [0x50000,0x50100]
  rows.append(dict(engine='ms-1991' if index else 'ms-1990',port61=port61,before=enc(before),after=enc(bytes(m.mem_read(0x20000,len(before)))),writes=list(writes),chain=target==0x50100,vector=list(struct.unpack('<HH',bytes(m.mem_read(0x20,4))))))
with a.output.open('x') as f:json.dump(rows,f)
print('2000 original sample IRQ cases captured with virtual ports/IVT only')
