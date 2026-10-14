"""Bounded MS91 retry-dialog guard and filename-append inventory; no file IO."""
import argparse
import json
import sys
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('modern', type=Path)
p.add_argument('--libraries', type=Path, required=True)
a = p.parse_args()
sys.path.insert(0, str(a.libraries))
from capstone import Cs, CS_ARCH_X86, CS_MODE_16

b = a.modern.read_bytes()
ops = list(Cs(CS_ARCH_X86, CS_MODE_16).disasm(b[0x198d0+0x2c20:0x198d0+0x2d6c], 0x2c20))
assert sum(i.size for i in ops) == 332
by = {i.address: i for i in ops}
expected = {
    0x2c27: ('mov', 'ax, word ptr [0x9c]'),
    0x2c2a: ('or', 'ax, word ptr [0x9e]'),
    0x2c2e: ('je', '0x2c39'),
    0x2c30: ('mov', 'ax, word ptr [0xa0]'),
    0x2c33: ('or', 'ax, word ptr [0xa2]'),
    0x2c37: ('jne', '0x2c40'),
    0x2c39: ('mov', 'ax, 2'),
    0x2c3f: ('retf', ''),
}
for at, pair in expected.items():
    assert (by[at].mnemonic, by[at].op_str) == pair
# Enumerate the decoded guard, rather than assuming segment alone determines null.
cancelled = 0
for bits in range(16):
    words = [1 if bits & (1 << n) else 0 for n in range(4)]
    first = words[0] | words[1]
    second = words[2] | words[3]
    early_cancel = first == 0 or second == 0
    assert early_cancel == (not any(words[:2]) or not any(words[2:]))
    cancelled += early_cancel
assert cancelled == 7
appends = [i for i in ops if i.mnemonic == 'lcall']
assert len(appends) == 6
assert all(i.op_str == '0x1f07, 0x16a2' for i in appends)
assert [(by[at].mnemonic, by[at].op_str) for at in (0x2c6f, 0x2d01)] == [('cmp', 'byte ptr [0x3428], 0')] * 2
assert sum(i.mnemonic == 'retf' for i in ops) == 2
print(json.dumps({'bytes': 332, 'instructions': len(ops), 'guardTruthTableCases': 16,
    'earlyCancelCases': cancelled, 'guardRequiresBothFarPointers': True,
    'filenameAppendBranches': 2, 'appendCalls': 6,
    'staticInventoryOnly': True, 'wholeItemAccepted': False}))
