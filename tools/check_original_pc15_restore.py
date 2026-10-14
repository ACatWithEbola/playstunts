"""Original sample timer restore, intercepted ports and isolated virtual IVT."""
import argparse,sys,zipfile,json,struct,base64,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
r=random.Random(19910225);rows=[];enc=lambda b:base64.b64encode(b).decode()
for index,path in enumerate([a.legacy,a.modern]):
 with zipfile.ZipFile(path) as z:original=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='PC15.DRV'))
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);writes=[]
 def write(machine,port,size,value,user):writes.append([port,value])
 m.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT)
 for case in range(1000):
  before=bytearray(original);shift=10 if index else 0;before[0x1a8]=r.choice([0,255]);offset=r.choice([0,r.randrange(65536)]);segment=r.choice([0,r.randrange(65536)])
  struct.pack_into('<HH',before,0x2d3+shift,offset,segment);struct.pack_into('<H',before,0x2d7+shift,r.randrange(65536));before[0x2dd+shift]=r.randrange(256)
  m.mem_write(0x20000,bytes(before));m.mem_write(0x20,bytes.fromhex('44332211'));m.mem_write(0x6f000,struct.pack('<H',0x1000));writes.clear()
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x20000+(0x6a8 if index else 0x683),0x21000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf002
  rows.append(dict(engine='ms-1991' if index else 'ms-1990',before=enc(before),after=enc(bytes(m.mem_read(0x20000,len(before)))),writes=list(writes),vector=list(struct.unpack('<HH',bytes(m.mem_read(0x20,4))))))
with a.output.open('x') as f:json.dump(rows,f)
print('2000 original timer restore states captured; virtual I/O and IVT only')
