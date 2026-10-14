"""Original driver instructions between BIOS calls; no CPU-cycle claim."""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16, UC_HOOK_CODE, UC_HOOK_INTR, UC_HOOK_INSN
from unicorn.x86_const import *

p = argparse.ArgumentParser()
p.add_argument('package', type=Path)
p.add_argument('--output', type=Path, required=True)
p.add_argument('--mutate-between', action='store_true', help='Perturb retained descriptor during first stubbed BIOS call; no timing claim')
a = p.parse_args()
package_hash = hashlib.sha256(a.package.read_bytes()).hexdigest()
with zipfile.ZipFile(a.package) as archive:
    driver = archive.read(next(name for name in archive.namelist() if name.upper().endswith('TD15.DRV')))
assert hashlib.sha256(driver).hexdigest() == '38c79e87a697f6cfa89169c64fb4a4dde742abdb39fc0589f9dd843a0e4b3de9'
rows = []
for kind in ['sample-start', 'voice-update']:
    state = bytearray(driver)
    state[0x504] = 1 if kind == 'sample-start' else 2
    state[0x505] = 1
    state[0x50e] = 7
    state[0x510] = state[0x516] = 15
    for offset, value in [(0x506, 0x132), (0x508, 0x3000), (0x50a, 4), (0x50c, 123)]:
        struct.pack_into('<H', state, offset, value)
    machine = Uc(UC_ARCH_X86, UC_MODE_16)
    machine.mem_map(0, 0x100000)
    machine.mem_write(0x20000, bytes(state))
    voice = bytearray(46)
    voice[1] = 1
    voice[3] = 60
    struct.pack_into('<H', voice, 4, 123)
    machine.mem_write(0x60100, bytes(voice))
    machine.mem_write(0x60200, bytes(72))
    machine.mem_write(0x30100, bytes(100))
    machine.mem_write(0x30108, struct.pack('<H', 4))
    args = [0xf000, 0x2000, 0, 0x100, 0x3000, 8000, 1] if kind == 'sample-start' else [0xf000, 0x2000, 0, 0x100, 0x200, 0x100, 0x3000]
    machine.mem_write(0x6f000, struct.pack('<7H', *args))
    bios, instructions = [], []
    def instruction(cpu, address, size, _):
        if len(bios) == 1:
            instructions.append(dict(offset=address-0x20000, size=size, hex=bytes(cpu.mem_read(address, size)).hex()))
    def interrupt(cpu, number, _):
        assert number == 0x1a
        bios.append({name:cpu.reg_read(reg) for name,reg in [('ax',UC_X86_REG_AX),('es',UC_X86_REG_ES),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX)]})
        if a.mutate_between and len(bios) == 1:
            cpu.mem_write(0x20506, struct.pack('<4H', 0x333, 0x4000, 17, 7))
            cpu.mem_write(0x2050e, bytes([0]))
    machine.hook_add(UC_HOOK_CODE, instruction)
    machine.hook_add(UC_HOOK_INTR, interrupt)
    machine.hook_add(UC_HOOK_INSN, lambda *args: None, None, 1, 0, UC_X86_INS_OUT)
    machine.hook_add(UC_HOOK_INSN, lambda *args: 0, None, 1, 0, UC_X86_INS_IN)
    for reg,value in [(UC_X86_REG_CS,0x2000),(UC_X86_REG_DS,0x6000),(UC_X86_REG_SS,0x6000),(UC_X86_REG_SP,0xf000),(UC_X86_REG_CX,0)]:
        machine.reg_write(reg,value)
    machine.emu_start(0x20b33 if kind == 'sample-start' else 0x207e5,0x2f000,count=10000)
    assert machine.reg_read(UC_X86_REG_SP) == 0xf004
    assert len(bios) == 2 and bios[0]['ax'] == 0x8300 and bios[0]['cx'] == bios[0]['dx'] == 1
    assert instructions and instructions[-1]['hex'] == 'cd1a'
    rows.append(dict(kind=kind,bios=bios,intervening=instructions,instructionCountIncludingSecondInt=len(instructions)))
assert hashlib.sha256(a.package.read_bytes()).hexdigest() == package_hash
with a.output.open('x') as output:
    json.dump(dict(packageSha256=package_hash,mutatedDescriptor=a.mutate_between,scope='Original instructions only; BIOS callbacks stubbed, no elapsed-time/cycle measurement',rows=rows),output,indent=2)
for row in rows:
    print(row['kind'], row['instructionCountIncludingSecondInt'], 'instructions through second INT1A', [entry['hex'] for entry in row['intervening']])
