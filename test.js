const {
  resolveType,
  validateType,
  validateValue,
  aliases: {
    ID,
  },
  interfaces: {
    User,
    Product,
    Address,
    CartAddEvent,
  },
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

test('validateValue', () => {
  expect.assertions(1)

  try { validateValue('foo', 5, [4]) }
  catch (e) { expect(true).toBeTruthy() }

  validateValue('foo', 'example', ['example'])
})

test('aliases', () => {
  expect.assertions(3)

  try { ID(false) }
  catch (e) { expect(true).toBeTruthy() }

  try { ID() }
  catch (e) { expect(true).toBeTruthy() }

  ID(123)
  ID('123')

  expect(true).toBeTruthy()
})

test('interfaces.basic', () => {
  expect.assertions(4)

  try { User() }
  catch (e) { expect(true).toBeTruthy() }

  try { User({}) }
  catch (e) { expect(true).toBeTruthy() }

  try { User({ name: 5, age: '5' }) }
  catch (e) { expect(true).toBeTruthy() }

  User({ name: 'Jacob', age: 26 })
  expect(true).toBeTruthy()
})

test('interfaces.optionalParams', () => {
  // Product
  try { Product({ sku: null, price: 5 }) }
  catch (e) { expect(true).toBeTruthy() }

  Product({ sku: 'M-EXEC-1', price: 5 })
  expect(true).toBeTruthy()

  try { Product({ sku: 'M-EXEC-1', price: 5, name: true }) }
  catch (e) { expect(true).toBeTruthy() }

  Product({ sku: 'M-EXEC-1', price: 5, name: 'The Executive' })
  expect(true).toBeTruthy()
})

test('multiple files', () => {
  try { Address({ line1: 'foo', zip: 90066, line2: true }) }
  catch (e) { expect(true).toBeTruthy() }

  Address({ line1: 'foo', zip: 90066, line2: 'Marina Del Rey' })
  expect(true).toBeTruthy()
})


test('interfaces.literalValues', () => {
  expect.assertions(3)

  try { CartAddEvent({ event: 'foo', sku: 'M-EXEC-1' }) }
  catch (e) { expect(true).toBeTruthy() }

  CartAddEvent({ event: 'cartAdd', sku: 'M-EXEC-1' })
  expect(true).toBeTruthy()

  CartAddEvent({ sku: 'M-EXEC-1' })
  expect(true).toBeTruthy()
})
