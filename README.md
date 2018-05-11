<p align="center">

</p>

***

<p align="center">
  [![CircleCI](https://circleci.com/gh/dollarshaveclub/runtype/tree/master.svg?style=svg&circle-token=ce363f7d5591f10e1cd224b419913d827adb7ee1)](https://circleci.com/gh/dollarshaveclub/runtype/tree/master)
  [![NPM Version](https://badge.fury.io/js/%40dollarshaveclub%2Fruntype.svg)](https://www.npmjs.com/package/@dollarshaveclub/runtype)
  [![codecov](https://codecov.io/gh/dollarshaveclub/runtype/branch/master/graph/badge.svg?token=kuFDT8fFIh)](https://codecov.io/gh/dollarshaveclub/runtype)
</p>

***

> Runtype converts Typescript type aliases, interfaces, and enums to Javascript that can be used during runtime

### Features
* Uses Typescript Compiler
* Recursive validation during runtime
* Well Tested
* Many [supported types](#support)

### Installing
```bash
npm i --save-dev @dollarshaveclub/runtype
```

## Transpiling
First things first, you need to have some typescript that you'd like to transpile to javascript.
### Command Line
```bash
# STDIN / STDOUT
$ echo 'type ID = string | number' | runtype >> ./output.js

# Input from disk + STDOUT
$ echo runtype -f './files/**/*.ts' >> ./output.js

# Input from / Output to disk
$ echo runtype -f './files/**/*.ts' -o ./output.js

# Debug
echo 'type ID = string | number' | runtype -d
```

### Node API
```javascript
import { parse, render } from '@dollarshaveclub/runtype'
import fs from 'fs'

const data = parse(['./files/my-types.ts'])
console.log(data.aliases.ID)

fs.writeFileSync(render(data), './output.js')
```

## Usage
Once you've transpiled your typescript, import it in your project to be compiled into your apps build.

The transpiled API allows you to validate your data with the types and interfaces defined in your typescript files. They are functions that will throw errors if the
data provided is invalid.
```javascript
import {
  aliases: { ID },
  interfaces: { Product },
}  from './output.js'

ID(123)
ID('123')
ID(true) // Throws an error

Product({ sku: 'M-EXEC-1', price: 5.00 }) // etc
```

Additional APIs are available to work with.
```javascript
import {
  runtypes, // All of your types/interfaces organized neatly
  validate, // A function that validates data, returns true or error messages
  resolveType, // A function that converts a value into a type
  aliases, // An object containing all of your type aliases
  interfaces, // An object containing all of your interfaces
} from './output.js'

console.log(runtypes) // neat

validate('ID', 5) // true
validate('ID', ['test']) // ['ID value is invalid']

resolveType(5) // "number"
resolveType([]) // "array", etc

aliases.ID(true) // throws an error
interfaces.Product({ /* etc */ }})
```

***

## Support
The following features are supported by Runtype. Contributions are always welcome!
### Aliases
```typescript
type ID = number
```

### Union Types
```typescript
type mixed = string | number | boolean | object | symbol | null | undefined
```

### Interfaces
```typescript
interface Product {
  id: string | number, // Union Types
  sku: string,
  price: number,
  type: 'product', // Literal Values
  description?: string, // Optional Properties
  parent: Product, // Reference Types
  childProducts: Product[], // Reference Array Types
  benefits: string[] // Primitive Array Types
}
```

## License
[MIT](LICENSE)
