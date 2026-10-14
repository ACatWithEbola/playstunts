"""Original full MS91 keyboard steering routine, including centering/limits."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--legal-grid',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP
image=a.image.read_bytes();assert image[0xac7a:0xac80]==bytes.fromhex('558bec83ec06')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
r=random.Random(19910225);rows=[]
for rate in (10,20):
 cases=[(angle,speed,input) for angle in [-32768,-241,-240,-80,-8,-7,-2,-1,0,1,2,7,8,80,240,241,32767] for speed in [0,1,4095,4096,32767,32768,65535] for input in range(4)]
 if a.legal_grid:
  speeds=sorted({0,1,*[bin*4096 for bin in range(16)],*[bin*4096+4095 for bin in range(16)]})
  cases=[(angle,speed,input) for angle in range(-240,241) for speed in speeds for input in range(4)]
 else:cases += [(r.randrange(-32768,32768),r.randrange(65536),r.randrange(4)) for _ in range(1000)]
 for angle,speed,input in cases:
  m.mem_write(0x60000,bytes(65536));pointer=0x650 if rate==10 else 0x610
  m.mem_write(0x60000+pointer,image[0x330e0 if rate==10 else 0x330a0:(0x330e0 if rate==10 else 0x330a0)+64])
  for at,value in [(0x9312,angle),(0x931e,speed),(0x96dc,rate),(0x96f4,pointer)]:m.mem_write(0x60000+at,struct.pack('<H',value&65535))
  m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,input))
  for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(0xac7a,0x1000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  result=struct.unpack('<h',bytes(m.mem_read(0x69312,2)))[0]
  rows.append(dict(rate=rate,angle=angle,speed=speed,input=input,result=result))
with a.output.open('x') as f:json.dump(rows,f)
print('Captured '+str(len(rows))+' original full keyboard steering cases')
