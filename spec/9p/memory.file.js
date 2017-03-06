
const tap = require('tap')
const test = tap.test
const Maybe = require('data.maybe')
// const Just = Maybe.Just
const Nothing = Maybe.Nothing

const MemoryFileSystem = require('../../lib.es5/fs_memory').default

test('actions 1', t => {
  const root = new MemoryFileSystem().tree
  t.ok(root)
  t.ok(root.isRoot())

  function mkdir (path) {
    return root.mkdir(path)
  }

  function mkfile (path) {
    return root.mkfile(path)
  }

  function lookup (path, getParent) {
    return root.lookup(path, getParent)
  }

  let d = Nothing()
  d = mkdir('/a')
  t.ok(d.isJust)
  d = mkdir('/cows')
  t.ok(d.isJust)
  d = mkdir('/a/cows')
  t.ok(d.isJust)
  d = mkdir('/a/cows/chickens')
  t.ok(d.isJust)

  let f = mkfile('/a/cows/names.txt')
  t.ok(f.isJust)

  d = lookup('/a/cows')
  t.ok(d.isJust)
  f = lookup('/a/cows/names.txt')
  t.ok(f.isJust)
  t.ok(f.map(x => x.isFile()).getOrElse(false))
  t.equals(f.map(x => x.name).getOrElse(null), 'names.txt')

  f = lookup('/a/../a/cows/names.txt')
  t.ok(f.isJust)
  t.ok(f.map(x => x.isFile()).getOrElse(false))
  t.equals(f.map(x => x.name).getOrElse(null), 'names.txt')

  t.equals(f.map(x => x.getFullPath()).get(), '/a/cows/names.txt')

  t.equals(f.map(x => x.getRoot()).get(), root)

  t.end()
})
