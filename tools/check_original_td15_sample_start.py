"""Original modern TD15 idle sample setup; virtual timer/PIC/DAC ports only."""
import argparse,sys,zipfile,random,struct,json,hashlib,base64
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
digest=hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as z:driver=z.read(next(n for n in z.namelist() if n.upper().endswith('TD15.DRV')))
assert hashlib.sha256(driver).hexdigest()=='45baeedce5368fc07aea9f1e0ecd444fe5e943cc2730db2efe235d5fa561ca24'
r=random.Random(19910225);rows=[]
for case in range(512):
 state=bytearray(driver);struct.pack_into('<H',state,0x58c,r.randrange(1,65536));state[0x595]=0
 request=dict(channel=1 if case%13==0 else 0,offset=0x100,segment=0x3000,frequency=[0,99,100,101,19999,20000,65535][case%7],repeats=[0,1,255,256,65535][case%5],picMask=r.randrange(256))
 sample=bytearray(r.randrange(256) for _ in range(128));sample[4]=6 if case%2 else 0;struct.pack_into('<H',sample,8,[0,1,2,32,255][(case//2)%5]);vector=bytes([0x34,0x12,0x78,0x56])
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,bytes(state));m.mem_write(0x30100,bytes(sample));m.mem_write(0x20,vector)
 m.mem_write(0x6f000,struct.pack('<7H',0xf000,0x2000,request['channel'],request['offset'],request['segment'],request['frequency'],request['repeats']));writes=[]
 def out(machine,port,size,value,user):writes.append([port,value])
 def inp(machine,port,size,user):assert port==0x21;return request['picMask']
 m.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);m.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
 m.emu_start(0x20ba5,0x2f000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 rows.append(dict(request=request,before=base64.b64encode(state).decode(),after=base64.b64encode(bytes(m.mem_read(0x20000,len(driver)))).decode(),sample=list(sample),vectorBefore=list(vector),vectorAfter=list(m.mem_read(0x20,4)),writes=writes))
assert digest==hashlib.sha256(a.package.read_bytes()).hexdigest()
with a.output.open('x') as f:json.dump(rows,f)
print('512 original TD15 idle sample-start cases captured; virtual ports only; package unchanged')
