"""Actual original lookup on synthetic banks; missing-resource fatal UI intercepted."""
import argparse,itertools,json,struct,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('modern',type=Path);p.add_argument('output',type=Path);p.add_argument('--libraries',type=Path,required=True)
a=p.parse_args();sys.path.insert(0,str(a.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
image=a.modern.read_bytes();rows=[]
for count,offset,name in itertools.product([0,1,3],[0,256],['aaaa','B','CCC','MISS']):
 bank=bytearray(offset+6+count*8+32);struct.pack_into('<H',bank,offset+4,count)
 for n,key in enumerate([b'aaaa',b'B\0xx',b'CCC\0'][:count]):
  bank[offset+6+n*4:offset+10+n*4]=key;struct.pack_into('<I',bank,offset+6+count*4+n*4,n*4)
 m=Uc(UC_ARCH_X86,UC_MODE_16);m.mem_map(0,0x100000);m.mem_write(0,image);m.mem_write(0x90000,bytes(bank))
 key=(name.encode()+b'\0zzzz')[:4];m.mem_write(0x32a90+0x5000,key);m.mem_write(0x6f000,struct.pack('<5H',0x1000,0,offset,0x9000,0x5000));fatal=[]
 def hook(machine,address,size,user):
  if address==0x20e50+6:fatal.append(True);machine.emu_stop()
 m.hook_add(UC_HOOK_CODE,hook)
 for reg,value in [(UC_X86_REG_CS,0x20e5),(UC_X86_REG_DS,0x32a9),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_EFLAGS,2)]:m.reg_write(reg,value)
 m.emu_start(0x20e50+0x2579,0x1000,count=10000)
 if not fatal:assert m.reg_read(UC_X86_REG_SP)==0xf004
 assert bytes(m.mem_read(0x90000,len(bank)))==bytes(bank)
 rows.append({'count':count,'offset':offset,'name':name,'key':list(key),'bank':bytes(bank).hex(),
  'paddedKey':list(m.mem_read(0x32a90+0x5000,4)),'missing':bool(fatal),
  'pointer':None if fatal else {'offset':m.reg_read(UC_X86_REG_AX),'segment':m.reg_read(UC_X86_REG_DX)}})
assert a.modern.read_bytes()==image
with a.output.open('x') as out:json.dump(rows,out)
print(json.dumps({'originalLookupCases':len(rows),'fatalUIIntercepted':True,'sourceBanksUnchanged':True,'noAudioOrFileServices':True}))
