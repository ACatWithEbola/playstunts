"""Execute the original two-character numeric formatter and its integer converter."""
import argparse,struct,sys,json,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path);p.add_argument('--inspect-stack',action='store_true');a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP
image=a.image.read_bytes();assert image[0x1ba98:0x1baa0]==bytes.fromhex('558bec83ec045756')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
for zero in [0,1]:
 for value in range(1000):
  m.mem_write(0x60000,bytes(65536));m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,0x1000,value,zero,2))
  for reg,n in [(UC_X86_REG_CS,0x1700),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,n)
  m.emu_start(0x1ba98,0x1000,count=10000)
  assert m.reg_read(UC_X86_REG_SP)==0xf004
  text=bytes(m.mem_read(0x61000,20)).split(b'\0')[0].decode('ascii')
  expected=str(value)[-2:].rjust(2,'0' if zero else ' ')
  assert text==expected,(value,zero,text,expected)
print('Original MS91 numeric converter and two-character padding/truncation match2000 field cases')
pattern=struct.pack('<8H',0,101,201,302,402,503,603,704);sine=image.find(pattern)
assert sine>=0 and image.find(pattern,sine+1)<0
data=image[sine-0x4ca4:sine-0x4ca4+65536];assert len(data)==65536
r=random.Random(19910225);values=[0,1,9,10,19,20,599,600,1199,1200,32767,32768,65535]+[r.randrange(65536) for _ in range(1000)];rows=[]
for rate in [10,20]:
 for fractions in [0,1]:
  for ticks in values:
   m.mem_write(0x60000,data);m.mem_write(0x696dc,struct.pack('<H',rate));m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,0x1000,ticks,fractions))
   for reg,n in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,n)
   m.emu_start(0x1bc70,0x1000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
   text=bytes(m.mem_read(0x61000,30)).split(b'\0')[0].decode('ascii')
   field=lambda value,zero: str(value)[-2:].rjust(2,'0' if zero else ' ')
   expected=field(ticks//(60*rate),False)+':'+field(ticks//rate%60,True)
   if fractions:expected+='.'+field(ticks%rate*(100//rate),True)
   assert text==expected,(rate,ticks,fractions,text,expected)
   if a.inspect_stack and ticks==65535 and fractions:
    words=[{'delta':delta,'value':struct.unpack('<H',bytes(m.mem_read(0x6f000+delta,2)))[0]} for delta in range(-64,2,2)]
    print(json.dumps({'rate':rate,'ticks':ticks,'callerSP':'f000','retainedWords':words}))
   retained=[{'delta':delta-0xac,'value':struct.unpack('<H',bytes(m.mem_read(0x6f000+delta,2)))[0]} for delta in [-56,-54,-52,-50,-44,-42]] if fractions else []
   rows.append({'rate':rate,'ticks':ticks,'fractions':bool(fractions),'text':text,'resultFrameBP':0xf0ac,'retained':retained})
if a.output:
 with a.output.open('x') as f:json.dump(rows,f)
print(f'Complete original MS91 time formatter, converters and string copies match{len(rows)} boundary/random cases')
