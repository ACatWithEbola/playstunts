"""Extract original per-car analog gauge tables; no inferred needle geometry."""
import json,struct,hashlib,sys
from pathlib import Path
from extract import resources
root,out=map(Path,sys.argv[1:3]);result={}
for path in sorted(root.glob('CAR*.RES')):
 raw=path.read_bytes();s=resources(raw)['simd']
 def gauge(offset,capacity):
  x,y,count=struct.unpack_from('<hhh',s,offset)
  if count<0 or count>capacity:raise ValueError('Invalid original gauge table')
  return dict(center=[x,y],points=[list(s[offset+6+2*i:offset+8+2*i]) for i in range(count)])
 result[path.stem[3:]]=dict(source=path.name,sha256=hashlib.sha256(raw).hexdigest(),speed=gauge(296,104),rpm=gauge(510,128))
out.write_text(json.dumps(result,separators=(',',':'))+'\n');print('Extracted gauge geometry for',len(result),'original cars')
