"""Execute the full original initializer's mode-3 early-return path."""
import argparse,json,struct,sys,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.image.read_bytes();rows=[]
assert image[0x9177:0x9180]==bytes.fromhex('837e06fd7503e9b203')
for rate in [10,20]:
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[0x32a90:0x42a90])
 state=bytes((i*17+3)&255 for i in range(1120));m.mem_write(0x691a0,state)
 for at,value in [(0x96dc,rate),(0x7a12,55),(0xa728,777)]:m.mem_write(0x60000+at,struct.pack('<H',value))
 m.mem_write(0x696e6,b'\x01');m.mem_write(0x6f000,struct.pack('<3H',0x1000,0,65533))
 for reg,val in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,val)
 m.emu_start(0x9100,0x1000,count=1000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 assert bytes(m.mem_read(0x691a0,1120))==state
 def word(at):return struct.unpack('<H',bytes(m.mem_read(0x60000+at,2)))[0]
 assert [word(0x7a12),word(0xa728),m.mem_read(0x696e6,1)[0]]==[55,777,1]
 assert [word(0x96f4),word(0xa704),word(0x96a8)]==[0x650 if rate==10 else 0x610,30*rate,100//rate]
 rows.append({'rate':rate,'retainedBytes':1120,'statePreserved':True,'inputAndElapsedPreserved':True,'cadenceDerived':True})
assert a.image.read_bytes()==image
print(json.dumps({'cases':rows,'sourceUnchanged':True,'pass':True}))
