import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hideTargets, parseSavedDisplays, rememberVisibleDisplays, restoreTargets } from './visibility';
import type { Pet } from '../shared/types';

const pet = (id: string, display: Pet['display']): Pet => ({
  id,
  name: id,
  size: 462,
  balanceEnabled: true,
  display,
  position: { corner: 'top-right', marginX: 24, marginY: 100 },
});

test('rememberVisibleDisplays 跳过已经 none 的宠物', () => {
  const remembered = rememberVisibleDisplays([pet('main', 'both'), pet('desk', 'desktop'), pet('gone', 'none')]);
  assert.deepEqual(remembered, { main: 'both', desk: 'desktop' });
});

test('hideTargets 只写非 none 的宠物，目标一律 none', () => {
  assert.deepEqual(hideTargets([pet('main', 'web'), pet('gone', 'none')]), [{ id: 'main', display: 'none' }]);
});

test('restoreTargets 按隐藏前记录恢复，缺失/为 none 时回退 both', () => {
  assert.deepEqual(restoreTargets([pet('main', 'none'), pet('desk', 'none')], { main: 'desktop' }), [
    { id: 'main', display: 'desktop' },
    { id: 'desk', display: 'both' },
  ]);
  assert.deepEqual(restoreTargets([pet('main', 'none')], { main: 'none' }), [{ id: 'main', display: 'both' }]);
});

test('parseSavedDisplays 拒绝损坏与非法值', () => {
  assert.equal(parseSavedDisplays(null), null);
  assert.equal(parseSavedDisplays('not json'), null);
  assert.equal(parseSavedDisplays('[]'), null);
  assert.equal(parseSavedDisplays('{"main":"bogus"}'), null);
  assert.deepEqual(parseSavedDisplays('{"main":"desktop","gone":"none"}'), {
    main: 'desktop',
    gone: 'none',
  });
});
