"""Boot diagnostic control-flow test with explicit stubs, not firmware timing."""
import argparse
import struct
from pathlib import Path
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16, UC_HOOK_INTR
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--baseline',action='store_true');p.add_argument('--back-to-back',action='store_true');p.add_argument('--restore-gap',action='store_true');a=p.parse_args()
data=a.image.read_bytes();assert len(data)==360*1024 and data[510:512]==b'\x55\xaa'
if a.restore_gap:
 assert a.back_to_back
 assert bytes.fromhex('cd1a5a595b58079db483cd1a') in data[:510], 'Original eight-instruction restore interval absent'
u=Uc(UC_ARCH_X86,UC_MODE_16);u.mem_map(0,0x100000);u.mem_write(0x7c00,data[:512]);printed=[];calls=[]
def interrupt(cpu,number,_):
 if number==0x10:
  assert cpu.reg_read(UC_X86_REG_AH)==0x0e
  printed.append(chr(cpu.reg_read(UC_X86_REG_AL)))
 elif number==0x1a:
  ax=cpu.reg_read(UC_X86_REG_AX);calls.append(ax)
  if len(calls)==1 and not a.baseline:
   assert ax==0x8300 and cpu.reg_read(UC_X86_REG_CX)==1 and cpu.reg_read(UC_X86_REG_DX)==1
   assert cpu.mem_read(cpu.reg_read(UC_X86_REG_BX),1)==b'\x80'
   # Explicit completed status: no callback simulated in this control-flow test.
  elif a.back_to_back and len(calls)==2:
   assert ax==0x8307 and cpu.reg_read(UC_X86_REG_CX)==4 and cpu.reg_read(UC_X86_REG_DX)==4095
  else:assert ax>>8==0x81
  cpu.reg_write(UC_X86_REG_EFLAGS,(cpu.reg_read(UC_X86_REG_EFLAGS)|0x200)&~1)
 else:raise AssertionError(number)
u.hook_add(UC_HOOK_INTR,interrupt)
u.emu_start(0x7c00,0x7e00,count=200000)
output=''.join(printed);parts=output.split();assert len(parts)==8,output
assert all(len(part)==4 and all(c in '0123456789ABCDEF' for c in part) for part in parts)
assert parts[2]=='0000' and parts[3]=='0000';assert len(calls)==(1 if a.baseline else 3 if a.back_to_back else 2)
assert int.from_bytes(u.mem_read(0x56,2),'little')==0
assert 0x7c00<=int.from_bytes(u.mem_read(0x54,2),'little')<0x7e00
assert u.reg_read(UC_X86_REG_SP)==0x7c00
handler=data.index(bytes.fromhex('3dfb9175'))
v=Uc(UC_ARCH_X86,UC_MODE_16);v.mem_map(0,0x100000);v.mem_write(0x7c00,data[:512]);v.mem_write(0x9000,b'\xf4')
v.reg_write(UC_X86_REG_AX,0x91fb);v.reg_write(UC_X86_REG_BP,0x1234);v.reg_write(UC_X86_REG_SP,0x7000)
# INT15 frame, six BIOS ISR saves, hardware IRQ frame. Exact hashed ROM layout.
v.mem_write(0x7000,struct.pack('<12H',0x9000,0,0x202,*([0xbeef]*6),0xaabb,0xf000,0x202))
v.emu_start(0x7c00+handler,0x9001,count=100)
for pattern,expected in [('8b46142ea3',0xaabb),('8b46162ea3',0xf000)]:
 index=data.index(bytes.fromhex(pattern))+5
 address=int.from_bytes(data[index:index+2],'little')
 assert int.from_bytes(v.mem_read(address,2),'little')==expected
assert v.reg_read(UC_X86_REG_AX)==0x91fb and v.reg_read(UC_X86_REG_BP)==0x1234
assert v.reg_read(UC_X86_REG_SP)==0x7006
print('Own boot probe formats eight words; selected request sequence and ROM-specific IRQ extraction preserve stack/registers; stubbed control flow, no timing proof')
