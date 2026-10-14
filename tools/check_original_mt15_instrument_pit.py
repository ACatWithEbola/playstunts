"""Original instrument callback with independently clocked PIT2 port double.
One input clock per latch poll is a test policy, not CPU elapsed-time evidence.
"""
import argparse, hashlib, struct, sys, zipfile
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('modern',type=Path)
parser.add_argument('--libraries',type=Path,required=True)
args=parser.parse_args();sys.path.insert(0,str(args.libraries))
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INSN
from unicorn.x86_const import *
digest=hashlib.sha256(args.modern.read_bytes()).digest()
with zipfile.ZipFile(args.modern) as archive:
    driver=archive.read(next(name for name in archive.namelist() if name.upper().split('/')[-1]=='MT15.DRV'))
for channel in range(16):
    machine=Uc(UC_ARCH_X86,UC_MODE_16);machine.mem_map(0,0x100000);machine.mem_write(0x20000,driver)
    patch=bytearray(100);patch[18]=12;patch[68]=5;patch[69]=77;patch[70]=64
    machine.mem_write(0x90100,bytes(patch));machine.mem_write(0x6f000,struct.pack('<7H',0,0x5000,channel,0xa036,0x801e,0x100,0x9000))
    state={'clock':0,'gate':0xa0,'start':None,'latch':65535,'high':False};waits=[];midi=[]
    def out(cpu,port,size,value,user):
        assert size==1
        if port==0x43 and value==0x80:
            assert state['start'] is not None
            state['clock']+=1;elapsed=state['clock']-state['start']
            # Verified odd FFFF mode3 high-half sequence; every wait here
            # must terminate before entering the low half-cycle.
            assert 1<=elapsed<=32767
            state['latch']=65534-2*(elapsed-1);state['high']=False
        elif port==0x61:
            if value&1 and not state['gate']&1:state['start']=state['clock']
            elif not value&1 and state['gate']&1:
                waits.append(state['clock']-state['start']);state['start']=None
            assert value&0xfe==0xa0;state['gate']=value
        elif port==0x330:midi.append((state['clock'],value))
        else:assert port in (0x42,0x43)
    def inp(cpu,port,size,user):
        if port==0x61:return state['gate']
        if port==0x42:
            result=(state['latch']>>8) if state['high'] else state['latch']&255
            state['high']=not state['high'];return result
        assert port==0x331;return 0
    machine.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT)
    machine.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
    for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000)]:machine.reg_write(reg,value)
    machine.emu_start(0x20021,0x50000,count=2000000)
    assert machine.reg_read(UC_X86_REG_SP)==0xf004
    assert waits==[201,201,201,201,32501],waits
    assert state['clock']==33305 and state['gate']==0xa0
    print(f'channel {channel}: original instrument waits={waits}, total={state["clock"]} PIT clocks')
assert hashlib.sha256(args.modern.read_bytes()).digest()==digest
print('Sixteen original callbacks match replacement instrument delay count; archive unchanged, no physical CPU timing claim')
