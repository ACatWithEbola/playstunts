"""Execute the MS91 engine's actual signed-halving instruction, read-only.

This verifies one arithmetic operation, not whole-race compatibility.
Pass the unpacked original EGA image and existing reconstruction libraries.
"""
import argparse
import sys
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('image', type=Path)
p.add_argument('--libraries', type=Path, required=True)
a = p.parse_args()
sys.path.insert(0, str(a.libraries))
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16
from unicorn.x86_const import UC_X86_REG_AX, UC_X86_REG_CX

image = a.image.read_bytes()
# Located in update_car_speed, following the force/mass long division call.
machine = Uc(UC_ARCH_X86, UC_MODE_16)
machine.mem_map(0, 0x10000)
cases = [
    ('engine force halving', 0xa407, 'd1f8', 1, 1),
    ('grip steering quartering', 0xa729, 'd1f8d1f8', 2, 2),
    ('wheel-heading damping shift', 0xa8fa, 'd3f8', 4, 1),
]
for label, offset, hex_bytes, shift, instruction_count in cases:
    expected_bytes = bytes.fromhex(hex_bytes)
    instruction = image[offset:offset + len(expected_bytes)]
    assert instruction == expected_bytes, ('Unexpected original image', label)
    # Each routine receives a signed word. For heading damping the multiplication
    # by 15 happens before this shift; testing every word covers its whole output.
    machine.mem_write(0x1000, instruction)
    machine.ctl_remove_cache(0x1000, 0x1004)
    for value in range(-32768, 32768):
        machine.reg_write(UC_X86_REG_AX, value & 0xffff)
        machine.reg_write(UC_X86_REG_CX, shift)
        machine.emu_start(0x1000, 0x1000 + len(instruction), count=instruction_count)
        result = machine.reg_read(UC_X86_REG_AX)
        signed = result if result < 32768 else result - 65536
        assert signed == value // (2 ** shift), (label, value, signed)
    print(f'MS91 original {label}: all 65,536 signed words match')
