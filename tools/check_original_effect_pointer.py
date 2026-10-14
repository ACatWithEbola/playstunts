"""Isolated original sound initializer captures; no devices or live data."""
import argparse,json,struct,sys
from itertools import product
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path)
p.add_argument('--libraries',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
p.add_argument('--all-slots',action='store_true',help='Also exercise music/reserved timer slots0 through15')
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
rows=[]
for engine,path,segment,start,data,timer_base,stride in [('ms-1990',a.legacy,0x2daf,0xbfe,0x32090,0x847a,72),('ms-1991',a.modern,0x2e0e,0xcf8,0x32a90,0x8678,76)]:
 image=path.read_bytes();m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x60000,image[data:data+65536])
 m.hook_add(UC_HOOK_CODE,lambda machine,address,size,user:machine.emu_stop(),begin=0x50000,end=0x50000)
 for owner in range(0 if a.all_slots else 16,24):
  for ptr_segment,offset in product([0,0x1234,0xffff],[0,1,0xfffb,0xfffc,0xfffd,0xfffe,0xffff]):
   raw=(ptr_segment<<16)|offset
   header=bytearray(12);header[5]=1;struct.pack_into('<I',header,8,raw);m.mem_write(0x62000,bytes(header))
   at=0x60000+timer_base+owner*stride;m.mem_write(at,bytes([0xaa])*stride)
   pool_before=bytes(m.mem_read(0x60000+timer_base,24*stride))
   m.mem_write(0x6f000,struct.pack('<9H',0,0x5000,owner,owner,0x2000,0x6000,8,42,64))
   for reg,value in [(UC_X86_REG_CS,segment),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:m.reg_write(reg,value)
   m.emu_start(segment*16+start,0x50000,count=10000)
   assert m.reg_read(UC_X86_REG_SP)==0xf004
   timer=bytes(m.mem_read(at,stride));actual=struct.unpack_from('<I',timer)[0]
   pool_after=bytes(m.mem_read(0x60000+timer_base,24*stride))
   assert pool_before[:owner*stride]==pool_after[:owner*stride]
   assert pool_before[(owner+1)*stride:]==pool_after[(owner+1)*stride:],'Initializer changed adjacent effect records'
   expected=(((ptr_segment<<16)|((offset+4)&65535)) if engine=='ms-1991' else (raw+4)&0xffffffff)
   assert actual==expected and struct.unpack_from('<I',timer,5)[0]==expected
   if engine=='ms-1991':assert timer[72:76]==bytes(4)
   rows.append({'engine':engine,'owner':owner,'rawPointer':raw,'actualPointer':actual,'timer':list(timer)})
 assert path.read_bytes()==image
with a.output.open('x') as f:json.dump(rows,f)
assert len(rows)==(1008 if a.all_slots else 336)
print(json.dumps({'originalInitializerCases':len(rows),'slotsPerEdition':24 if a.all_slots else 8,'completeTimerRecordsCaptured':True,'adjacentTimerRecordsUnchanged':True,'modernExtraWordsCleared':True,'sourceBinariesUnchanged':True,'pass':True}))
