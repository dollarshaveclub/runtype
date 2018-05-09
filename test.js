const {
  resolveType,
  validateType,
  aliases,
  interfaces,
  enums,
} = require('./build/runtype-test')

test('resolveType', () => {
  expect.assertions(6)
  expect(resolveType(null)).toBe('null')
  expect(resolveType([])).toBe('array')
  expect(resolveType({})).toBe('object')
  expect(resolveType(2)).toBe('number')
  expect(resolveType('foo')).toBe('string')
  expect(resolveType(false)).toBe('boolean')
})

test('validateType', () => {
  expect.assertions(1)

  try {
    validateType('foo', 5, ['string'])
  } catch (e) {
    expect(true).toBeTruthy()
  }

  validateType('bar', 5, ['number'])
})
