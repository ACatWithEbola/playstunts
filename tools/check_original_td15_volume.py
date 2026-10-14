"""Original modern volume callback, virtual ports only; source archive unchanged."""
import argparse,sys,zipfile,struct,json,hashlib,base64
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
digest=hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as z:driver=z.read(next(n for n in z.namelist() if n.upper().endswith('TD15.DRV')))
assert hashlib.sha256(driver).hexdigest()=='45baeedce5368fc07aea9f1e0ecd444fe5e943cc2730db2efe235d5fa561ca24'
rows=[]
for channel in range(6):
 for volume in range(256):
  port61=(volume*73+channel*17)&255;writes=[]
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,driver)
  m.mem_write(0x6f000,struct.pack('<5H',0xf000,0x2000,channel,0,volume))
  def out(machine,port,size,value,user):writes.append([port,value])
  def inp(machine,port,size,user):assert port==0x61;return port61
  m.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
  for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0x20744,0x2f000,count=1000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  rows.append(dict(channel=channel,volume=volume,port61=port61,after=base64.b64encode(bytes(m.mem_read(0x20000,len(driver)))).decode(),writes=writes))
assert digest==hashlib.sha256(a.package.read_bytes()).hexdigest()
with a.output.open('x') as f:json.dump(dict(driver=base64.b64encode(driver).decode(),rows=rows),f)
print('1536 original volume callbacks captured; complete driver memory and virtual writes; archive unchanged')
