const {
  resolveType,
  validate,
  aliases: {
    ID,
  },
  interfaces: {
    User,
    Product,
    Address,
    CartAddEvent,
    CartViewEvent,
    CartGift,
  },
  enums: {
    Carts,
  }
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

test('validate', () => {
  expect(validate('ID', 5)).toBeTruthy()
  expect(validate('ID', [])).toBeFalsy()
})

test('enums', () => {
  CartGift({
    cart: Carts.Gift,
  })
})

test('aliases', () => {
  const cases = [
    { fn: ID, value: undefined, expectFailure: true },
    { fn: ID, value: false, expectFailure: true },
    { fn: ID, value: 123 },
    { fn: ID, value: '123' },
  ]
  expect.assertions(cases.length)
  runCases(cases)
})

test('interfaces.basic', () => {
  const cases = [
    { fn: User, value: undefined, expectFailure: true },
    { fn: User, value: {}, expectFailure: true },
    { fn: User, value: { name: 5, age: '5' }, expectFailure: true },
    { fn: User, value: { name: 'Jacob', age: 26 } },
  ]
  expect.assertions(cases.length)
  runCases(cases)
})

test('interfaces.optionalParams', () => {
  const cases = [
    { fn: Product, value: { sku: null, price: 5 }, expectFailure: true },
    { fn: Product, value: { sku: 'M-EXEC-1', price: 5 } },
    { fn: Product, value: { sku: 'M-EXEC-1', price: 5, name: true }, expectFailure: true },
    { fn: Product, value: { sku: 'M-EXEC-1', price: 5, name: 'The Executive' } },
  ]
  expect.assertions(cases.length)
  runCases(cases)
})

test('interfaces.literalValues', () => {
  const cases = [
    { fn: CartAddEvent, value: { event: 'foo', sku: 'M-EXEC-1' }, expectFailure: true },
    { fn: CartAddEvent, value: { event: 'cartAdd', sku: 'M-EXEC-1' } },
    { fn: CartAddEvent, value: { sku: 'M-EXEC-1' } },
    { fn: CartAddEvent, value: { sku: 'M-EXEC-1', items: ['a', 'b', 'c'] } },
  ]
  expect.assertions(cases.length)
  runCases(cases)
})

test('interfaces.arrays', () => {
  const product = {
    id: '123',
    sku: 'foo',
    price: 5,
  }
  const cases = [
    { fn: CartAddEvent, value: { sku: 'M-EXEC-1', items: ['a', 'b', 'c'] } },
    { fn: CartAddEvent, value: { sku: 'M-EXEC-1', items: ['a', 3, 'c'] }, expectFailure: true },
    { fn: CartViewEvent, value: { sku: 'M-EXEC-1', items: [product, product, product] } },
  ]
  expect.assertions(cases.length)
  runCases(cases)
})

test('interfaces.references', () => {
  const cases = [
    { fn: Product, value: { sku: 'M-EXEC-1', price: 5, name: 'The Executive', id: 'foo' } },
  ]
  expect.assertions(cases.length)
  runCases(cases)
})

test('multiple files', () => {
  const cases = [
    { fn: Address, value: { line1: 'foo', zip: 90066, line2: true }, expectFailure: true },
    { fn: Address, value: { line1: 'foo', zip: 90066, line2: 'Marina Del Rey' } },
  ]
  expect.assertions(cases.length)
  runCases(cases)
})

function runCases (cases) {
  cases.forEach(({ fn, value, expectFailure }) => {
    if (expectFailure) {
      try {
        fn(value)
      } catch (e) {
        expect(true).toBeTruthy()
      }
    } else {
      fn(value)
      expect(true).toBeTruthy()
    }
  })
}
