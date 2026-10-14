"""Execute original MS91 debris generation, including its random/math helpers."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--advance',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_AX
image=a.image.read_bytes();assert image[0xbe6e:0xbe74]==bytes.fromhex('558bec83ec16')
pattern=struct.pack('<8H',0,101,201,302,402,503,603,704);table=image.find(pattern);assert table>=0 and image.find(pattern,table+1)<0
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
r=random.Random(19910225);rows=[]
matrices=[]
def matrix_hook(machine,address,size,user):
 if address==0xc017:
  at=machine.reg_read(UC_X86_REG_AX)
  matrices.append(dict(pointer=at,words=list(struct.unpack('<9h',bytes(machine.mem_read(0x60000+at,18))))))
m.hook_add(UC_HOOK_CODE,matrix_hook)
fields={'x':(0x91a0,'i',4),'y':(0x9200,'i',4),'z':(0x9260,'i',4),'angleX':(0x949e,'h',2),'angleZ':(0x94ce,'h',2),'heading':(0x94fe,'h',2),'speed':(0x952e,'h',2),'verticalSpeed':(0x955e,'h',2),'style':(0x95cb,'B',1),'owner':(0x95e3,'B',1)}
for index in range(400):
 owner=index%4;yaw=r.randrange(1024);speed=r.randrange(-1000,1001)
 before={'random':[r.randrange(256) for _ in range(6)],'active':r.randrange(2),'particles':[]}
 m.mem_write(0x60000,image[table-0x4ca4:table-0x4ca4+65536])
 if a.advance:
  # The executable image has zero startup-cache matrices. Build them with
  # the original Y-rotation helper before testing its quarter-turn shortcuts.
  for pointer,angle in [(0x6554,0),(0x5bb4,256),(0x5ba2,512),(0x5bce,768)]:
   m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,pointer,angle))
   for reg,value in [(UC_X86_REG_CS,0x2df4),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
   m.emu_start(0x2df9c,0x1000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 for slot in range(24):
  particle={name:r.randrange(-1000,1001) if fmt!='B' else r.randrange(256) for name,(_,fmt,_) in fields.items()};particle['speed']=0 if r.randrange(3) else r.randrange(1,1000)
  # Generated particle headings are always masked to ten bits.
  if a.advance:particle['heading']=r.randrange(1024)
  before['particles'].append(particle)
  for name,(at,fmt,stride) in fields.items():m.mem_write(0x60000+at+slot*stride,struct.pack('<'+fmt,particle[name]))
 m.mem_write(0x6a64e,bytes(before['random']));m.mem_write(0x695ca,bytes([before['active']]))
 m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,owner,yaw,speed&65535))
 for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
 rate=10 if index%2 else 20;height=r.randrange(-2000,2001)
 m.mem_write(0x696dc,struct.pack('<H',rate));m.mem_write(0x692f6,struct.pack('<i',height))
 matrices.clear();m.emu_start(0xbfd0 if a.advance else 0xbe6e,0x1000,count=100000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 result={'random':list(m.mem_read(0x6a64e,6)),'active':m.mem_read(0x695ca,1)[0],'particles':[{name:struct.unpack('<'+fmt,bytes(m.mem_read(0x60000+at+slot*stride,stride)))[0] for name,(at,fmt,stride) in fields.items()} for slot in range(24)]}
 rows.append(dict(owner=owner,yaw=yaw,speed=speed,rate=rate,height=height,before=before,result=result,matrices=list(matrices)))
with a.output.open('x') as f:json.dump(rows,f)
print('Captured400 original MS91 debris generators with actual random/math helpers')
