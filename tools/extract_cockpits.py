"""Preserve each original car's cockpit art and placement metadata, without redesign.

Usage: python extract_cockpits.py ORIGINAL_FOLDER OUTPUT_FOLDER
Uses the same checked resource decoder as extract.py; Pillow only encodes PNG.
"""
from pathlib import Path
import sys, struct, json, hashlib
from PIL import Image
from extract import resources, unpack, shape_pixels

source, output = map(Path, sys.argv[1:3])
palette = resources(unpack((source/'SDMAIN.PVS').read_bytes()))['!pal'][16:]
palette = [min(255, value*4) for value in palette]
index = {}
for carfile in sorted(source.glob('CAR*.RES')):
    car = carfile.stem[3:]
    frames = {}
    hashes = {}
    directory = output/car
    directory.mkdir(parents=True, exist_ok=True)
    for prefix in ['STDA', 'STDB']:
        path = source/(prefix+car+'.PVS')
        data = path.read_bytes()
        hashes[path.name] = hashlib.sha256(data).hexdigest()
        for name, frame in resources(unpack(data)).items():
            if name.startswith('!'): continue
            width, height = struct.unpack_from('<HH',frame)
            x, y = struct.unpack_from('<hh',frame,8)
            assert len(frame) == 16+width*height, (path.name,name,width,height,len(frame))
            image = Image.frombytes('P',(width,height),shape_pixels(frame))
            image.putpalette(palette)
            filename = name.strip()+'.png'
            image.convert('RGBA').save(directory/filename)
            frames[name] = {'file':filename,'width':width,'height':height,'x':x,'y':y,'source':path.name}
    assert 'dash' in frames, car
    dash = frames['dash']
    composite = Image.new('RGBA',(320,200-dash['y']),(0,0,0,0))
    # These are the opaque dashboard layers; masks/instruments remain individual
    # assets for the later exact gauge and animation reconstruction.
    for name in ['dash','gbox','whl1']:
        if name not in frames: continue
        f=frames[name]
        composite.paste(Image.open(directory/f['file']),(f['x'],f['y']-dash['y']))
    composite.save(directory/'dashboard.png')
    index[car]={'sourceSHA256':hashes,'frames':frames,'dashboardTop':dash['y']}
(output/'index.json').write_text(json.dumps(index,indent=2))
print(f'Preserved original cockpit sprites, layouts and source hashes for {len(index)} cars')
