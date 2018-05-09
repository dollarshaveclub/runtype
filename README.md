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
type Foo = boolean | null

interface Product {
  id: number | string,
  sku: string,
  name?: string,
}
```

Transpile to Javascript
```bash
runtype -f example.ts -o example.js
```

Interact with JS
```javascript
const { aliases, interfaces } = require('./example.js')

aliases.Foo('Hello') // Throws an error
aliases.Foo(null) // Fine
aliases.Foo(false) // Fine

interfaces.User() // Throws an error
interfaces.User({}) // Throws an error
interfaces.User({ id: 5, sku: true }) // Throws an error
interfaces.User({ id: 5, sku: 'M-EXEC-1', name: 5 }) // Throws an error
interfaces.User({ id: 5, sku: 'M-EXEC-1', name: 'The Executive' }) // Fine
```
