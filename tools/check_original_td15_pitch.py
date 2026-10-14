"""Legacy removed pitch callback: isolated CPU/memory only, no ports."""
import argparse,sys,zipfile,struct,json,hashlib,base64,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
digest=hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as z:driver=z.read(next(n for n in z.namelist() if n.upper().endswith('TD15.DRV')))
assert hashlib.sha256(driver).hexdigest()=='38c79e87a697f6cfa89169c64fb4a4dde742abdb39fc0589f9dd843a0e4b3de9'
r=random.Random(19901213);rows=[]
for case in range(1024):
 channel=case%6;note=r.randrange(256);bend=r.choice([0,4095,4096,8191,32767,32768,65535,r.randrange(65536)]);span=r.randrange(256);cx=r.choice([0,4,7,65535])
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,driver);m.mem_write(0x6f000,struct.pack('<6H',0xf000,0x2000,channel,note,bend,span))
 for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_CX,cx)]:m.reg_write(reg,value)
 m.emu_start(0x20a23,0x2f000,count=1000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 assert bytes(m.mem_read(0x20000,len(driver)))==driver
 rows.append(dict(channel=channel,note=note,bend=bend,span=span,cx=cx,result=m.reg_read(UC_X86_REG_AX)))
assert digest==hashlib.sha256(a.package.read_bytes()).hexdigest()
with a.output.open('x') as f:json.dump(dict(driver=base64.b64encode(driver).decode(),rows=rows),f)
print('1024 original legacy pitch cases captured; driver/package unchanged; no audio output')
