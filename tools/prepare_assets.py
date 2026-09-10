"""Prepare verified original-file copies and decoded assets locally.

This stage does not yet generate captured startup-state dependencies.
Original files are never downloaded, modified or added to Git.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from extract import extract

ROOT = Path(__file__).resolve().parents[1]

def source_files(source):
    result = {}
    for file in source.iterdir():
        if not file.is_file():
            continue
        key = file.name.upper()
        if key in result:
            raise ValueError(f'Duplicate case-insensitive filename: {key}')
        result[key] = file
    return result

def copy_verified(files, recipes, output):
    missing = []
    for row in recipes:
        name = row['source'].upper()
        file = files.get(name)
        if file is None:
            missing.append(name)
            continue
        data = file.read_bytes()
        if hashlib.sha256(data).hexdigest() != row['sha256']:
            raise ValueError(f'Unsupported reference file checksum: {name}')
        relative = Path(row['path'])
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('Invalid output path')
        target = output / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    return sorted(set(missing))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--original', required=True, type=Path, help='Your original DOS installation directory')
    parser.add_argument('--output', type=Path, default=ROOT/'local-assets/prepared', help='A NEW output directory')
    args = parser.parse_args()
    source = args.original.resolve()
    output = args.output.resolve()
    if output.exists():
        parser.error('Output already exists. Choose a new directory; existing files are never overwritten.')
    if source == output or source in output.parents:
        parser.error('Keep generated output outside the original installation.')
    files = source_files(source)
    recipes = json.loads((ROOT/'docs/direct-asset-recipes.json').read_text())
    # A staging directory avoids installing partial files after a decode error.
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='stunts-assets-', dir=output.parent) as temporary:
        staging = Path(temporary)
        normalized = staging/'original'
        normalized.mkdir()
        for name, file in files.items():
            shutil.copyfile(file, normalized/name)
        public = staging/'public'
        public.mkdir()
        missing = copy_verified(files, recipes, public)
        decoded = staging/'decoded'
        extract(normalized, decoded)
        game = public/'game'
        game.mkdir(exist_ok=True)
        shutil.copyfile(decoded/'assets.json', game/'assets.json')
        subprocess.run([sys.executable, str(ROOT/'tools/extract_cockpits.py'), str(normalized), str(game/'cockpit')], check=True)
        subprocess.run([sys.executable, str(ROOT/'tools/extract_cockpit_crash.py'), str(normalized), str(game/'cockpit/crash.json')], check=True)
        subprocess.run([sys.executable, str(ROOT/'tools/extract_gauges.py'), str(normalized), str(game/'cockpit/gauges.json')], check=True)
        subprocess.run([sys.executable, str(ROOT/'tools/extract_car_models.py'), str(normalized), str(game/'car-models')], check=True)
        for car_file in sorted(normalized.glob('CAR*.RES')):
            car=car_file.stem[3:]
            subprocess.run([sys.executable, str(ROOT/'tools/extract_instrument_panel.py'), str(normalized), str(game/'cockpit'/car/'panel.json'), car], check=True)
        # Generate the catalog from actual supplied resources, not reference-only tracks.
        resources = game/'original-resources'
        manifest = {}
        for file in sorted(resources.iterdir()):
            if file.is_file():
                data = file.read_bytes()
                manifest[file.name] = {'file':file.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
        (resources/'manifest.json').write_text(json.dumps({'files':manifest},indent=2)+'\n')
        report = {'complete':False,'missingReferenceInputs':missing,'generatedFiles':sum(f.is_file() for f in public.rglob('*')),'remaining':'Startup memory, further extracted catalogs and presentation dependencies still require generators. Do not install this as a complete runtime.'}
        (public/'preparation-report.json').write_text(json.dumps(report,indent=2)+'\n')
        shutil.move(str(public), str(output))
    print(f'Prepared {report["generatedFiles"]} files at {output}')
    print('PARTIAL preparation only; see preparation-report.json. No downloads were performed.')

if __name__ == '__main__':
    main()
