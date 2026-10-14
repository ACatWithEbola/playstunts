"""Original patch uploads, isolated memory and virtual ports only."""
import argparse,sys,zipfile,struct,json,base64,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
rows=[];paths=[a.legacy,a.modern];hashes=[hashlib.sha256(x.read_bytes()).hexdigest() for x in paths]
for index,path in enumerate(paths):
 with zipfile.ZipFile(path) as z:driver=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='MT15.DRV'))
 for kind in [0,2]:
  patch=bytearray(1+8+(246 if kind==2 else 0));patch[0]=1;patch[1]=kind
  for i in range(2,len(patch)):patch[i]=i&127
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,driver);m.mem_write(0x90100,bytes(patch));m.mem_write(0x6f000,struct.pack('<4H',0,0x5000,0x100,0x9000));writes=[]
  def out(machine,port,size,value,user):writes.append([port,value])
  def inp(machine,port,size,user):return 0
  m.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x20042,0x50000,count=2000000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  rows.append(dict(engine='ms-1991' if index else 'ms-1990',patch=list(patch),writes=writes,before=base64.b64encode(driver).decode(),after=base64.b64encode(bytes(m.mem_read(0x20000,len(driver)))).decode()))
assert hashes==[hashlib.sha256(x.read_bytes()).hexdigest() for x in paths]
with a.output.open('x') as f:json.dump(rows,f)
print('Four original patch/timbre uploads captured; source ZIPs unchanged, no hardware/audio')
