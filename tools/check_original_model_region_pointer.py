"""Original added descriptor08 pointer gate, all byte flags."""
import json,struct,sys
from pathlib import Path
sys.path.insert(0,sys.argv[2])
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=Path(sys.argv[1]).read_bytes();assert image[0x17360:0x17365]==bytes.fromhex('f606846508')
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0,image);rows=[]
for flags in range(256):
 u.mem_write(0x60000,bytes(65536));u.mem_write(0x61008,struct.pack('<H',0x1234));u.mem_write(0x6658e,struct.pack('<H',0xaaaa));u.mem_write(0x66584,bytes([flags]))
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_BX,0x1000)]:u.reg_write(reg,value)
 u.emu_start(0x17360,0x1736d,count=10);assert u.reg_read(UC_X86_REG_IP)==0x736d
 rows.append({'flags':flags,'region':struct.unpack('<H',bytes(u.mem_read(0x6658e,2)))[0]})
assert Path(sys.argv[1]).read_bytes()==image
print(json.dumps(rows))
