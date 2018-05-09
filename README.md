# Runtype
Runtype converts Typescript type aliases, interfaces, and enums to Javascript that can be used during runtime

## Installing
```bash
npm i --save-dev @dollarshaveclub/runtype
```

## Example
Define your interfaces
```typescript
// example.ts
type ID = string | number

interface Product {
  sku: string,
  price: number,
  name?: string,
}

interface CartAddEvent {
  event: 'cartAdd',
  sku: string,
}
```

Transpile to Javascript
```bash
runtype -f example.ts -o example.js
```

Interact with JS
```javascript
const {
  aliases: {
    ID,
  },
  interfaces: {
    Product,
    CartAddEvent,
  },
} = require('./example.js')

ID(true) // Error
ID('123')
ID(123)

Product() // Error
Product({}) // Error
Product({ sku: true, price: 5 }) // Error
Product({ sku: 'M-EXEC-1', price: 5, name: 5 }) // Error
Product({ sku: 'M-EXEC-1', price: 5, name: 'The Executive' })

CartAddEvent({ event: 'foobar', sku: 'M-EXEC-1' }) // Error: event value is not 'cartAdd'
```
