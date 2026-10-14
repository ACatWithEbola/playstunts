"""Original sample startup, virtual ports/IVT only; no actual playback."""
import argparse,sys,zipfile,json,struct,base64,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
r=random.Random(19910225);rows=[];enc=lambda b:base64.b64encode(b).decode()
for index,path in enumerate([a.legacy,a.modern]):
 with zipfile.ZipFile(path) as z:original=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='PC15.DRV'))
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);writes=[];ports={}
 def write(machine,port,size,value,user):writes.append([port,value]);ports[port]=value
 def read(machine,port,size,user):assert port in [0x21,0x61];return ports[port]
 m.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN)
 for case in range(1000):
  before=bytearray(original);shift=10 if index else 0;before[0x1a8]=r.choice([0,255]);struct.pack_into('<HH',before,0x2d3+shift,r.randrange(65536),r.randrange(65536));struct.pack_into('<H',before,0x2d7+shift,r.randrange(65536));before[0x2dd+shift]=r.randrange(256)
  offset=r.randrange(0xffc0);length=r.randrange(65536) if case%10 else (-offset-50)&65535;rate=r.randrange(65536);repeats=r.randrange(65536);port=r.randrange(256);mask=r.randrange(256);vector=[r.randrange(65536),r.randrange(65536)]
  m.mem_write(0x20000,bytes(before));sample=bytearray(50);struct.pack_into('<I',sample,8,length);m.mem_write(0x70000+offset,bytes(sample));m.mem_write(0x20,struct.pack('<HH',*vector));m.mem_write(0x6f000,struct.pack('<7H',0,0x5000,0,offset,0x7000,rate,repeats));writes.clear();ports.clear();ports.update({0x61:port,0x21:mask})
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x20000+(0x791 if index else 0x76c),0x50000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  rows.append(dict(engine='ms-1991' if index else 'ms-1990',before=enc(before),after=enc(bytes(m.mem_read(0x20000,len(before)))),writes=list(writes),vector=list(struct.unpack('<HH',bytes(m.mem_read(0x20,4)))),options=dict(driverSegment=0x2000,port61=port,interruptMask=mask,irqVector=dict(offset=vector[0],segment=vector[1]),sample=dict(offset=offset,segment=0x7000,length=length),rate=rate,repeats=repeats)))
with a.output.open('x') as f:json.dump(rows,f)
print('2000 original sample startups captured with virtual I/O only')
