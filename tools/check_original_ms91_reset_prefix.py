"""Original initializer prefix and actual input-reset helper, before car setup."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.image.read_bytes();assert image[0x9180:0x9185]==bytes.fromhex('9aba09fa13')
rows=[]
for rate in [10,20]:
 for mode in [-1,-2,0,1]:
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[0x32a90:0x42a90])
  bank=0x80000;m.mem_write(bank,bytes([0xa5])*(40*1120))
  for at,value in [(0x96dc,rate),(0xa724,0),(0xa726,0x8000),(0xa728,777),(0x7a12,55),(0x9ad2,999)]:m.mem_write(0x60000+at,struct.pack('<H',value))
  for at in [0x9794,0xa233,0x96e6,0x8648]:m.mem_write(0x60000+at,b'\x07')
  m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,mode&65535))
  for reg,val in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,val)
  m.emu_start(0x9100,0x9185,count=100000)
  def word(at):return struct.unpack('<H',bytes(m.mem_read(0x60000+at,2)))[0]
  markers=[m.mem_read(bank+slot*1120+0x3f4,1)[0] for slot in range(40)]
  assert markers==([0]*20+[0xa5]*20 if mode==-1 else [0xa5]*40)
  after={'count':word(0x7a12),'radius':word(0x9ad2),'elapsed':word(0xa728),'countdown':m.mem_read(0x69794,1)[0],'toggle':m.mem_read(0x6a233,1)[0],'done':m.mem_read(0x696e6,1)[0],'phase':m.mem_read(0x68648,1)[0]}
  rows.append({'rate':rate,'mode':mode,'markers':markers,'after':after,'checkpointInterval':word(0xa704),'timerInterval':word(0x96a8)})
assert a.image.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'originalPrefixCases':len(rows),'freshResetMarkers':20,'bothRatesVerified':True,'sourceUnchanged':True}))
