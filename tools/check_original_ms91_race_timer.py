"""Original complete logical timer; explicit host callback boundaries, no audio."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.image.read_bytes();assert image[0x149be:0x149c3]==bytes.fromhex('9af918e520')
fields={'guard':(0x8ff0,'B'),'audioElapsed':(0x9100,'H'),'audioRead':(0x9a26,'H'),'audioWrite':(0x96f0,'H'),'done':(0x96e6,'B'),'prompt':(0xb16b,'B'),'exiting':(0xa1c0,'B'),'mode':(0xaab6,'B'),'counter':(0x92d8,'H'),'timer':(0x92da,'H'),'countdown':(0x9794,'B'),'renderTicks':(0xb16c,'H'),'speed':(0x96f2,'B'),'slowToggle':(0xa233,'B')}
rng=random.Random(19910225);rows=[]
for rate in [10,20]:
 for index in range(128):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);events=[]
  before={name:rng.choice([0,1,2,3,255] if fmt=='B' else [0,1,4,5,9,10,39,40,32767,32768,65535]) for name,(_,fmt) in fields.items()}
  # Most cases run the body; explicit guard rejection still remains covered.
  before['guard']=0 if index%8 else index%3+1;before['prompt']=0 if index%7 else 1;before['done']=0 if index%9 else 1
  before['countdown']=1 if index%2 else 2;before['mode']=index%4;before['speed']=(index//4)%4
  matches=index%11!=0
  for name,(at,fmt) in fields.items():m.mem_write(0x60000+at,struct.pack('<'+fmt,before[name]))
  m.mem_write(0x696a8,struct.pack('<H',100//rate))
  callbacks={0x22749:'stack',0xb1a6:'sample',0xad6c:'pause',0x14ac0:'capture'}
  def callback(machine,address,size,user):
   kind=callbacks[address];sp=machine.reg_read(UC_X86_REG_SP)
   if kind=='sample':
    record,interval=struct.unpack('<2H',bytes(machine.mem_read(0x60000+sp+4,4)))
    events.append({'kind':'sample','record':(record-0x9c3e+0x955e)&65535,'interval':interval})
   elif kind!='stack':events.append({'kind':kind})
   ip,cs=struct.unpack('<2H',bytes(machine.mem_read(0x60000+sp,4)))
   machine.reg_write(UC_X86_REG_AX,int(matches) if kind=='stack' else 0)
   machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
  for address in callbacks:m.hook_add(UC_HOOK_CODE,callback,begin=address,end=address)
  m.mem_write(0x6f000,struct.pack('<2H',0x1000,0))
  for reg,val in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,val)
  m.emu_start(0x149be,0x1000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
  after={name:struct.unpack('<'+fmt,bytes(m.mem_read(0x60000+at,struct.calcsize(fmt))))[0] for name,(at,fmt) in fields.items()}
  rows.append({'rate':rate,'stackMatches':matches,'before':before,'after':after,'events':events})
with a.output.open('x') as out:json.dump(rows,out)
assert a.image.read_bytes()==image
print(json.dumps({'originalTimerCases':len(rows),'sourceUnchanged':True,'callbacksStubbed':True}))
