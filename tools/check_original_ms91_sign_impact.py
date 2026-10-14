"""Execute the complete original indexed-sign caller, overlap and debris helpers."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.image.read_bytes();original=image[0x32a90:0x42a90]
assert image[0x8d14:0x8d18]==bytes.fromhex('8b9e08ff')
m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
rows=[]
for height in [-50,0,20,100,400]:
 for x in [-150,-40,0,40,150]:
  for marked in [0,1]:
   m.mem_write(0x60000,original)
   for pointer,angle in [(0x6554,0),(0x5bb4,256),(0x5ba2,512),(0x5bce,768)]:
    m.mem_write(0x6f000,struct.pack('<4H',0x1000,0,pointer,angle))
    for reg,val in [(UC_X86_REG_CS,0x2df4),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,val)
    m.emu_start(0x2df9c,0x1000,count=10000)
   def word(at,value):m.mem_write(0x60000+at,struct.pack('<H',value&65535))
   bp=0xe000
   word(bp-0xf8,0);word(bp-0xfc,0);word(0xaa44,0)
   word(0xab5a,0x3000);word(0xab5c,0x6000);m.mem_write(0x63000,b'\x00')
   word(0x7740,0x3100);word(0x7742,0x6000);m.mem_write(0x63100,struct.pack('<3h',0,0,0))
   m.mem_write(0x6959a,bytes([marked]))
   word(bp+6,0x1000);word(bp+8,0x2000)
   word(0x102c,3000);word(0x1018,128)
   m.mem_write(0x620c8,struct.pack('<4h',19,17,56,62))
   m.mem_write(0x60000+bp-0x11a,struct.pack('<6h',x,height,0,0,0,0))
   # Explicit inactive pool and deterministic original RNG.
   for slot in range(24):word(0x952e+slot*2,0)
   m.mem_write(0x6a64e,bytes([1,2,3,4,5,6]));m.mem_write(0x695ca,b'\x00')
   for reg,val in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,bp),(UC_X86_REG_SP,0xd000)]:m.reg_write(reg,val)
   m.emu_start(0x8d14,0x8dd4,count=100000)
   assert m.reg_read(UC_X86_REG_IP)==0x8dd4
   assert m.reg_read(UC_X86_REG_SP)==0xd000
   rows.append({'x':x,'height':height,'beforeMarked':marked,'marked':m.mem_read(0x6959a,1)[0],'active':m.mem_read(0x695ca,1)[0],'owners':list(m.mem_read(0x695e3,24)),'speeds':list(struct.unpack('<24h',bytes(m.mem_read(0x6952e,48)))),'signDimensions':list(struct.unpack('<4h',original[0x5f0:0x5f8]))})
   first_random=list(bytes(m.mem_read(0x6a64e,6)))
   # A second caller approaches the same sign with a different yaw; the shared
   # marker must suppress a second debris request before RNG consumption.
   word(0x1018,256)
   for reg,val in [(UC_X86_REG_CS,0),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,bp),(UC_X86_REG_SP,0xd000)]:m.reg_write(reg,val)
   m.emu_start(0x8d14,0x8dd4,count=100000)
   assert m.reg_read(UC_X86_REG_SP)==0xd000
   rows[-1]['firstRandom']=first_random
   rows[-1]['second']={'marked':m.mem_read(0x6959a,1)[0],'random':list(bytes(m.mem_read(0x6a64e,6))),'speeds':list(struct.unpack('<24h',bytes(m.mem_read(0x6952e,48))))}
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'cases':len(rows),'impacts':sum(r['marked']!=r['beforeMarked'] for r in rows),'sourceUnchanged':a.image.read_bytes()==image}))
