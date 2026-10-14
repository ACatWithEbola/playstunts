"""Modern TD15 ongoing voice update corpus; virtual ports only."""
import argparse,sys,zipfile,random,struct,json,hashlib,base64
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--completion-between-bios',action='store_true',help='Explicitly deliver original legacy completion ISR after first BIOS request; no elapsed-time assumption');p.add_argument('--mutate-descriptor-after-completion',action='store_true',help='Adversarial retained-memory mutation after ISR; saved CPU registers must remain distinct');a=p.parse_args();sys.path.insert(0,str(a.libraries))
assert not a.mutate_descriptor_after_completion or a.completion_between_bios
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN,UC_HOOK_INTR
from unicorn.x86_const import *
digest=hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as z:driver=z.read(next(n for n in z.namelist() if n.upper().endswith('TD15.DRV')))
legacy=len(driver)==2993
assert not a.completion_between_bios or legacy,'Completion injection requires legacy TD15'
assert hashlib.sha256(driver).hexdigest()==('38c79e87a697f6cfa89169c64fb4a4dde742abdb39fc0589f9dd843a0e4b3de9' if legacy else '45baeedce5368fc07aea9f1e0ecd444fe5e943cc2730db2efe235d5fa561ca24')
r=random.Random(19910225);rows=[]
for case in range(1000):
 state=bytearray(driver);voice=bytearray(r.randrange(256) for _ in range(46));voice[1]=0 if case%19==0 else 1;timer=bytearray(r.randrange(256) for _ in range(72));instrument=bytearray(r.randrange(256) for _ in range(96));instrument[0x35]=case%2;instrument[0x19]=[0,2,3][case%3];instrument[0x28]=2 if case%5==0 else 0
 first,last=(0x510,0x51c) if legacy else (0x5a9,0x5b5)
 for offset in range(first,last):state[offset]=r.randrange(16)
 if case%7==0:state[0x51b if legacy else 0x5b4]=0
 if legacy:state[0x504]=2 if case%3==0 else 0
 if a.completion_between_bios:state[0x505]=[0,1,2,255][(case//3)%4]
 args=dict(channel=case%6,incomingCx=r.choice([0,4,7,65535]),port61=r.randrange(256));writes=[]
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,bytes(state));m.mem_write(0x60100,bytes(voice));m.mem_write(0x60200,bytes(timer));m.mem_write(0x30100,bytes(instrument));m.mem_write(0x6f000,struct.pack('<7H',0xf000,0x2000,args['channel'],0x100,0x200,0x100,0x3000))
 def out(machine,port,size,value,user):writes.append([port,value])
 def inp(machine,port,size,user):assert port==0x61;return args['port61']
 bios=[];completion_bios=[];completion_delivered=False
 def interrupt(machine,number,user):
  global completion_delivered
  assert number==0x1a
  bios.append({key:machine.reg_read(reg) for key,reg in [('ax',UC_X86_REG_AX),('es',UC_X86_REG_ES),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX)]})
  if a.completion_between_bios and not completion_delivered:
   completion_delivered=True
   irq=Uc(UC_ARCH_X86,UC_MODE_16);irq.mem_map(0,0x100000);irq.mem_write(0,bytes(machine.mem_read(0,0x100000)))
   irq.mem_write(0x6e000,struct.pack('<HHH',0xf000,0x2000,0x202))
   def irq_interrupt(cpu,number,user):
    assert number==0x1a
    completion_bios.append({key:cpu.reg_read(reg) for key,reg in [('ax',UC_X86_REG_AX),('es',UC_X86_REG_ES),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX)]})
   irq.hook_add(UC_HOOK_INTR,irq_interrupt)
   for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xe000),(UC_X86_REG_AX,0x91fb)]:irq.reg_write(reg,value)
   irq.emu_start(0x20ae7,0x2f000,count=10000);assert irq.reg_read(UC_X86_REG_SP)==0xe006
   machine.mem_write(0x20000,bytes(irq.mem_read(0x20000,len(driver))))
   if a.mutate_descriptor_after_completion:
    machine.mem_write(0x20506,struct.pack('<4H',0x333,0x4000,17,7));machine.mem_write(0x2050e,bytes([3]))
 m.hook_add(UC_HOOK_INTR,interrupt)
 m.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_CX,args['incomingCx'])]:m.reg_write(reg,value)
 m.emu_start(0x207e5 if legacy else 0x20841,0x2f000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 rows.append(dict(args=args,driver=base64.b64encode(state).decode(),voice=list(voice),timer=list(timer),instrument=list(instrument),driverAfter=base64.b64encode(bytes(m.mem_read(0x20000,len(driver)))).decode(),voiceAfter=list(m.mem_read(0x60100,46)),writes=writes,cx=m.reg_read(UC_X86_REG_CX)))
 rows[-1].update(bios=bios,legacy=legacy)
 if a.completion_between_bios:rows[-1].update(completionDelivered=completion_delivered,completionBios=completion_bios)
 if a.mutate_descriptor_after_completion:rows[-1].update(descriptorMutation=dict(offset=0x333,segment=0x4000,length=17,divisor=7,volume=3) if completion_delivered else None)
assert digest==hashlib.sha256(a.package.read_bytes()).hexdigest()
with a.output.open('x') as f:json.dump(rows,f)
print('1000 original '+('legacy' if legacy else 'modern')+' TD15 voice cases captured; virtual ports only; archive unchanged')
