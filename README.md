# Runtype
Runtype converts Typescript type aliases, interfaces, and enums to Javascript that can be used during runtime

## Installing
```bash
npm i --save-dev runtype
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
  }
} = require('./example.js')

ID(true) // Throws an error
ID('123') // Fine
ID(123) // Fine

Product() // Throws an error
Product({}) // Throws an error
Product({ sku: true, price: 5 }) // Throws an error
Product({ sku: 'M-EXEC-1', price: 5, name: 5 }) // Throws an error
Product({ sku: 'M-EXEC-1', price: 5, name: 'The Executive' }) // Fine
```
