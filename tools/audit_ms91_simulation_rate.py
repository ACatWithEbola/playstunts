"""Read-only original MS91 rate assignments; not a full timing/physics test."""
import argparse
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('image', type=Path)
args = parser.parse_args()
image = args.image.read_bytes()

def require(offset, expected):
    actual = image[offset:offset + len(expected)]
    if actual != expected:
        raise AssertionError(f'Original instruction mismatch at {offset:#x}: {actual.hex()}')

# Menu writes the configured rate, rather than changing the active rate here.
require(0x1c490, bytes.fromhex('c706569a0a00'))
require(0x1c49a, bytes.fromhex('c706569a1400'))
require(0x1c4a4, bytes.fromhex('a1569a3986eefd'))
require(0x1c453, bytes.fromhex('8846fe983dffff74483d0500741b3d060074203d070074253d0800742a3d0900742fa29201'))
require(0x1c47c, bytes.fromhex('c706f6990000'))
require(0x1c486, bytes.fromhex('c706f6990100'))

# Race/replay transition sites copy the configured word to the active rate and
# its low byte to game configuration. These instructions alone do not establish
# which enclosing paths run for imported replays or every restart mode.
sites = [0x140af, 0x1458d, 0x146b0, 0x148f9, 0x16843]
for offset in sites:
    require(offset, bytes.fromhex('a1569aa3dc96a0569aa2c696'))

# Original initializer: choose distinct response pointers, interval=30*rate,
# timer ticks/frame=100/rate. Match instructions, not an inferred UI label.
require(0x914b, bytes.fromhex('833edc960a7508c706f4965006eb06c706f4961006'))
require(0x9160, bytes.fromhex('b81e00f72edc96a304a7b86400998b0edc96f7f9a3a896'))
require(0x7596, bytes.fromhex('833edc960a7505b8001eeb03b8003c'))
require(0x7dad, bytes.fromhex('833edc960a75188b5e068b85080601414c8b414c998b9e22ff294704195706'))
require(0x149e6, bytes.fromhex('a1a89639060091'))
require(0x14a6c, bytes.fromhex('a0a896a29497'))
require(0x955b, bytes.fromhex('8b0e04a7f7f9'))
require(0x9629, bytes.fromhex('f73604a70bd2'))
require(0x9635, bytes.fromhex('f73604a78bf0'))
require(0x998d, bytes.fromhex('f72edc96'))
require(0x999a, bytes.fromhex('a0dc96d0e0d0e0'))
# The original time formatter divides remaining ticks by the active rate,
# then multiplies the fractional remainder by100/rate. Fixed20 formatting is
# therefore insufficient for10 recordings; signed/unsigned edge behavior is
# intentionally left for a full formatter oracle before changing the caller.
require(0x1bc94, bytes.fromhex('8b46082bd2f736dc96'))
require(0x1bc78, bytes.fromhex('b83c00f72edc968946ea8b46082bd2f776ea'))
require(0x1bd18, bytes.fromhex('b86400998b0edc96f7f9f76608'))
require(0x1476a, bytes.fromhex('8b36dc964e'))
require(0x1477f, bytes.fromhex('46a1dc963bf0'))
require(0x147df, bytes.fromhex('b8dc05f72edc96'))
# MS91 result caller owns0x9e local bytes plus DI/SI; each formatter call
# pushes three words plus a far return. Its entrySP is resultBP-0xac, not
# the legacy reconstruction's assumed caller mapping.
require(0x58d2, bytes.fromhex('558bec81ec9e005756'))
require(0x59e7, bytes.fromhex('8d46ee509aa0238d19'))
# Slow-video configuration is copied to active display management at entry,
# and changing it during the outer loop invokes the rectangle-cache reset.
require(0xfec8, bytes.fromhex('a1f699a39096'))
require(0x14213, bytes.fromhex('a1f699390690967408a390969a8a01330c'))
require(0xc4c2, bytes.fromhex('833e9096007449'))
slow_video_compare_sites=[0x4bc5,0xc359,0xc487,0xc4c2,0xc552,0xdd6e,0xe01a,0xe4f2,0xe557,0xe5ab,0xe625,0xe67f,0xea4a,0xedb7,0xee11,0xfb29,0x100f9,0x10184,0x101ab,0x1032b,0x103b9,0x103f7,0x1053e,0x10588,0x10599,0x144ab,0x16dbf,0x16f99]
for offset in slow_video_compare_sites:require(offset,bytes.fromhex('833e909600'))
require(0x189f6,bytes.fromhex('833ed09a017414'))
require(0x18a05,bytes.fromhex('0306d09a482306d8a1'))
responses = {
    20: [8,7,6,5,4,4,3,3,2,2,2,1,1,1,1,1],
    10: [16,14,12,10,8,8,6,6,4,4,4,2,2,1,1,1],
}
for rate, offset in [(20, 0x330a0), (10, 0x330e0)]:
    table = bytes(value for step in responses[rate] for value in [0,step,(-step)&255,0])
    require(offset, table)

print(json.dumps({
    'imageSha256': hashlib.sha256(image).hexdigest(),
    'configuredRateAddress': 'DS:9a56',
    'activeRateAddress': 'DS:96dc',
    'gameConfigurationRateByte': 'DS:96c6',
    'menuChoices': {'slow': 10, 'fast': 20},
    'copySites': [hex(offset) for offset in sites],
    'steeringResponses': responses,
    'checkpointIntervalFrames': {'10': 300, '20': 600},
    'timerTicksPerFrame': {'10': 10, '20': 5},
    'timeFormatterRateDependentSites': ['0x1bc94', '0x1bd18'],
    'resultFormatterEntryStackDelta': '-0xac',
    'slowVideoActiveAddress': 'DS:9690',
    'slowVideoCacheResetEntry': '0xc4ba',
    'slowVideoWordCompareSites': [hex(offset) for offset in slow_video_compare_sites],
    'scope': 'Exact original assignments only; enclosing paths, timer effects and 10 Hz physics remain open',
}, indent=2))
