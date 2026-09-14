"""Prepare verified original-file copies and decoded assets locally.

Generates fresh startup resources without captured original sessions.
Original files are never downloaded, modified or added to Git.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import zipfile
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
    parser.add_argument('--roms',type=Path,help='Directory containing your legally supplied MT-32 control and PCM ROMs')
    parser.add_argument('--site-art',type=Path,help='Optional original site artwork directory; see README')
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
        unpacked = staging/'unpacked'
        subprocess.run([sys.executable, str(ROOT/'tools/unpack_executables.py'), str(normalized), str(unpacked)], check=True)
        from extract_static_tables import generate as static_tables
        from extract_menu_assets import generate as menu_assets
        from extract_auxiliary_assets import generate as auxiliary_assets
        static_tables(unpacked, game)
        menu_assets(normalized, unpacked, game)
        auxiliary_assets(normalized, unpacked, game)
        from extract_scene_catalogs import generate as scene_catalogs
        from extract_editor_catalogs import generate as editor_catalogs
        scene_catalogs(normalized, unpacked, game)
        editor_catalogs(normalized, unpacked, game)
        from extract_presentation import generate as presentation
        from extract_music_seeds import generate as music_seeds
        presentation(normalized, game)
        from extract_setup import extract as setup_text
        (game/'setup-reference.json').write_text(json.dumps(setup_text((normalized/'SETUP.EXE').read_bytes()),indent=2)+'\n')
        music_seeds(normalized, unpacked, game)
        shutil.copytree(ROOT/'vendor/runtime', public, dirs_exist_ok=True)
        if args.roms:
            for name in ['ctrl_mt32_1_07.rom','pcm_mt32.rom']:
                rom=args.roms/name
                if not rom.is_file():raise ValueError('Missing Roland ROM: '+name)
                expected=next(row for row in json.loads((ROOT/'docs/runtime-file-checksums.json').read_text()) if row['path']=='game/mt32-local/'+name)
                if hashlib.sha256(rom.read_bytes()).hexdigest()!=expected['sha256']:raise ValueError('Unsupported Roland ROM: '+name)
                shutil.copyfile(rom,game/'mt32-local'/name)
        if args.site_art:
            for name in ['manual-cover-spread.png','manual-red-car.png','setup-menu.png']:
                file=args.site_art/name
                if not file.is_file():raise ValueError('Missing optional site artwork: '+name)
                shutil.copyfile(file,public/'site'/name)
            for directory in ['stunts-box','enhanced-backgrounds']:
                source=args.site_art/directory
                if source.is_dir():shutil.copytree(source,public/'site'/directory,dirs_exist_ok=True)
        node = shutil.which('node')
        if node is None:
            raise ValueError('Node.js 24 or newer is required for native startup resource generation')
        subprocess.run([node, str(ROOT/'tools/generate_startup.ts'), str(game)], check=True)
        scores=game/'high-scores';scores.mkdir(exist_ok=True)
        for name,file in files.items():
            if name.endswith('.HIG'):shutil.copyfile(file,scores/file.name)
        (scores/'manifest.json').write_text(json.dumps({f.stem:{'file':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in scores.glob('*.HIG')},separators=(',',':')))
        media=game/'setup-media';media.mkdir(exist_ok=True)
        entries=[]
        for name,file in sorted(files.items()):
            data=file.read_bytes();(media/name).write_bytes(data)
            entries.append(dict(name=name,url='/game/setup-media/'+name,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),dosDateTime=[1990,12,13,0,0,0]))
        (media/'manifest.json').write_text(json.dumps({'files':entries},separators=(',',':')))
        emulator=public/'emulator';emulator.mkdir(exist_ok=True)
        for name in ['emulators.js','wdosbox.js','wdosbox.wasm','wlibzip.js','wlibzip.wasm']:
            shutil.copyfile(ROOT/'node_modules/emulators/dist'/name,emulator/name)
        with zipfile.ZipFile(game/'stunts.jsdos','w',zipfile.ZIP_DEFLATED) as bundle:
            for name,file in sorted(files.items()):bundle.write(file,name)
            bundle.writestr('.jsdos/dosbox.conf',(ROOT/'tools/dosbox.conf').read_text())
        # Generate the catalog from actual supplied resources, not reference-only tracks.
        resources = game/'original-resources'
        manifest = {}
        for file in sorted(resources.iterdir()):
            if file.is_file():
                data = file.read_bytes()
                manifest[file.name] = {'file':file.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
        (resources/'manifest.json').write_text(json.dumps({'files':manifest},indent=2)+'\n')
        from check_assets import required_problems
        problems=required_problems(public)
        if problems:raise ValueError('Incomplete runtime: '+str(problems))
        inventory=[{'path':str(f.relative_to(public)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(public.rglob('*')) if f.is_file()]
        (public/'asset-inventory.json').write_text(json.dumps(inventory,indent=2)+'\n')
        report = {'complete':True,'missingOptionalReferenceInputs':missing,'generatedFiles':len(inventory),'rolandRomsInstalled':bool(args.roms),'customSiteArtInstalled':bool(args.site_art)}
        (public/'preparation-report.json').write_text(json.dumps(report,indent=2)+'\n')
        shutil.move(str(public), str(output))
    print(f'Prepared {report["generatedFiles"]} files at {output}')
    print('Runtime preparation complete. No game files or ROMs were downloaded.')

if __name__ == '__main__':
    main()
