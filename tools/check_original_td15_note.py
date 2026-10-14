"""Modern TD15 note-start oracle; sample setup boundary intercepted and recorded."""
import argparse,sys,zipfile,random,struct,json,hashlib,base64
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--legacy',action='store_true');p.add_argument('--boundary-offsets',action='store_true',help='Legacy descriptor effective-address wrap and word-byte crossing cases');a=p.parse_args();sys.path.insert(0,str(a.libraries))
assert not a.boundary_offsets or a.legacy,'Descriptor boundary corpus requires legacy driver'
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
digest=hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as z:driver=z.read(next(n for n in z.namelist() if n.upper().endswith('TD15.DRV')))
assert hashlib.sha256(driver).hexdigest()==('38c79e87a697f6cfa89169c64fb4a4dde742abdb39fc0589f9dd843a0e4b3de9' if a.legacy else '45baeedce5368fc07aea9f1e0ecd444fe5e943cc2730db2efe235d5fa561ca24')
r=random.Random(19910225);rows=[]
for case in range(512):
 voice=bytes(r.randrange(256) for _ in range(46));instrument=bytearray(r.randrange(256) for _ in range(96));instrument[5]=6 if case%2 else 0;instrument[10]=case%3;sample_offset=[0x200,0xfff6,0xfff7,0xfff8,0xfffe][case%5] if a.boundary_offsets else 0x200;struct.pack_into('<HH',instrument,6,sample_offset,0x4000)
 args=dict(channel=case%6,note=255 if case%7==0 else r.randrange(255),velocity=r.randrange(256),incomingCx=(case//7)%6,incomingDx=r.randrange(65536));requests=[]
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,driver);m.mem_write(0x60100,voice);m.mem_write(0x30100,bytes(instrument));m.mem_write(0x6f000,struct.pack('<8H',0xf000,0x2000,args['channel'],0x100,0x100,args['note'],args['velocity'],0x100)+struct.pack('<H',0x3000))
 length=(case*73)&65535;m.mem_write(0x40000+((sample_offset+8)&65535),struct.pack('<H',length))
 def hook(machine,address,size,user):
  if address==0x20ba5:
   sp=machine.reg_read(UC_X86_REG_SP);frame=struct.unpack('<7H',bytes(machine.mem_read(0x60000+sp,14)));ip,cs,channel,offset,segment,frequency,repeats=frame
   requests.append(dict(channel=channel,offset=offset,segment=segment,frequency=frequency,repeats=repeats))
   machine.reg_write(UC_X86_REG_SP,sp+4);machine.reg_write(UC_X86_REG_CS,cs);machine.reg_write(UC_X86_REG_IP,ip)
 m.hook_add(UC_HOOK_CODE,hook)
 for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_CX,args['incomingCx']),(UC_X86_REG_DX,args['incomingDx'])]:m.reg_write(reg,value)
 m.emu_start(0x2061a if a.legacy else 0x20669,0x2f000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 rows.append(dict(args=args,voice=list(voice),instrument=list(instrument),sample=dict(offset=sample_offset,segment=0x4000,length=length),driverAfter=base64.b64encode(bytes(m.mem_read(0x20000,len(driver)))).decode(),voiceAfter=list(m.mem_read(0x60100,46)),requests=requests))
assert digest==hashlib.sha256(a.package.read_bytes()).hexdigest()
with a.output.open('x') as f:json.dump(dict(driver=base64.b64encode(driver).decode(),rows=rows,legacy=a.legacy),f)
print('512 original '+('legacy' if a.legacy else 'modern')+' Tandy note cases captured; modern sample-start boundary intercepted,not executed; archive unchanged')
