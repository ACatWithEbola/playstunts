"""Original voice update/volume callbacks in isolated memory, no physical ports."""
import argparse,sys,zipfile,json,struct,base64,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
r=random.Random(19910225);rows=[];enc=lambda b:base64.b64encode(b).decode()
for index,path in enumerate([a.legacy,a.modern]):
 with zipfile.ZipFile(path) as z:driver=z.read(next(n for n in z.namelist() if n.upper().split('/')[-1]=='PC15.DRV'))
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000)
 for case in range(1000):
  voice=bytearray(r.randbytes(46));timer=bytearray(r.randbytes(72));instrument=bytearray(r.randbytes(100));channel=r.randrange(1,7 if index else 5)
  voice[1]=r.choice([0,1,1]);instrument[0x35]=r.choice([0,1]);instrument[0x28]=r.choice([0,2]);instrument[0x19]=r.choice([0,2]);instrument[0x12]=r.randrange(13)
  m.mem_write(0x20000,driver);m.mem_write(0x61000,bytes(voice));m.mem_write(0x61100,bytes(timer));m.mem_write(0x61200,bytes(instrument));m.mem_write(0x6f000,struct.pack('<7H',0,0x5000,channel,0x1000,0x1100,0x1200,0x6000))
  def regs():
   for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  regs();m.emu_start(0x20027,0x50000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  row=dict(engine='ms-1991' if index else 'ms-1990',channel=channel,driver=enc(driver),voice=enc(voice),timer=enc(timer),instrument=enc(instrument),afterDriver=enc(bytes(m.mem_read(0x20000,len(driver)))),afterVoice=enc(bytes(m.mem_read(0x61000,46))))
  volume=r.randrange(65536);m.mem_write(0x20000,driver);m.mem_write(0x6f000,struct.pack('<5H',0,0x5000,channel,0x1000,volume));regs();m.emu_start(0x20012,0x50000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  row.update(volume=volume,afterVolume=enc(bytes(m.mem_read(0x20000,len(driver)))));rows.append(row)
with a.output.open('x') as f:json.dump(rows,f)
print('2000 original voice update and volume callback states captured, no audio')
