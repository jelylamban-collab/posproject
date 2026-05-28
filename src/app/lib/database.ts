export type TableName =
  | 'users'
  | 'customers'
  | 'menu_items'
  | 'ingredients'
  | 'menu_item_ingredients'
  | 'tables'
  | 'orders'
  | 'order_items'
  | 'order_item_customizations'
  | 'payments'
  | 'discounts'
  | 'receipts'
  | 'refunds'
  | 'reports'
  | 'table_waitlist';

export type DbRecord = Record<string, unknown> & { id: string };

const storageKey = 'restaurant_pos_database_v2';

const seedDatabase: Record<TableName, DbRecord[]> = {
  users: [
    { id: 'USR-0001', username: 'admin', name: 'Admin User', role: 'admin', last_login: null },
    { id: 'USR-0002', username: 'staff', name: 'Staff Cashier', role: 'cashier', last_login: null },
  ],
  customers: [],
  menu_items: [
    { id: 'PRD-0001', name: 'Wagyu Steak', category: 'meal', description: 'Grilled premium beef with garlic butter.', price: 250, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop' },
    { id: 'PRD-0002', name: 'Truffle Pasta', category: 'meal', description: 'Cream pasta with truffle oil and parmesan.', price: 180, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop' },
    { id: 'PRD-0003', name: 'Grilled Salmon', category: 'meal', description: 'Seared salmon with lemon and herbs.', price: 220, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop' },
    { id: 'PRD-0004', name: 'Burger Deluxe', category: 'snacks', description: 'Beef burger with cheese and fresh vegetables.', price: 150, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop' },
    { id: 'PRD-0005', name: 'Spring Rolls', category: 'snacks', description: 'Crispy rolls with vegetables and pork.', price: 80, image: 'https://images.unsplash.com/photo-1534674343483-e7df7f1c69c3?w=200&h=200&fit=crop' },
    { id: 'PRD-0006', name: 'Fresh Lemonade', category: 'beverages', description: 'Fresh lemon juice with ice.', price: 80, image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d?w=200&h=200&fit=crop' },
    { id: 'PRD-0007', name: 'Iced Coffee', category: 'beverages', description: 'Cold coffee with milk and ice.', price: 95, image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=200&h=200&fit=crop' },
    { id: 'PRD-0008', name: 'Tiramisu', category: 'dessert', description: 'Coffee-soaked layered dessert.', price: 120, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&h=200&fit=crop' },
    { id: 'PRD-0009', name: 'Cheesecake', category: 'dessert', description: 'Cream cheese cake with graham crust.', price: 110, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=200&h=200&fit=crop' },
  ],
  ingredients: [
    { id: 'ING-001', name: 'Sauce', stock: 5000, unit: 'ml' },
    { id: 'ING-002', name: 'Cheese', stock: 3000, unit: 'g' },
    { id: 'ING-003', name: 'Meat', stock: 10000, unit: 'g' },
    { id: 'ING-004', name: 'Onion', stock: 2000, unit: 'g' },
  ],
  menu_item_ingredients: [],
  tables: Array.from({ length: 12 }, (_, index) => ({
    id: `TBL-${String(index + 1).padStart(2, '0')}`,
    number: index + 1,
    status: [2, 6, 10].includes(index + 1) ? 'occupied' : [3, 8].includes(index + 1) ? 'reserved' : 'available',
  })),
  orders: [],
  order_items: [],
  order_item_customizations: [],
  payments: [],
  discounts: [],
  receipts: [],
  refunds: [],
  reports: [],
  table_waitlist: [],
};

const readDatabase = () => {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    localStorage.setItem(storageKey, JSON.stringify(seedDatabase));
    return seedDatabase;
  }
  const parsed = JSON.parse(stored) as Partial<Record<TableName, DbRecord[]>>;
  const migrated = { ...seedDatabase, ...parsed } as Record<TableName, DbRecord[]>;
  Object.keys(seedDatabase).forEach((key) => {
    const table = key as TableName;
    if (!Array.isArray(migrated[table])) migrated[table] = [];
  });
  localStorage.setItem(storageKey, JSON.stringify(migrated));
  return migrated;
};

const writeDatabase = (database: Record<TableName, DbRecord[]>) => {
  localStorage.setItem(storageKey, JSON.stringify(database));
};

export const db = {
  all(table: TableName) {
    return readDatabase()[table] ?? [];
  },
  insert(table: TableName, record: DbRecord) {
    const database = readDatabase();
    database[table] = [record, ...(database[table] ?? [])];
    writeDatabase(database);
    return record;
  },
  update(table: TableName, id: string, patch: Record<string, unknown>) {
    const database = readDatabase();
    database[table] = database[table].map((record) =>
      record.id === id ? { ...record, ...patch } : record,
    );
    writeDatabase(database);
  },
  delete(table: TableName, id: string) {
    const database = readDatabase();
    database[table] = database[table].filter((record) => record.id !== id);
    writeDatabase(database);
  },
  nextId(prefix: string, table: TableName) {
    const next = (readDatabase()[table] ?? []).length + 1;
    if (prefix === 'ORD') return String(next).padStart(6, '0');
    const width = ['REC', 'PAY', 'REF', 'CUS', 'USR', 'PRD'].includes(prefix) ? 4 : 5;
    return `${prefix}-${String(next).padStart(width, '0')}`;
  },
  reset() {
    writeDatabase(seedDatabase);
  },
};
