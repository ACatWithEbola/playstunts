"""Execute the original recording tail and real far-pointer arithmetic helpers."""
import argparse,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
p.add_argument('--legacy',action='store_true')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16
from unicorn.x86_const import *
image=a.image.read_bytes();entry=0x145b8 if a.legacy else 0x14c64
assert image[entry:entry+6]==bytes.fromhex('813eb273e02e' if a.legacy else '813e127ae02e')
fields=dict(checkpoint=0xa030,checkpointSegment=0xa032,inputs=0x9c40,inputsSegment=0x9c42,count=0x73b2,length=0x8fd8,frame=0x8c26,adjustment=0xa034,prompt=0xa34e,paused=0xaa77) if a.legacy else dict(checkpoint=0xa724,checkpointSegment=0xa726,inputs=0xa332,inputsSegment=0xa334,count=0x7a12,length=0x96c8,frame=0x92e0,adjustment=0xa728,prompt=0xaa42,paused=0xb16b)
rows=[]
for rate in ([20] if a.legacy else [10,20]):
 for offset in [0,0xf000]:
  for mode in ['ordinary','prompt','rollover']:
   # Far-offset wrap can read outside the linear checkpoint arena. Every case
   # therefore needs fresh complete memory, not leftovers from the prior case.
   m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image)
   count=11999 if mode=='ordinary' else 12000
   slots=12000//(30*rate);size=1072 if a.legacy else 1120;bank=0x80000+offset;inputs=0xa0000
   checkpoint=bytearray((slots*size)+48)
   for slot in range(slots):
    for byte in range(size):checkpoint[slot*size+byte]=(slot*17+byte*3)&255
    struct.pack_into('<H',checkpoint,slot*size+0x140,slot*30*rate)
   checkpoint[slots*size:]=bytes([0xa5]*48)
   m.mem_write(bank,bytes(checkpoint));m.mem_write(inputs,bytes((i*7)&255 for i in range(12001)))
   def word(at,value):m.mem_write(0x60000+at,struct.pack('<H',value&65535))
   word(0x96dc,rate)
   for key,value in [('checkpoint',offset),('checkpointSegment',0x8000),('inputs',0),('inputsSegment',0xa000),('count',count),('length',count),('frame',count),('adjustment',0)]:word(fields[key],value)
   m.mem_write(0x60000+fields['prompt'],bytes([int(mode=='rollover')]));m.mem_write(0x60000+fields['paused'],b'\x00')
   bp=0xf000;m.mem_write(0x60000+bp,struct.pack('<3H',0,0x1000,0))
   for reg,val in [(UC_X86_REG_CS,0x105c),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_BP,bp),(UC_X86_REG_SP,bp-14),(UC_X86_REG_SI,0x39),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,val)
   # Legacy prologue reserves8 bytes, modern10; preserve actual epilogue slots.
   if a.legacy:m.reg_write(UC_X86_REG_SP,bp-12)
   m.emu_start(entry,0x1000,count=2000000);assert m.reg_read(UC_X86_REG_SP)==bp+6
   def read(at):return struct.unpack('<H',bytes(m.mem_read(0x60000+at,2)))[0]
   row={'engine':'ms-1990' if a.legacy else 'ms-1991','rate':rate,'offset':offset,'mode':mode,'checkpoint':bytes(m.mem_read(bank,len(checkpoint))).hex(),'inputs':bytes(m.mem_read(inputs,12001)).hex()}
   row.update({key:read(fields[key]) for key in ['count','length','frame','adjustment']})
   row.update({key:m.mem_read(0x60000+fields[key],1)[0] for key in ['prompt','paused']});rows.append(row)
   rows[-1]['checkpointPhysicalSpan']=bytes(m.mem_read(0x80000,offset+len(checkpoint))).hex()
assert a.image.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'cases':len(rows),'sourceUnchanged':True,'farOffsetCarryCovered':True}))
