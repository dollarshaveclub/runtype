type ID = string | number

interface User {
  name: string,
  age: number,
}

interface Product {
  id: number,
  sku: string,
  price: number,
  name?: string,
}
