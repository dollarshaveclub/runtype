const {
  resolveType,
  validateType,
  aliases: {
    ID,
  },
  interfaces: {
    User,
    Product,
    Address,
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

test('interfaces', () => {
  expect.assertions(10)

  try { User() }
  catch (e) { expect(true).toBeTruthy() }

  try { User({}) }
  catch (e) { expect(true).toBeTruthy() }

  try { User({ name: 5, age: '5' }) }
  catch (e) { expect(true).toBeTruthy() }

  User({ name: 'Jacob', age: 26 })
  expect(true).toBeTruthy()

  // Product
  try { Product({ sku: null, price: 5 }) }
  catch (e) { expect(true).toBeTruthy() }

  Product({ sku: 'M-EXEC-1', price: 5 })
  expect(true).toBeTruthy()

  try { Product({ sku: 'M-EXEC-1', price: 5, name: true }) }
  catch (e) { expect(true).toBeTruthy() }

  Product({ sku: 'M-EXEC-1', price: 5, name: 'The Executive' })
  expect(true).toBeTruthy()

  try { Address({ line1: 'foo', zip: 90066, line2: true }) }
  catch (e) { expect(true).toBeTruthy() }

  Address({ line1: 'foo', zip: 90066, line2: 'Marina Del Rey' })
  expect(true).toBeTruthy()
})
