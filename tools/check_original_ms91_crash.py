"""Read-only original MS91 crash/finish oracle; excludes particle/audio calls."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_IP,UC_X86_REG_DI
image=a.image.read_bytes();legacy=image[0xb3b2:0xb3b8]==bytes.fromhex('558bec83ec04');entry=0xb3b2 if legacy else 0xba32;assert image[entry:entry+6]==bytes.fromhex('558bec83ec04')
addresses={0x92d8:0x907a,0x92da:0x907c,0xa728:0xa490,0x8670:0x8472,0x8d98:0x8b3a,0x9596:0x9308,0xa1c0:0x9f26,0xa6dc:0xa446,0x8672:0x8474} if legacy else {}
stats_at=0x907e if legacy else 0x92dc;saved_at=0x8df6 if legacy else 0x9054
particles=0xb7f4 if legacy else 0xbe6e;audio=0x1971e if legacy else 0x1971c
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
r=random.Random(19910225);rows=[]
effects=[]
def request_hook(machine,address,size,user):
 if address not in (particles,audio):return
 sp=machine.reg_read(UC_X86_REG_SP);stack=machine.reg_read(UC_X86_REG_SS)*16+sp
 words=struct.unpack('<5H',bytes(machine.mem_read(stack,10)))
 if address==particles:effects.append(dict(type='particles',car=words[2],yaw=words[3],mode=words[4]))
 else:effects.append(dict(type='audio',handle=words[2]))
 machine.reg_write(UC_X86_REG_SP,(sp+4)&65535);machine.reg_write(UC_X86_REG_CS,words[1]);machine.reg_write(UC_X86_REG_IP,words[0])
m.hook_add(UC_HOOK_CODE,request_hook)
for rate in (20,) if legacy else (10,20):
 for cause in (1,2,3,4,5):
  for car in (0,1):
   for index in range(100):
    stats=[r.randrange(65536) for _ in range(11)];saved=[r.randrange(65536) for _ in range(11)]
    before=dict(crash=r.choice([0,0,0,1,2,3]),speed=r.randrange(65536),roadSpeed=r.randrange(65536),yaw=r.randrange(1024),abortFlag=r.randrange(2),timer=r.randrange(65536),stats=stats,savedStats=saved,elapsed=r.randrange(65536),evaluationCause=r.randrange(6),replay=bool(r.randrange(2)),audioEnabled=bool(r.randrange(2)),preserveStats=bool(r.randrange(2)),audioHandles=[r.randrange(65536),r.randrange(65536)])
    m.mem_write(0x60000,bytes(65536));base=(0x9094+car*0xb8) if legacy else (0x92f2+car*0xd0);crash_offset=0xb1 if legacy else 0xc9
    def word(at,value):m.mem_write(0x60000+addresses.get(at,at),struct.pack('<H',value&65535))
    def byte(at,value):m.mem_write(0x60000+addresses.get(at,at),bytes([value]))
    for at,value in [(base+0x2a,before['speed']),(base+0x2c,before['roadSpeed']),(base+0x18,before['yaw']),(0x92d8,before['abortFlag']),(0x92da,before['timer']),(0xa728,before['elapsed']),(0x96dc,rate),(0x8670,before['audioHandles'][0]),(0x8d98,before['audioHandles'][1])]:word(at,value)
    for at,value in [(base+crash_offset,before['crash']),(0x9596,before['evaluationCause']),(0xa1c0,int(before['replay'])),(0xa6dc,int(before['audioEnabled'])),(0x8672,4 if before['preserveStats'] else 0)]:byte(at,value)
    m.mem_write(0x60000+stats_at,struct.pack('<11H',*stats));m.mem_write(0x60000+saved_at,struct.pack('<11H',*saved))
    m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,cause,car))
    for reg,value in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
    retained_di=(index*631+car)&65535
    m.reg_write(UC_X86_REG_DI,retained_di)
    effects.clear();m.emu_start(entry,0x1000,count=20000);assert m.reg_read(UC_X86_REG_SP)==0xf004
    assert m.reg_read(UC_X86_REG_DI)==retained_di,'Caller retained player index in DI must survive crash handler'
    def readword(at):return struct.unpack('<H',bytes(m.mem_read(0x60000+addresses.get(at,at),2)))[0]
    result={**before,'crash':m.mem_read(0x60000+base+0xc9,1)[0],'speed':readword(base+0x2a),'roadSpeed':readword(base+0x2c),'abortFlag':readword(0x92d8),'timer':readword(0x92da),'evaluationCause':m.mem_read(0x69596,1)[0],'stats':list(struct.unpack('<11H',bytes(m.mem_read(0x692dc,22)))),'savedStats':list(struct.unpack('<11H',bytes(m.mem_read(0x69054,22))))}
    if legacy:
     result['crash']=m.mem_read(0x60000+base+crash_offset,1)[0];result['evaluationCause']=m.mem_read(0x60000+addresses[0x9596],1)[0]
     result['stats']=list(struct.unpack('<11H',bytes(m.mem_read(0x60000+stats_at,22))));result['savedStats']=list(struct.unpack('<11H',bytes(m.mem_read(0x60000+saved_at,22))))
    rows.append(dict(rate=rate,cause=cause,car=car,before=before,result=result,effects=list(effects),legacy=legacy))
assert a.image.read_bytes()==image,'Original binary changed during isolated check'
with a.output.open('x') as f:json.dump(rows,f)
print('Captured '+str(len(rows))+' original '+('MS90' if legacy else 'MS91')+' crash states and side-effect requests; no audio playback or particle generation')
