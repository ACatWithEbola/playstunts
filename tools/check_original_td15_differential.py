"""Bounded original modern TD15 compressed IRQ ordinary-buffer corpus; virtual ports."""
import argparse,sys,zipfile,random,struct,json,hashlib,base64
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('package',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--full',action='store_true');a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
checksum=hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as z:driver=z.read(next(n for n in z.namelist() if n.upper().endswith('TD15.DRV')))
assert hashlib.sha256(driver).hexdigest()=='45baeedce5368fc07aea9f1e0ecd444fe5e943cc2730db2efe235d5fa561ca24'
r=random.Random(19910225);rows=[]
for case in range(512 if a.full else 2000):
 before=dict(phase=255 if case%2 else 0,packed=r.randrange(256),accumulator=r.randrange(256),lastOutput=r.randrange(256));sample=r.randrange(256);state=bytearray(driver)
 for offset,value in [(0x5a6,before['phase']),(0x5a7,before['packed']),(0x5a8,before['accumulator']),(0x587,before['lastOutput'])]:state[offset]=value
 for offset,value in [(0x57c,32),(0x57e,8),(0x580,0x3000),(0x590,9)]:struct.pack_into('<H',state,offset,value)
 differential=bool(case&1) if a.full else True;payload=bytes(r.randrange(256) for _ in range(64));vector=bytes([0x34,0x12,0x78,0x56])
 if a.full:
  for offset,value in [(0x578,8),(0x57a,0x3000),(0x57e,32 if case&8 else 8),(0x588,0xf000),(0x58a,0x2000),(0x58c,r.randrange(65536)),(0x58e,123),(0x590,[1,2,65535][(case>>6)%3])]:struct.pack_into('<H',state,offset,value)
  state[0x5a6]=255 if case&4 else 0;state[0x582]=(case>>4)%3;state[0x592]=r.randrange(256);state[0x595]=1
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0x20000,bytes(state));m.mem_write(0x30000,payload);m.mem_write(0x20,vector)
 if not a.full:m.mem_write(0x30008,bytes([sample]))
 m.mem_write(0x6f000,struct.pack('<HHH',0xf000,0x2000,0x202));writes=[]
 def out(machine,port,size,value,user):writes.append([port,value])
 m.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT)
 for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_AX,0x1234),(UC_X86_REG_BX,0x5678)]:m.reg_write(reg,value)
 m.emu_start(0x20ae4 if differential else 0x20a66,0x2f000,count=10000)
 assert m.reg_read(UC_X86_REG_SP) in ([0xf000,0xf006] if a.full else [0xf006])
 assert m.reg_read(UC_X86_REG_AX)==0x1234 and m.reg_read(UC_X86_REG_BX)==0x5678 and m.reg_read(UC_X86_REG_DS)==0x6000
 after=bytes(m.mem_read(0x20000,len(driver)))
 if a.full:rows.append(dict(differential=differential,before=base64.b64encode(state).decode(),after=base64.b64encode(after).decode(),payload=list(payload),vectorBefore=list(vector),vectorAfter=list(m.mem_read(0x20,4)),writes=writes,returnKind='iret' if m.reg_read(UC_X86_REG_SP)==0xf006 else 'chain'))
 else:rows.append(dict(before=before,sample=sample,after=dict(phase=after[0x5a6],packed=after[0x5a7],accumulator=after[0x5a8],lastOutput=after[0x587]),consumed=struct.unpack_from('<H',after,0x57e)[0]-8,writes=[w for w in writes if w[0]==0xc5]))
assert checksum==hashlib.sha256(a.package.read_bytes()).hexdigest()
with a.output.open('x') as f:json.dump(rows,f)
print(str(len(rows))+' original TD15 IRQ cases captured; '+('full raw/differential boundaries,repeat/finish/vector/ports' if a.full else 'ordinary-buffer differential')+'; virtual ports only; package unchanged')
