"""Original MS91 rectangle-cache reset oracle; no rendering policy emulation."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP
image=a.image.read_bytes();assert image[0xc4ba:0xc4c2]==bytes.fromhex('558bec83ec025756')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);r=random.Random(19910225);rows=[]
for index in range(100):
 data=bytearray(r.randbytes(65536));struct.pack_into('<H',data,0x9690,index%3)
 m.mem_write(0x60000,bytes(data));m.mem_write(0x7f000,struct.pack('<2H',0x1000,0))
 for reg,value in [(UC_X86_REG_CS,0xc33),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
 m.emu_start(0xc4ba,0x1000,count=10000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 result=bytes(m.mem_read(0x60000,65536))
 rows.append({'input':data.hex(),'output':result.hex()})
with a.output.open('x') as f:json.dump(rows,f)
print('Captured100 originalMS91 video-cache resets including disabled/nonzero flags')
