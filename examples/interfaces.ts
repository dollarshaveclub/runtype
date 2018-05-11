type ID = string | number

export interface User {
  name: string,
  age: number,
}

interface Product {
  id?: ID,
  sku: string,
  price: number,
  name?: string,
}

interface CartAddEvent {
  event?: 'cartAdd',
  sku: string,
}
