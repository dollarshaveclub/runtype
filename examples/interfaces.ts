type ID = string | number

export interface User {
  name: string,
  age: number,
}

interface Product {
  sku: string,
  price: number,
  name?: string,
}
