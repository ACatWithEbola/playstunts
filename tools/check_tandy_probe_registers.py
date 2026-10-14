"""Own generated probe ISR register test; no elapsed-time claim."""
import argparse, struct
from pathlib import Path
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16, UC_HOOK_INTR, UC_HOOK_CODE
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('probe',type=Path);a=p.parse_args()
data=a.probe.read_bytes();marker=bytes.fromhex('3dfb9175')
offset=data.index(marker);segment=0x1000;base=segment*16
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(base+0x100,data)
registers=[UC_X86_REG_AX,UC_X86_REG_CX,UC_X86_REG_DX,UC_X86_REG_BX,UC_X86_REG_BP,UC_X86_REG_SI,UC_X86_REG_DI,UC_X86_REG_ES,UC_X86_REG_DS]
initial=[0x91fb,0x1234,0x2345,0x3456,0x4567,0x5678,0x6789,segment,segment]
for reg,value in zip(registers,initial):u.reg_write(reg,value)
u.reg_write(UC_X86_REG_CS,segment);u.reg_write(UC_X86_REG_SS,segment);u.reg_write(UC_X86_REG_SP,0xff00)
u.mem_write(base+0xff00,struct.pack('<HHH',0x9000,segment,0x202));u.mem_write(base+0x9000,b'\xf4')
calls=[]
def interrupt(cpu,number,_):
 assert number==0x1a
 calls.append(cpu.reg_read(UC_X86_REG_AX));assert calls[-1]==0x8307
 for reg in registers[:-1]:cpu.reg_write(reg,0xbeef)
def instruction(cpu,address,size,_):
 if address==base+0x9000:cpu.emu_stop()
u.hook_add(UC_HOOK_INTR,interrupt);u.hook_add(UC_HOOK_CODE,instruction)
u.emu_start(base+0x100+offset,base+0x9001,count=200)
assert calls==[0x8307],calls
assert [u.reg_read(reg) for reg in registers]==initial
assert u.reg_read(UC_X86_REG_SP)==0xff06
assert u.reg_read(UC_X86_REG_IP)==0x9000
# Unicorn does not reject80186 opcodes in16-bit mode; independently require
# the explicit8086 save/restore sequences in this generated handler.
assert bytes.fromhex('5051525355565706') in data[offset:]
assert bytes.fromhex('075f5e5d5b5a5958') in data[offset:]
print('Own repeat ISR preserves all registers and balances stack after BIOS clobber; explicit8086 saves/restores verified, no timing claim')
