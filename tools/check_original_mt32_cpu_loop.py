"""Execute actual MT15 startup loop bytes; instruction counts, not wall time."""
import argparse, hashlib, sys, zipfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('legacy', type=Path)
parser.add_argument('modern', type=Path)
parser.add_argument('--libraries', type=Path, required=True)
args = parser.parse_args()
sys.path.insert(0, str(args.libraries))
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16, UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_CS, UC_X86_REG_DX

for generation, path in [('ms-1990', args.legacy), ('ms-1991', args.modern)]:
    original_hash = hashlib.sha256(path.read_bytes()).digest()
    with zipfile.ZipFile(path) as archive:
        names = [name for name in archive.namelist() if name.upper().split('/')[-1] == 'MT15.DRV']
        assert len(names) == 1
        driver = archive.read(names[0])
    sequence = bytes.fromhex('ba00004a75fd')
    start = driver.index(sequence)
    assert driver.count(sequence) == 1
    machine = Uc(UC_ARCH_X86, UC_MODE_16)
    machine.mem_map(0, 0x100000)
    machine.mem_write(0x20000, driver)
    machine.reg_write(UC_X86_REG_CS, 0x2000)
    counts = {'mov': 0, 'dec': 0, 'taken': 0, 'exit': 0}
    def instruction(uc, address, size, user):
        offset = address - 0x20000
        if offset == start + 6:
            uc.emu_stop()
        elif offset == start:
            counts['mov'] += 1
        elif offset == start + 3:
            counts['dec'] += 1
        elif offset == start + 4:
            counts['taken' if uc.reg_read(UC_X86_REG_DX) else 'exit'] += 1
        else:
            raise AssertionError('Unexpected instruction in bounded CPU loop')
    machine.hook_add(UC_HOOK_CODE, instruction)
    machine.emu_start(0x20000 + start, 0x20000 + len(driver), count=140000)
    assert counts == {'mov': 1, 'dec': 65536, 'taken': 65535, 'exit': 1}, counts
    assert machine.reg_read(UC_X86_REG_DX) == 0
    assert bytes(machine.mem_read(0x20000, len(driver))) == driver
    assert hashlib.sha256(path.read_bytes()).digest() == original_hash
    nominal = counts['dec'] * 2 + counts['taken'] * 16 + counts['exit'] * 4
    assert nominal == 1179636
    print(f'{generation}: actual startup loop {counts}; nominal loop-only 8086 clocks={nominal}; source unchanged')
print('Unicorn verifies original instruction counts, not elapsed CPU/bus/interrupt timing')
