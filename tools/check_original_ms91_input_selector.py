"""Full original selector, stopped before recording tail; silent host callbacks."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.image.read_bytes();assert image[0x14ac0:0x14ac8]==bytes.fromhex('558bec83ec0a5756')
fields={'mode':(0xaab6,'B'),'count':(0x7a12,'H'),'length':(0x96c8,'H'),'done':(0x96e6,'B'),'exiting':(0xa1c0,'B'),'evaluation':(0x9596,'B'),'enabled':(0xab1e,'B'),'phase':(0x8648,'B'),'frame':(0x92e0,'H'),'mouse':(0x18a,'B'),'joystick':(0x46b0,'B'),'target':(0x5a80,'B'),'mouseX':(0xae70,'H'),'mouseY':(0xaed2,'H'),'buttons':(0x8ff4,'H')}
rng=random.Random(19910225);rows=[]
for rate in [10,20]:
 for index in range(192):
  m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);events=[];selected=None
  before={name:0 for name in fields};before.update(mode=index%4,count=rng.choice([0,1,64,65535]),length=rng.choice([0,1,64,65535]),frame=rng.choice([39,40,41,79,80,81,65535]),mouse=int(index%3==0),joystick=int(index%3==1),done=int(index%13==0),evaluation=int(index%17==0),enabled=int(index%5==0),phase=int(index%7==0),target=17)
  forced=int(index%11==0);sample={'x':rng.choice([0,141,142,160,178,179,320,32928,65535]),'y':index*17,'buttons':index%4};joystick=rng.choice([-128,-127,-1,0,1,127]);controls=rng.randrange(65536);keys={'30':index%2,'44':(index//2)%2}
  for name,(at,fmt) in fields.items():m.mem_write(0x60000+at,struct.pack('<'+fmt,before[name]))
  m.mem_write(0x696dc,struct.pack('<H',rate));table=bytes((i*3)&255 for i in range(129));m.mem_write(0x630f2,table)
  callbacks={0x2da7c:'mouse',0x22c0f:'joystick',0x22964:'controls',0x22e39:'key',0xad6c:'pause',0xbA32:'crash'}
  # 6E8:4BB2 is the global crash entry, distinct from its near-call aliases.
  callbacks[0xba32]='crash'
  def hook(machine,address,size,user):
   nonlocal_dummy=None
   if address==0x14c3f:
    result[0]=machine.reg_read(UC_X86_REG_SI);machine.emu_stop();return
   kind=callbacks[address];sp=machine.reg_read(UC_X86_REG_SP);value=0
   if kind=='mouse':
    pointers=struct.unpack('<3H',bytes(machine.mem_read(0x60000+sp+4,6)))
    for pointer,n in zip(pointers,[sample['buttons'],sample['x'],sample['y']]):machine.mem_write(0x60000+pointer,struct.pack('<H',n&65535))
    events.append({'kind':'mouse'})
   elif kind=='joystick':value=joystick&255;events.append({'kind':'joystick'})
   elif kind=='controls':value=controls;events.append({'kind':'controls'})
   elif kind=='key':
    scan=struct.unpack('<H',bytes(machine.mem_read(0x60000+sp+4,2)))[0];value=keys[str(scan)];events.append({'kind':'key','scan':scan})
   else:events.append({'kind':kind})
   ip,cs=struct.unpack('<2H',bytes(machine.mem_read(0x60000+sp,4)))
   for reg,n in [(UC_X86_REG_AX,value),(UC_X86_REG_SP,sp+4),(UC_X86_REG_CS,cs),(UC_X86_REG_IP,ip)]:machine.reg_write(reg,n)
  result=[None]
  for address in [*callbacks,0x14c3f]:m.hook_add(UC_HOOK_CODE,hook,begin=address,end=address)
  m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,forced))
  for reg,val in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,val)
  m.emu_start(0x14ac0,0x1000,count=10000)
  after={name:struct.unpack('<'+fmt,bytes(m.mem_read(0x60000+at,struct.calcsize(fmt))))[0] for name,(at,fmt) in fields.items()}
  rows.append({'rate':rate,'forced':forced,'before':before,'after':after,'sample':sample,'joystick':joystick,'controls':controls,'keys':keys,'selected':result[0],'events':events,'history':list(m.mem_read(0x68f9e,64)),'historyFlags':list(m.mem_read(0x68ff6,64))})
with a.output.open('x') as out:json.dump(rows,out)
assert a.image.read_bytes()==image
print(json.dumps({'originalSelectorCases':len(rows),'sourceUnchanged':True,'hardwareCallbacksStubbed':True}))
