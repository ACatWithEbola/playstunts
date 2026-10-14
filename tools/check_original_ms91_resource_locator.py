"""Execute original MS91 resource locator; no file edits or parity claim."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('game',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from extract import unpack,resources
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP,UC_X86_REG_AX,UC_X86_REG_DX
b=a.image.read_bytes();source=a.game.read_bytes();bank=unpack(source)
assert b[0x15d19:0x15d1c]==bytes.fromhex('b8dc31'),'Unsupported original loader'
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,b)
data=b[0x32a90:0x42a90];assert len(data)==65536
m.mem_write(0x60000,data);m.mem_write(0x80000,bank);rows=[]
for name,at,destination in [('plan',0x31dc,0xa1ca),('wall',0x31e1,0xb164)]:
 assert data[at:at+5]==name.encode()+b'\0'
 m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,0,0x8000,at))
 for reg,v in [(UC_X86_REG_CS,0x198d),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,v)
 m.emu_start(0x1aec6,0x1000,count=20000)
 assert m.reg_read(UC_X86_REG_SP)==0xf004,'Locator did not return'
 off,seg=m.reg_read(UC_X86_REG_AX),m.reg_read(UC_X86_REG_DX)
 expected=resources(bank)[name];assert expected
 assert bytes(m.mem_read(seg*16+off,len(expected)))==expected
 # Reproduce the loader's actual far-pointer stores in isolated memory.
 m.mem_write(0x60000+destination,struct.pack('<HH',off,seg))
 stored_off,stored_seg=struct.unpack('<HH',bytes(m.mem_read(0x60000+destination,4)))
 assert bytes(m.mem_read(stored_seg*16+stored_off,len(expected)))==expected
 rows.append(dict(resource=name,offset=off,segment=seg,bytes=len(expected),destination=hex(destination)))
assert a.image.read_bytes()==b and a.game.read_bytes()==source
print(json.dumps(dict(resources=rows,sourceUnchanged=True,chassisParity=False)))
