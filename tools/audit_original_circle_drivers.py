"""Reconstruct all archived display drivers in memory and pin circle arithmetic."""
import argparse,hashlib,json,struct
from pathlib import Path
from unpack_executables import assemble,unpack_exe
p=argparse.ArgumentParser();p.add_argument('legacy',type=Path);p.add_argument('modern',type=Path);a=p.parse_args();rows=[]
for edition,root,shift in [('ms-1990',a.legacy,1),('ms-1991',a.modern,2)]:
 files={path:path.read_bytes()for path in root.iterdir()if path.suffix.upper()in ['.CMN','.COD','.DIF','.HDR']}
 expected=bytes.fromhex('8b560a8bc2d1e8d1e82bd0')+bytes.fromhex('d1e8')*shift+bytes.fromhex('03d0')
 for mode in ['MCGA','CGA','TDY','EGA']:
  executable=assemble(root,mode);image=unpack_exe(executable);start=image.find(expected)
  assert start>=0 and image.find(expected,start+1)<0,(edition,mode,'Missing or ambiguous original circle arithmetic')
  header=struct.unpack_from('<14H',executable);entry_ip,entry_cs=struct.unpack_from('<2H',executable,(header[4]+header[11])*16)
  entry=(0x280+entry_cs)*16+entry_ip;startup=image[entry:entry+30]
  assert startup[:4]==bytes.fromhex('b430cd21')and startup[10]==0xbf and startup[13:15]==bytes.fromhex('8b36')
  data_segment=struct.unpack_from('<H',startup,11)[0]
  rows.append({'engine':edition,'mode':mode,'dataSegment':hex(data_segment),'arithmeticAddress':hex(start),'arithmeticBytes':expected.hex(),'assembledSha256':hashlib.sha256(executable).hexdigest()})
 assert all(path.read_bytes()==before for path,before in files.items())
print(json.dumps({'drivers':rows,'driversChecked':8,'originalArithmeticIdenticalWithinEachEdition':True,'sourceUnchanged':True,'pixelParityClaimed':False}))
