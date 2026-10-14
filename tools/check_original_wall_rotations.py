"""Original paired rotation builders with original-generated cardinal banks."""
import argparse,sys,struct,json,random
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
machines=[];pattern=struct.pack('<8H',0,101,201,302,402,503,603,704)
for path,segment,y_entry,combined_segment,combined_entry,sine,cache,cardinals in [(a.legacy,0x2d94,0x60,0x1696,0x149a,0x4bc6,0x3310,[0x635a,0x59ba,0x59a8,0x59d4]),(a.modern,0x2df4,0x5c,0x1718,0x14a2,0x4ca4,0x3398,[0x6554,0x5bb4,0x5ba2,0x5bce])]:
 image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,bytes(65536));at=image.find(pattern);assert at>=0 and image.find(pattern,at+1)<0;m.mem_write(0x60000+sine,image[at:at+514])
 def execute(cs,entry,args):
  m.mem_write(0x6f000,struct.pack('<'+'H'*(2+len(args)),0x1000,0,*[x&65535 for x in args]))
  for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(cs*16+entry,0x1000,count=30000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 for destination,angle in zip(cardinals,[0,256,512,768]):execute(segment,y_entry,[destination,angle])
 m.mem_write(0x60000+cache,b'\xff\xff');machines.append((m,combined_segment,combined_entry))
r=random.Random(19910225);rows=[]
for case in range(512):
 roll=r.randrange(-128,129);pitch=r.randrange(-128,129);yaw=[0,256,512,768,r.randrange(1024)][case%5];results=[]
 for m,cs,entry in machines:
  m.mem_write(0x6f000,struct.pack('<6H',0x1000,0,roll&65535,pitch&65535,yaw,0))
  for reg,value in [(UC_X86_REG_CS,cs),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
  m.emu_start(cs*16+entry,0x1000,count=30000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  results.append(list(struct.unpack('<9h',bytes(m.mem_read(0x60000+m.reg_read(UC_X86_REG_AX),18)))))
 assert results[0]==results[1];rows.append(dict(roll=roll,pitch=pitch,yaw=yaw,matrix=results[1]))
with a.output.open('x') as f:json.dump(rows,f)
print('512 combined rotation outputs match both originals with own generated cardinal tables and retained runtime cache')
