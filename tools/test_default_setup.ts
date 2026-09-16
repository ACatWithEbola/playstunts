import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {browserDefaultSetup, loadBrowserSetupSelection, NATIVE_GAME_DIRECTORY_KEY} from '../lib/game/browser-setup-selection.ts';
import {readOriginalSetupSelection} from '../lib/game/read-setup-selection.ts';
import {nativeLaunchProfile} from '../lib/game/native-launch-profile.ts';
import {createOriginalSetupMemory} from '../lib/game/initialize-setup-state.ts';
import {initializeOriginalSetupMenus} from '../lib/game/initialize-setup-menus.ts';
import {loadOriginalSetupConfiguration, saveOriginalSetupConfiguration} from '../lib/game/native-setup-configuration.ts';
import {createNativeSetupStorage} from '../lib/game/native-setup-storage.ts';
import {nativeFileKey, type NativeStoredFile} from '../lib/game/native-file-store.ts';

const resource = JSON.parse(readFileSync(new URL('../public/game/setup-initial-data.json', import.meta.url), 'utf8'));
const initial = Buffer.from(resource.data, 'hex');

await test('fresh browser SETUP selects Sound Blaster and saves the original /ssb command', async () => {
  const configuration = browserDefaultSetup();
  const selected = await readOriginalSetupSelection(initial, configuration);
  assert.deepEqual(selected, {video: 4, sound: 4, control: -1, language: -1, printer: -1, soundParameter: -1});
  // The original Sound Blaster alias uses the same OPL driver as AdLib.
  assert.deepEqual(nativeLaunchProfile(selected), nativeLaunchProfile({...selected, sound: 3}));
  assert.equal(nativeLaunchProfile(selected).soundDevice, undefined);
  assert.equal(nativeLaunchProfile(selected).initiallyMuted, false);
  const memory = createOriginalSetupMemory(initial);
  initializeOriginalSetupMenus(memory);
  await loadOriginalSetupConfiguration(memory, {
    open: () => 3, read: () => ({result: configuration.length, bytes: configuration}),
    close: () => 0, detectVideo: () => 4, error() {assert.fail('Unexpected SETUP read error');},
  });
  const saved = await saveOriginalSetupConfiguration(memory, {
    create: () => 3, write: (_handle, bytes) => bytes.length, close: () => 0,
    error() {assert.fail('Unexpected SETUP save error');},
  });
  assert.match(new TextDecoder().decode(saved), /load\.exe \/u MCGA  \/ssb /);
  assert.deepEqual(await readOriginalSetupSelection(initial, saved), selected);
  // Browser seeding must not rewrite the original missing-file detection rule.
  assert.equal((await readOriginalSetupSelection(initial, null, 4)).sound, 1);
  assert.equal((await readOriginalSetupSelection(initial, null, 3)).sound, 2);
});

await test('Setup storage uses the new seed only when a user has no saved SETUP.DAT', async () => {
  for (const savedSound of [undefined, 0, 1, 2, 3, 4, 5]) {
    const bytes = savedSound === undefined ? undefined : Buffer.from(`rem 2 ${savedSound} -1 -1 -1 -1\r\n`);
    const files: NativeStoredFile[] = bytes ? [{key: 'C:\\SETUP.DAT', bytes}] : [];
    const before = structuredClone(files);
    const storage = await createNativeSetupStorage(new Map([
      ['C:\\SETUP.DAT', {bytes: browserDefaultSetup(), timestamp: 0}],
    ]), {all: async () => files, async put() {assert.fail('Reading Setup must not overwrite settings');}});
    const configuration = await storage.read('SETUP.DAT');
    assert.ok(configuration);
    const selected = await readOriginalSetupSelection(initial, configuration.bytes);
    assert.equal(selected.sound, savedSound ?? 4);
    assert.equal(selected.video, bytes ? 2 : 4);
    if (bytes) assert.deepEqual(Uint8Array.from(configuration.bytes), Uint8Array.from(bytes));
    assert.deepEqual(structuredClone(files), before);
  }
});

await test('actual browser launch defaults to Sound Blaster and retains existing per-directory settings', async () => {
  const names = ['indexedDB', 'localStorage', 'fetch'] as const;
  const descriptors = names.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
  let directory = 'C:\\', files: NativeStoredFile[] = [], closed = 0;
  // Minimal asynchronous browser read boundary; every write is rejected.
  const request = (result: unknown) => {
    const value = {result, onsuccess: undefined as (() => void) | undefined};
    queueMicrotask(() => value.onsuccess?.());
    return value;
  };
  Object.defineProperty(globalThis, 'indexedDB', {configurable: true, value: {
    open(name: string, version: number) {
      assert.equal(name, 'stunts-native-files'); assert.equal(version, 1);
      return request({close() {closed++;}, transaction(store: string, mode?: string) {
        assert.equal(store, 'files'); assert.equal(mode, undefined, 'launch must not write saved files');
        return {objectStore: () => ({getAll: () => request(files)})};
      }});
    },
  }});
  Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: {
    getItem(key: string) {assert.equal(key, NATIVE_GAME_DIRECTORY_KEY); return directory;},
  }});
  Object.defineProperty(globalThis, 'fetch', {configurable: true, value: async (url: string) => {
    assert.equal(url, '/game/setup-initial-data.json', 'no Roland ROM or other optional resource is requested');
    return {ok: true, json: async () => resource};
  }});
  try {
    for (const path of ['C:\\', 'C:\\STUNTS\\']) for (const sound of [undefined, 0, 1, 2, 3, 4, 5]) {
      directory = path;
      files = sound === undefined ? [] : [{key: nativeFileKey(path, 'SETUP', '.DAT'), bytes: Buffer.from(`rem 2 ${sound} -1 -1 -1 -1\r\n`)}];
      const before = structuredClone(files);
      const loaded = await loadBrowserSetupSelection(new AbortController().signal);
      assert.equal(loaded.directory, path);
      assert.equal(loaded.selection.sound, sound ?? 4);
      assert.equal(loaded.selection.video, sound === undefined ? 4 : 2);
      assert.deepEqual(structuredClone(files), before);
    }
    assert.equal(closed, 14, 'every launch closes its read connection');
  } finally {
    names.forEach((name, index) => {
      if (descriptors[index]) Object.defineProperty(globalThis, name, descriptors[index]!);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
});
