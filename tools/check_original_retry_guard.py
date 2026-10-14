"""Execute the MS91 prompt's null-resource guard; stop before dialog dependencies."""
import argparse
import json
import struct
import sys
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('modern', type=Path)
p.add_argument('--libraries', type=Path, required=True)
a = p.parse_args()
sys.path.insert(0, str(a.libraries))
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16
from unicorn.x86_const import *

image = a.modern.read_bytes()
cancelled = 0
continued = 0
for bits in range(16):
    m = Uc(UC_ARCH_X86, UC_MODE_16)
    m.mem_map(0, 0x100000)
    m.mem_write(0, image)
    words = [0x4321 if bits & (1 << n) else 0 for n in range(4)]
    m.mem_write(0x6009c, struct.pack('<4H', *words))
    m.mem_write(0x6f000, struct.pack('<2H', 0x1000, 0))
    for reg, value in [(UC_X86_REG_CS, 0x198d), (UC_X86_REG_DS, 0x6000),
                       (UC_X86_REG_SS, 0x6000), (UC_X86_REG_SP, 0xf000),
                       (UC_X86_REG_BP, 0xbeef), (UC_X86_REG_EFLAGS, 2)]:
        m.reg_write(reg, value)
    should_cancel = not any(words[:2]) or not any(words[2:])
    # A valid guard ends at the first input-state service call. Invalid returns
    # to the sentinel directly. Neither path executes graphics/audio/file IO.
    stop = 0x1000 if should_cancel else 0x198d0 + 0x25f8
    m.emu_start(0x198d0 + 0x2c20, stop, count=100)
    assert m.reg_read(UC_X86_REG_CS) * 16 + m.reg_read(UC_X86_REG_IP) == stop
    if should_cancel:
        assert m.reg_read(UC_X86_REG_AX) == 2
        assert m.reg_read(UC_X86_REG_SP) == 0xf004
        assert m.reg_read(UC_X86_REG_BP) == 0xbeef
        cancelled += 1
    else:
        continued += 1
    assert bytes(m.mem_read(0x6009c, 8)) == struct.pack('<4H', *words)
assert (cancelled, continued) == (7, 9)
assert a.modern.read_bytes() == image
print(json.dumps({'originalExecutedCases': 16, 'cancelled': cancelled,
    'continuedToInputService': continued, 'cancelReturnsChoice2': True,
    'cancelRestoresStackAndFrame': True, 'resourcesUnchanged': True,
    'noGraphicsAudioOrFileServicesExecuted': True, 'wholeItemAccepted': False,
    'pass': True}))
