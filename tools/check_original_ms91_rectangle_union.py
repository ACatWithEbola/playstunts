"""Original MS91 signed sequential rectangle union including alignment/aliasing."""
import argparse,json,random,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--strip',action='store_true');a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_SS,UC_X86_REG_SP
image=a.image.read_bytes();assert image[0x1899a:0x1899e]==bytes.fromhex('558bec56')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);r=random.Random(19910225);rows=[]
for index in range(1000):
 data=bytearray(65536);first=0x1000;second=0x1000+r.choice([0,2,4,8,16]);destination=r.choice([first,second,0x1200]);alignment=r.choice([1,2,4,8]);mask=(-alignment)&65535
 for address in [first,second]:struct.pack_into('<4h',data,address,*[r.randrange(-32768,32768) for _ in range(4)])
 struct.pack_into('<H',data,0x9ad0,alignment);struct.pack_into('<H',data,0xa1d8,mask)
 m.mem_write(0x60000,bytes(data));m.mem_write(0x7f000,struct.pack('<5H',0x1000,0,first,second,destination))
 for reg,value in [(UC_X86_REG_CS,0x1718),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x7000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
 if a.strip:
  from unicorn.x86_const import UC_X86_REG_BP
  from unicorn.x86_const import UC_X86_REG_IP
  # Stop before unrelated subsequent drawing calls. The branch itself invokes
  # the real far union routine with DS/SS near-pointer semantics.
  m.reg_write(UC_X86_REG_SS,0x6000);m.reg_write(UC_X86_REG_BP,0xf000);m.reg_write(UC_X86_REG_SP,0xef00);m.reg_write(UC_X86_REG_CS,0x12b5)
  m.mem_write(0x69690,struct.pack('<H',index%3));m.mem_write(0x6009a,struct.pack('<H',destination if index%4 else 0));m.mem_write(0x6aec6,struct.pack('<H',index));m.mem_write(0x6a1b6,struct.pack('<H',index+50))
  m.emu_start(0x144ab,0x144e3,count=1000);assert m.reg_read(UC_X86_REG_SP)==0xef00
 else:
  m.emu_start(0x1899a,0x1000,count=1000);assert m.reg_read(UC_X86_REG_SP)==0xf004
 rows.append({'first':first,'second':second,'destination':destination,'input':data[0x1000:0x1220].hex(),'alignment':alignment,'mask':mask,'output':bytes(m.mem_read(0x61000,0x220)).hex(),**({'strip':{'active':index%3,'pointer':destination if index%4 else 0,'top':index,'bottom':index+50,'scratch':bytes(m.mem_read(0x6eff6,8)).hex()}} if a.strip else {})})
with a.output.open('x') as f:json.dump(rows,f)
print('Captured1000 originalMS91 unions with signed coordinates, alignment and overlapping rectangles')
