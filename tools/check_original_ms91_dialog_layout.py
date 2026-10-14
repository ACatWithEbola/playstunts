"""Original MS91 layout prefix; text measurement/input reset doubled, no drawing."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('output',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--content',action='store_true')
p.add_argument('--menus',action='store_true',help='Include actual modern larger-menu resource strings')
p.add_argument('--font',type=Path,help='Execute original measurement with this bundled font instead of the unit-width adapter')
p.add_argument('--background-sentinel',action='store_true',help='Verify full content setup resets a nonzero retained background field')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.modern.read_bytes();rows=[]
texts=['Title]','Title]}[One][Two]}[Three]','High score]}Name]@]',
 'A]B]C]','A}B}C]','Long title with spaces]Another line]',
 'Unterminated final line','[One][Two]']
if a.menus:texts += [
 'Graphic levels]}[  FULL][  FULL, no clds/scnry.][  MEDIUM, no clds/scnry.][  FAST, no clds/scnry.][  FAST, no clds/scnry/horiz.]}[  Slow video mgmt. OFF][  Slow video mgmt. ON]}[  Slow Simulation Speed][  Fast Simulation Speed]}[  Done]',
 'Options]}[Driving input device][Music on/off][Sound effects on/off][Load replay][Set graphic level][Exit to DOS][Done]',
 'Replay Menu]}[Return to REPLAY][Return to Evaluation][Re-Start Driving][Continue Driving][Load REPLAY][Save REPLAY][Display Options][Main Menu]']
for height,text,(x,y) in itertools.product([6,8,10,12],texts,[(-1,-1),(16,40),(24,-1)]):
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
 m.mem_write(0x600a0,struct.pack('<2H',0x1000,0x9000));m.mem_write(0x6a6f6,struct.pack('<H',height))
 if a.font:
  m.mem_write(0x80000,a.font.read_bytes());m.mem_write(0x64eb0,struct.pack('<H',0x8000))
  m.mem_write(0x600a0,struct.pack('<2H',0,0x8000))
 m.mem_write(0x6507a,struct.pack('<H',15))
 if a.background_sentinel:m.mem_write(0x63426,struct.pack('<H',0x7fff))
 m.mem_write(0x90000,text.encode()+b'\0')
 m.mem_write(0x6f000,struct.pack('<11H',0x1000,0,3 if a.content else 0,0,0,0x9000,x&65535,y&65535,4,0x5000,0))
 lines=[];requests={}
 def hook(machine,address,size,user):
  services=(0x198d0+0x1920,)+( () if a.font else (0x20e50+0x3e1f,) )
  drawing=(0x20e50+0xa9f4,0x20e50+0x50ab,0x20e50+0x5114,0x2d1d0+8,0x20e50+0x92b8,0x20e50+0x806d)
  if address not in services+(drawing if a.content else ()):return
  sp=machine.reg_read(UC_X86_REG_SP)
  if address==0x20e50+0x3e1f:
   offset=struct.unpack('<H',machine.mem_read(0x60000+sp+4,2))[0];length=0
   while machine.mem_read(0x60000+offset+length,1)[0]:length+=1;assert length<128
   machine.reg_write(UC_X86_REG_AX,length)
  elif address==0x20e50+0x806d:
   offset,tx,ty=struct.unpack('<3H',machine.mem_read(0x60000+sp+4,6));value=[]
   while machine.mem_read(0x60000+offset+len(value),1)[0]:value.append(machine.mem_read(0x60000+offset+len(value),1)[0]);assert len(value)<128
   signed=lambda n:(n+32768)%65536-32768
   lines.append({'text':value,'x':signed(tx),'y':signed(ty)})
  elif address==0x20e50+0x50ab:
   requests['bounds']=list(struct.unpack('<4h',machine.mem_read(0x60000+sp+4,8)))
  elif address==0x20e50+0x5114:
   requests['clear']=struct.unpack('<H',machine.mem_read(0x60000+sp+4,2))[0]
  elif address==0x2d1d0+8:
   requests['outline']=list(struct.unpack('<5h',machine.mem_read(0x60000+sp+4,10)))
  elif address==0x20e50+0x92b8:
   requests.setdefault('colours',[]).append(list(struct.unpack('<2H',machine.mem_read(0x60000+sp+4,4))))
  ip,cs=struct.unpack('<2H',machine.mem_read(0x60000+sp,4));machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
 m.hook_add(UC_HOOK_CODE,hook)
 for reg,value in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
 stop=0x6a8 if a.content else 0x343
 m.emu_start(0x198d0+0x1e4,0x198d0+stop,count=100000 if a.font else 10000)
 assert m.reg_read(UC_X86_REG_IP)==stop,(text,height,hex(m.reg_read(UC_X86_REG_CS)),hex(m.reg_read(UC_X86_REG_IP)))
 if a.background_sentinel and a.content:assert m.mem_read(0x63426,2)==b'\0\0'
 bp=m.reg_read(UC_X86_REG_BP)
 def signed(at):return struct.unpack('<h',m.mem_read(0x60000+bp+at,2))[0]
 if a.content:
  fields=[{'x':struct.unpack('<h',m.mem_read(0x65000+n*4,2))[0],'y':struct.unpack('<h',m.mem_read(0x65002+n*4,2))[0]} for n in range(m.mem_read(0x60000+bp-0x9e,1)[0]//2)]
  choices=[]
  for n in range(m.mem_read(0x60000+bp-0x140,1)[0]):
   choices.append({'offset':struct.unpack('<H',m.mem_read(0x60000+bp-0x13e+n*4,2))[0],
    'length':m.mem_read(0x60000+bp-0x98+n,1)[0],
    'left':signed(-0x28+n*2),'right':signed(-0xc6+n*2),'top':signed(-0x1be+n*2),'bottom':signed(-0xee+n*2)})
  rows.append({'height':height,'text':text,'position':[x,y],'content':{'lines':lines,'fields':fields,'choices':choices},'requests':requests})
 else:rows.append({'height':height,'text':text,'position':[x,y],'layout':{
  'x':signed(0xe),'y':signed(0x10),'innerWidth':signed(-0x194),
  'bounds':[signed(-0x30),signed(-0x2e),signed(-0x2c),signed(-0x2a)],'contentHeight':signed(-0x1c6)}})
assert a.modern.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'originalLayoutCases':len(rows),'contentCompared':a.content,'capture':str(a.output),'noDrawingAudioOrFileServices':True,'sourcesUnchanged':True}))
