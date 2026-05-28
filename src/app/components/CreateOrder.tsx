import { useMemo, useState } from 'react';
import { Edit2, Minus, Plus, Search, Trash2, X } from 'lucide-react';
import type { Page, POSOrder } from '../App';
import { Sidebar } from './Sidebar';
import { db } from '../lib/database';

interface CreateOrderProps {
  onNavigate: (page: Page) => void;
  onOrderCreated: (order: POSOrder) => void;
}

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  orderType: 'dine-in' | 'takeout';
  notes: string;
  ingredients: Ingredient[];
  originalIngredients: Ingredient[];
}

type DiningOption = '' | 'dine-in' | 'takeout';
type DiscountType = 'none' | 'senior' | 'pwd' | 'promo' | 'custom';

const menuCategories = [
  { id: 'all', name: 'All' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'meal', name: 'Meal' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'dessert', name: 'Dessert' },
];

const products = [
  {
    id: 1,
    name: 'Wagyu Steak',
    price: 250,
    category: 'meal',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop',
    ingredients: ['Wagyu Beef', 'Salt', 'Pepper', 'Butter', 'Garlic'],
  },
  {
    id: 2,
    name: 'Truffle Pasta',
    price: 180,
    category: 'meal',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&h=200&fit=crop',
    ingredients: ['Pasta', 'Truffle Oil', 'Parmesan', 'Cream', 'Mushrooms'],
  },
  {
    id: 3,
    name: 'Grilled Salmon',
    price: 220,
    category: 'meal',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop',
    ingredients: ['Salmon Fillet', 'Lemon', 'Olive Oil', 'Herbs', 'Salt'],
  },
  {
    id: 4,
    name: 'Burger Deluxe',
    price: 150,
    category: 'snacks',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
    ingredients: ['Beef Patty', 'Burger Bun', 'Cheese', 'Lettuce', 'Tomato'],
  },
  {
    id: 5,
    name: 'Spring Rolls',
    price: 80,
    category: 'snacks',
    image: 'https://images.unsplash.com/photo-1534674343483-e7df7f1c69c3?w=200&h=200&fit=crop',
    ingredients: ['Wrapper', 'Vegetables', 'Ground Pork', 'Soy Sauce'],
  },
  {
    id: 6,
    name: 'Fresh Lemonade',
    price: 80,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d?w=200&h=200&fit=crop',
    ingredients: ['Lemon Juice', 'Water', 'Sugar', 'Ice'],
  },
  {
    id: 7,
    name: 'Iced Coffee',
    price: 95,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=200&h=200&fit=crop',
    ingredients: ['Coffee', 'Milk', 'Sugar', 'Ice'],
  },
  {
    id: 8,
    name: 'Tiramisu',
    price: 120,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&h=200&fit=crop',
    ingredients: ['Ladyfingers', 'Mascarpone', 'Coffee', 'Cocoa Powder'],
  },
  {
    id: 9,
    name: 'Cheesecake',
    price: 110,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=200&h=200&fit=crop',
    ingredients: ['Cream Cheese', 'Graham Crust', 'Sugar', 'Eggs'],
  },
];

const customerHistory: Record<string, number[]> = {
  john: [2, 6],
  'juan dela cruz': [1, 5],
  'maria santos': [3, 7],
};

const peso = (amount: number) => `₱${amount.toFixed(2)}`;

const productDescription = (category: string) => {
  switch (category) {
    case 'meal':
      return 'Freshly cooked signature meal.';
    case 'snacks':
      return 'Quick bite served hot.';
    case 'beverages':
      return 'Refreshing house drink.';
    default:
      return 'Sweet dessert favorite.';
  }
};

const defaultIngredients: Ingredient[] = [
  { name: 'Sauce', quantity: 30, unit: 'ml' },
  { name: 'Cheese', quantity: 20, unit: 'g' },
  { name: 'Meat', quantity: 100, unit: 'g' },
  { name: 'Onion', quantity: 10, unit: 'g' },
];

export function CreateOrder({ onNavigate, onOrderCreated }: CreateOrderProps) {
  const [customerName, setCustomerName] = useState('');
  const [diningOption, setDiningOption] = useState<DiningOption>('');
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [customizeItemIndex, setCustomizeItemIndex] = useState<number | null>(null);
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [showTakeoutMode, setShowTakeoutMode] = useState(false);
  const [showNoTablesModal, setShowNoTablesModal] = useState(false);
  const [proceedWhileWaiting, setProceedWhileWaiting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [amountReceived, setAmountReceived] = useState('');
  const [paidOrder, setPaidOrder] = useState<POSOrder | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [discountIdNumber, setDiscountIdNumber] = useState('');
  const [customDiscountPercent, setCustomDiscountPercent] = useState('');

  const recommendedProducts = useMemo(() => {
    const normalizedName = customerName.trim().toLowerCase();
    if (!normalizedName) return [];

    const previousOrders = db
      .all('orders')
      .filter((order) => String(order.customer_name ?? '').toLowerCase() === normalizedName);

    const productNames = previousOrders.flatMap((order) =>
      db
        .all('order_items')
        .filter((item) => item.order_id === order.id)
        .map((item) => String(item.name)),
    );

    const databaseRecommendations = products.filter((product) => productNames.includes(product.name));
    if (databaseRecommendations.length > 0) return databaseRecommendations;

    const fallbackHistory = customerHistory[normalizedName];
    return fallbackHistory ? products.filter((product) => fallbackHistory.includes(product.id)) : [];
  }, [customerName]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const dineInItems = cart.filter((item) => item.orderType === 'dine-in');
  const takeoutItems = cart.filter((item) => item.orderType === 'takeout');
  const hasMixedOrder = dineInItems.length > 0 && takeoutItems.length > 0;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountRate =
    discountType === 'senior' || discountType === 'pwd'
      ? 0.2
      : discountType === 'promo'
        ? 0.1
        : discountType === 'custom'
          ? Math.max(0, Number(customDiscountPercent) || 0) / 100
          : 0;
  const discount = subtotal * discountRate;
  const serviceFee = subtotal * 0.01;
  const tax = (subtotal + serviceFee - discount) * 0.12;
  const total = subtotal + serviceFee + tax - discount;
  const received = Number(amountReceived) || 0;
  const change = Math.max(received - total, 0);

  const discountLabel =
    discountType === 'senior'
      ? 'Senior Citizen'
      : discountType === 'pwd'
        ? 'PWD'
        : discountType === 'promo'
          ? 'Promo Discount'
          : discountType === 'custom'
            ? 'Custom Discount'
            : 'No Discount';

  const addToCart = (product: (typeof products)[number], orderType?: 'dine-in' | 'takeout') => {
    const targetType = orderType || diningOption;
    if (!targetType) {
      setValidationMessages(['Please select dining option.']);
      return;
    }

    const ingredients = defaultIngredients.map((ingredient) => ({ ...ingredient }));
    setCart((currentCart) => [
      ...currentCart,
      {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        orderType: targetType,
        notes: '',
        ingredients,
        originalIngredients: ingredients,
      },
    ]);
    setValidationMessages([]);
  };

  const updateQuantity = (index: number, quantity: number) => {
    setCart((currentCart) =>
      quantity <= 0
        ? currentCart.filter((_, itemIndex) => itemIndex !== index)
        : currentCart.map((item, itemIndex) =>
            itemIndex === index ? { ...item, quantity } : item,
          ),
    );
  };

  const updateNotes = (index: number, notes: string) => {
    setCart((currentCart) =>
      currentCart.map((item, itemIndex) => (itemIndex === index ? { ...item, notes } : item)),
    );
  };

  const updateIngredientQuantity = (index: number, ingredientName: string, quantity: number) => {
    setCart((currentCart) =>
      currentCart.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ingredients: item.ingredients.map((ingredient) =>
                ingredient.name === ingredientName
                  ? { ...ingredient, quantity: Math.max(0, quantity) }
                  : ingredient,
              ),
            }
          : item,
      ),
    );
  };

  const deleteIngredient = (index: number, ingredientName: string) => {
    setCart((currentCart) =>
      currentCart.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ingredients: item.ingredients.filter((ingredient) => ingredient.name !== ingredientName),
            }
          : item,
      ),
    );
  };

  const validateOrder = () => {
    const messages: string[] = [];
    if (!customerName.trim()) messages.push('Please enter customer name.');
    if (!diningOption) messages.push('Please select dining option.');
    if (diningOption === 'dine-in' && !selectedTableNumber && !proceedWhileWaiting) messages.push('Please select table for dine-in order.');
    if (cart.length === 0) messages.push('Please add at least one item.');
    setValidationMessages(messages);
    return messages.length === 0;
  };

  const buildOrder = (paid: boolean): POSOrder => ({
    customerName,
    items: cart,
    subtotal,
    serviceFee,
    discount,
    discountType,
    tax,
    total,
    orderType: diningOption || 'takeout',
    timestamp: new Date(),
    paid,
    tableNumber: selectedTableNumber,
  });

  const handlePreviewOrder = () => {
    if (validateOrder()) setShowPreview(true);
  };

  const openTableSelection = () => {
    const availableTable = db.all('tables').some((table) => table.status === 'available');
    if (availableTable) {
      setShowTableSelection(true);
    } else {
      setShowNoTablesModal(true);
    }
  };

  const addCustomerToWaitingQueue = () => {
    // Mark the form as "proceed while waiting" so the user can preview/place order
    setProceedWhileWaiting(true);
    setDiningOption('dine-in');
    setShowNoTablesModal(false);
    setValidationMessages([`You're added to the waiting queue — you can preview and confirm the order. Table will be assigned when available.`]);
  };

  const switchOrderToTakeout = () => {
    setDiningOption('takeout');
    setSelectedTableNumber(null);
    setCart((currentCart) => currentCart.map((item) => ({ ...item, orderType: 'takeout' })));
    setShowNoTablesModal(false);
  };

  const saveOrderToDatabase = (order: POSOrder, paid: boolean) => {
    const orderId = createdOrderNumber || db.nextId('ORD', 'orders');
    const customerId = db.nextId('CUS', 'customers');

    if (!createdOrderNumber) {
      db.insert('customers', {
        id: customerId,
        name: customerName,
        latest_order_id: orderId,
        created_at: new Date().toISOString(),
      });
      const orderStatusValue = paid ? 'Completed' : (proceedWhileWaiting && order.orderType === 'dine-in' && !selectedTableNumber ? 'Waiting' : 'Serving');
      db.insert('orders', {
        id: orderId,
        customer_id: customerId,
        customer_name: customerName,
        dining_option: order.orderType,
        table_number: selectedTableNumber,
        subtotal,
        service_fee: serviceFee,
        tax,
        discount,
        total,
        payment_status: paid ? 'Paid' : 'Pending',
        order_status: orderStatusValue,
        created_at: new Date().toISOString(),
      });
      cart.forEach((item, index) => {
        const orderItemId = `${orderId}-ITEM-${index + 1}`;
        db.insert('order_items', {
          id: orderItemId,
          order_id: orderId,
          menu_item_id: `PRD-${String(item.id).padStart(4, '0')}`,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          order_type: item.orderType,
          notes: item.notes,
        });
        item.ingredients.forEach((ingredient) => {
          db.insert('order_item_customizations', {
            id: db.nextId('CUSMOD', 'order_item_customizations'),
            order_item_id: orderItemId,
            ingredient_name: ingredient.name,
            adjusted_quantity: ingredient.quantity,
            unit: ingredient.unit,
            inventory_deduction: ingredient.quantity * item.quantity,
          });
        });
      });
      if (discountType !== 'none') {
        db.insert('discounts', {
          id: db.nextId('DSC', 'discounts'),
          order_id: orderId,
          type: discountLabel,
          id_reference: discountIdNumber,
          percentage: discountRate * 100,
          amount: discount,
          validated: true,
        });
      }
      if (selectedTableNumber && order.orderType === 'dine-in') {
        const tableRecord = db.all('tables').find((table) => table.number === selectedTableNumber);
        if (tableRecord) db.update('tables', tableRecord.id, { status: 'occupied', current_order_id: orderId });
      } else if (proceedWhileWaiting && order.orderType === 'dine-in' && !selectedTableNumber) {
        // create a waitlist entry linked to this order so it can be auto-assigned later
        const queueId = db.nextId('QUE', 'table_waitlist');
        db.insert('table_waitlist', {
          id: queueId,
          queue_number: queueId,
          customer_name: customerName.trim() || 'Walk-in Customer',
          guests: 1,
          waiting_time: '0 min',
          status: 'Waiting',
          order_id: orderId,
          created_at: new Date().toISOString(),
        });
        // If a table is actually available right now, assign immediately
        const availableTable = db.all('tables').find((t) => t.status === 'available');
        if (availableTable) {
          db.update('tables', availableTable.id, { status: 'occupied', current_order_id: orderId });
          db.update('orders', orderId, { table_number: availableTable.number, order_status: paid ? 'Completed' : 'Serving' });
          db.update('table_waitlist', queueId, { status: 'Assigned', assigned_table_number: availableTable.number, assigned_at: new Date().toISOString() });
          setProceedWhileWaiting(false);
        }
      }
    } else {
      db.update('orders', orderId, {
        payment_status: paid ? 'Paid' : 'Pending',
        order_status: paid ? 'Completed' : 'Serving',
      });
    }

    setCreatedOrderNumber(orderId);
    return orderId;
  };

  const handleConfirmOrder = () => {
    const order = buildOrder(diningOption === 'takeout');
    setShowPreview(false);

    if (diningOption === 'takeout') {
      saveOrderToDatabase(order, false);
      setPaidOrder(order);
      setShowPayment(true);
      return;
    }

    saveOrderToDatabase(order, false);
    onOrderCreated(order);
    setPaidOrder(order);
    setShowOrderSuccess(true);
  };

  const resetOrderForm = () => {
    setCart([]);
    setCustomerName('');
    setDiningOption('');
    setSelectedTableNumber(null);
    setDiscountType('none');
    setDiscountIdNumber('');
    setCustomDiscountPercent('');
    setCreatedOrderNumber('');
    setProceedWhileWaiting(false);
  };

  const deleteOrderAndRelated = (orderId: string) => {
    // delete order items and customizations
    db.all('order_items').filter((it) => it.order_id === orderId).forEach((it) => {
      db.all('order_item_customizations').filter((c) => c.order_item_id === it.id).forEach((c) => db.delete('order_item_customizations', c.id));
      db.delete('order_items', it.id);
    });
    // delete payments and receipts
    db.all('payments').filter((p) => p.order_id === orderId).forEach((p) => db.delete('payments', p.id));
    db.all('receipts').filter((r) => r.order_id === orderId).forEach((r) => db.delete('receipts', r.id));
    // delete discounts
    db.all('discounts').filter((d) => d.order_id === orderId).forEach((d) => db.delete('discounts', d.id));
    // free any table pointing to this order
    const table = db.all('tables').find((t) => t.current_order_id === orderId);
    if (table) db.update('tables', table.id, { status: 'available', current_order_id: null });
    // delete the order
    db.delete('orders', orderId);
  };

  const handleConfirmPayment = () => {
    if (received < total) return;
    const order = buildOrder(true);
    setPaidOrder(order);
    const orderId = saveOrderToDatabase(order, true);
    const paymentId = db.nextId('PAY', 'payments');
    const receiptId = db.nextId('REC', 'receipts');
    db.insert('payments', {
      id: paymentId,
      order_id: orderId,
      amount_due: total,
      amount_received: received,
      change,
      method: 'Cash',
      paid_at: new Date().toISOString(),
    });
    db.insert('receipts', {
      id: receiptId,
      order_id: orderId,
      payment_id: paymentId,
      receipt_number: receiptId,
      total,
      amount_received: received,
      change,
      printed_at: new Date().toISOString(),
    });
    onOrderCreated(order);
    setShowPayment(false);
    setShowPaymentSuccess(true);
  };

  const printReceipt = () => window.print();

  const itemModifications = (item: CartItem) => {
    const removed = item.originalIngredients
      .filter((ingredient) => !item.ingredients.some((current) => current.name === ingredient.name))
      .map((ingredient) => ingredient.name);
    return removed.length > 0 ? `Removed: ${removed.join(', ')}` : 'No modifications';
  };

  const renderCartGroup = (title: string, items: CartItem[], tone: 'primary' | 'secondary') => (
    <div className="space-y-2">
      <p className={`text-xs font-medium ${tone === 'primary' ? 'text-primary' : 'text-secondary'}`}>
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-3">
          No items.
        </p>
      ) : (
        items.map((item) => {
          const index = cart.indexOf(item);
          return (
            <div key={`${title}-${index}`} className="border border-border rounded-lg p-2">
              <div className="flex items-start gap-2">
                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{peso(item.price)} each</p>
                  <p className="text-xs text-primary font-medium">Subtotal: {peso(item.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(index, item.quantity - 1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(index, item.quantity + 1)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => setCart(cart.filter((_, itemIndex) => itemIndex !== index))} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <button onClick={() => setCustomizeItemIndex(index)} className="text-xs text-primary hover:underline mt-2 flex items-center gap-1">
                <Edit2 className="w-3 h-3" />
                Customize
              </button>
            </div>
          );
        })
      )}
    </div>
  );

  const renderPreviewList = (title: string, items: CartItem[]) => (
    <div className="border border-border rounded-lg p-4">
      <h3 className="text-sm text-primary mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No items.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${title}-${item.id}-${item.name}`} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
              <div className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>{peso(item.price * item.quantity)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Product Modifications: {itemModifications(item)}</p>
              <p className="text-xs text-muted-foreground">Notes/Comments: {item.notes || 'None'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage="create-order" onNavigate={onNavigate} onLogout={() => onNavigate('login')} />

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-5">
          <h2 className="text-lg mb-4">Menu</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Products"
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
          </div>

          {recommendedProducts.length > 0 && (
            <div className="mb-4 bg-white rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-3">Recommendations for {customerName}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {recommendedProducts.map((product) => (
                  <button key={product.id} onClick={() => addToCart(product)} className="bg-white rounded-lg p-3 text-left hover:shadow-md transition-shadow border border-border">
                    <img src={product.image} alt={product.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-2 bg-muted" />
                    <h3 className="text-xs text-center mb-1">{product.name}</h3>
                    <p className="text-xs text-center text-primary">{peso(product.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg p-1 mb-4 inline-flex gap-1">
            {menuCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((product) => (
              <button key={product.id} onClick={() => addToCart(product)} className="bg-white rounded-lg p-2.5 hover:shadow-md transition-shadow text-left border border-transparent hover:border-primary/20">
                <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xs mb-0.5 line-clamp-1">{product.name}</h3>
                <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-8">{productDescription(product.category)}</p>
                <p className="text-xs text-primary">{peso(product.price)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="w-96 bg-white border-l border-border p-5 flex flex-col">
        <div className="mb-4">
          <label className="block text-xs text-muted-foreground mb-1.5">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Enter customer name"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-muted-foreground mb-1.5">Order Type</label>
          <select
            value={diningOption}
            onChange={(event) => {
              const value = event.target.value as DiningOption;
              setDiningOption(value);
              if (value !== 'dine-in') setSelectedTableNumber(null);
            }}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="">Select Dining Option</option>
            <option value="dine-in">Dine-In</option>
            <option value="takeout">Takeout</option>
          </select>

          {diningOption === 'dine-in' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={openTableSelection} className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors text-xs">
                {selectedTableNumber ? `Table #${selectedTableNumber}` : 'Select Available Table'}
              </button>
              <button onClick={() => setShowTakeoutMode(true)} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs">
                Add Takeout Order
              </button>
            </div>
          )}
        </div>

        <h3 className="text-sm mb-3">Order Summary</h3>
        <div className="flex-1 overflow-auto mb-4 space-y-4">
          {cart.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No items in cart</p>
          ) : !hasMixedOrder ? (
            renderCartGroup('Order List', cart, diningOption === 'dine-in' ? 'primary' : 'secondary')
          ) : (
            <>
              {renderCartGroup('Dine-In Order List', dineInItems, 'primary')}
              {renderCartGroup('Takeout Order List', takeoutItems, 'secondary')}
            </>
          )}
        </div>

        <div className="space-y-2 mb-4 text-xs border-t border-border pt-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{peso(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service Fee 1%</span>
            <span>{peso(serviceFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax 12%</span>
            <span>{peso(tax)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Discount</span>
            <button onClick={() => setShowDiscountModal(true)} className="text-primary hover:underline">Edit</button>
          </div>
          <div className="flex justify-between text-destructive">
            <span>{discountLabel}{discountIdNumber ? ` (${discountIdNumber})` : ''}</span>
            <span>- {peso(discount)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border font-medium">
            <span>Total Amount</span>
            <span className="text-primary">{peso(total)}</span>
          </div>
        </div>

        <button
          onClick={handlePreviewOrder}
          disabled={!customerName.trim() || !diningOption || (diningOption === 'dine-in' && !selectedTableNumber && !proceedWhileWaiting) || cart.length === 0}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm mb-2 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          Preview Order
        </button>

        {validationMessages.length > 0 && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 space-y-1">
            {validationMessages.map((message) => (
              <p key={message} className="text-xs text-destructive">{message}</p>
            ))}
          </div>
        )}
      </aside>

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl my-8 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg text-primary">Order Preview</h2>
              <button onClick={() => setShowPreview(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Customer Name</p><p>{customerName}</p></div>
                <div><p className="text-xs text-muted-foreground">Order Number</p><p>{createdOrderNumber || db.nextId('ORD', 'orders')}</p></div>
                <div><p className="text-xs text-muted-foreground">Dining Type</p><p>{diningOption === 'dine-in' ? 'Dine-In' : 'Takeout'}</p></div>
                <div><p className="text-xs text-muted-foreground">Table Number</p><p>{selectedTableNumber || 'N/A'}</p></div>
              </div>
              {!hasMixedOrder ? (
                renderPreviewList('Order List', cart)
              ) : (
                <>
                  {renderPreviewList('Dine-In Order List', dineInItems)}
                  {renderPreviewList('Takeout Order List', takeoutItems)}
                </>
              )}
              <div className="border border-border rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{peso(subtotal)}</span></div>
                <div className="flex justify-between"><span>Service Fee 1%</span><span>{peso(serviceFee)}</span></div>
                <div className="flex justify-between"><span>Tax 12%</span><span>{peso(tax)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>{discountLabel}: -{peso(discount)}</span></div>
                <div className="flex justify-between text-lg text-primary font-medium border-t border-border pt-2"><span>Total Amount</span><span>{peso(total)}</span></div>
              </div>
            </div>
            <div className="p-5 border-t border-border flex gap-3">
              <button onClick={() => setShowPreview(false)} className="flex-1 px-6 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm">Back to Edit</button>
              <button onClick={handleConfirmOrder} className="flex-1 px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors text-sm">Confirm Order</button>
            </div>
          </div>
        </div>
      )}

      {showPayment && paidOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg text-primary">Payment Summary</h2>
              <button onClick={() => setShowPayment(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm"><strong>Customer Name:</strong> {paidOrder.customerName}</p>
              <div className="border border-border rounded-lg p-3 text-sm space-y-2">
                {cart.map((item) => (
                  <div key={`pay-${item.id}-${item.name}`} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{peso(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{peso(subtotal)}</span></div>
                <div className="flex justify-between"><span>Service Fee 1%</span><span>{peso(serviceFee)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>- {peso(discount)}</span></div>
                <div className="flex justify-between"><span>Tax 12%</span><span>{peso(tax)}</span></div>
                <div className="flex justify-between text-lg text-primary font-medium"><span>Total Amount Due</span><span>{peso(total)}</span></div>
              </div>
              <div>
                <label className="block text-sm mb-2">Amount Received</label>
                <input value={amountReceived} onChange={(event) => setAmountReceived(event.target.value)} type="number" className="w-full px-4 py-3 border border-border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="bg-secondary/10 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Change</p>
                <p className="text-2xl text-secondary">{peso(change)}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPayment(false)} className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted">Cancel</button>
                <button onClick={handleConfirmPayment} disabled={received < total} className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">Confirm Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentSuccess && paidOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl">✓</div>
            <h2 className="text-xl text-primary mb-4">Payment Successful</h2>
            <div className="bg-muted rounded-lg p-4 text-left text-sm space-y-2 mb-4">
              <div className="flex justify-between"><span>Total Amount</span><strong>{peso(total)}</strong></div>
              <div className="flex justify-between"><span>Amount Received</span><strong>{peso(received)}</strong></div>
              <div className="flex justify-between text-secondary"><span>Change</span><strong>{peso(change)}</strong></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReceiptPreview(true)} className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Print Receipt</button>
              <button onClick={() => {
                setShowPaymentSuccess(false);
                setCart([]);
                setCustomerName('');
                setDiningOption('');
                setSelectedTableNumber(null);
                setAmountReceived('');
              }} className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted">Close</button>
            </div>
          </div>
        </div>
      )}

      {showReceiptPreview && paidOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between p-4 border-b border-border">
              <h2 className="text-primary">Receipt Preview</h2>
              <button onClick={() => setShowReceiptPreview(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 bg-gray-100">
              <div className="thermal-receipt mx-auto bg-white p-5 font-mono text-black shadow-lg text-xs">
                <div className="text-center mb-3">
                  <strong>FINE DINE RESTAURANT</strong>
                  <p>123 Main Street, Cebu City</p>
                </div>
                <div className="border-t border-dashed py-2 space-y-1">
                  <div className="flex justify-between"><span>Receipt ID</span><span>{String(db.all('receipts').find((receipt) => receipt.order_id === createdOrderNumber)?.id ?? '')}</span></div>
                  <div className="flex justify-between"><span>Order ID</span><span>{createdOrderNumber}</span></div>
                  <div className="flex justify-between"><span>Date</span><span>{new Date().toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Customer</span><span>{paidOrder.customerName}</span></div>
                </div>
                <div className="border-t border-dashed py-2">
                  {dineInItems.length > 0 && takeoutItems.length > 0 ? (
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-medium">Dine-In</div>
                        {dineInItems.map((item) => (
                          <div key={`dine-${item.id}-${item.name}`} className="flex justify-between text-xs">
                            <span>{item.quantity}x {item.name}</span>
                            <span>{peso(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-sm font-medium">Takeout</div>
                        {takeoutItems.map((item) => (
                          <div key={`take-${item.id}-${item.name}`} className="flex justify-between text-xs">
                            <span>{item.quantity}x {item.name}</span>
                            <span>{peso(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={`${item.id}-${item.name}`} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{peso(item.price * item.quantity)}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-dashed py-2 space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span>{peso(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Service Fee 1%</span><span>{peso(serviceFee)}</span></div>
                  <div className="flex justify-between"><span>Tax 12%</span><span>{peso(tax)}</span></div>
                  <div className="flex justify-between"><span>Discount</span><span>- {peso(discount)}</span></div>
                  <div className="flex justify-between font-bold"><span>TOTAL</span><span>{peso(total)}</span></div>
                  <div className="flex justify-between"><span>Received</span><span>{peso(received)}</span></div>
                  <div className="flex justify-between"><span>Change</span><span>{peso(change)}</span></div>
                </div>
                <p className="text-center border-t border-dashed pt-2">THANK YOU. PLEASE COME AGAIN.</p>
              </div>
            </div>
            <div className="p-4 flex gap-3">
              <button onClick={printReceipt} className="flex-1 bg-primary text-primary-foreground rounded-lg py-3">Print Receipt</button>
              <button onClick={printReceipt} className="flex-1 border border-border rounded-lg py-3">Download Receipt</button>
              <button onClick={() => {
                // when closing the receipt after payment, remove the order so it no longer shows in order list
                if (createdOrderNumber) {
                  deleteOrderAndRelated(createdOrderNumber);
                }
                setShowReceiptPreview(false);
                onNavigate('order-list');
              }} className="flex-1 border border-border rounded-lg py-3">Close</button>
            </div>
          </div>
        </div>
      )}

      {showNoTablesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg text-primary mb-2">No tables available at the moment.</h2>
            <p className="text-sm text-muted-foreground mb-5">
              All tables are occupied, reserved, or under maintenance.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={addCustomerToWaitingQueue} className="px-4 py-3 bg-primary text-primary-foreground rounded-lg">
                Wait for Available Table
              </button>
              <button onClick={switchOrderToTakeout} className="px-4 py-3 bg-secondary text-secondary-foreground rounded-lg">
                Switch to Takeout
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderSuccess && paidOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 grid place-items-center text-white text-3xl">✓</div>
            <h2 className="text-xl text-primary mb-4">Order Successfully Created</h2>
            <div className="bg-muted rounded-lg p-4 text-left text-sm space-y-2 mb-4">
              <div className="flex justify-between"><span>Order Number</span><strong>{createdOrderNumber}</strong></div>
              <div className="flex justify-between"><span>Customer</span><strong>{paidOrder.customerName}</strong></div>
              {paidOrder.tableNumber && <div className="flex justify-between"><span>Table Number</span><strong>{paidOrder.tableNumber}</strong></div>}
              <div className="flex justify-between"><span>Order Type</span><strong>{hasMixedOrder ? 'Dine-In + Takeout' : (paidOrder.orderType === 'dine-in' ? 'Dine-In' : 'Takeout')}</strong></div>
              <div className="flex justify-between"><span>Total Amount</span><strong>{peso(total)}</strong></div>
              <div className="flex justify-between"><span>Payment Status</span><strong>Pending</strong></div>
              <div className="flex justify-between"><span>Order Status</span><strong>Serving</strong></div>
            </div>
            <button
              onClick={() => {
                setShowOrderSuccess(false);
                resetOrderForm();
                onNavigate('order-list');
              }}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Back to Orders
            </button>
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg text-primary">Apply Discount</h2>
              <button onClick={() => setShowDiscountModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['senior', 'Senior Citizen Discount — 20%'],
                  ['pwd', 'PWD Discount — 20%'],
                  ['promo', 'Promo Discount'],
                  ['custom', 'Custom Discount'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setDiscountType(value as DiscountType)}
                    className={`border border-border rounded-lg p-3 text-sm text-left ${discountType === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {(discountType === 'senior' || discountType === 'pwd') && (
                <div>
                  <label className="block text-sm mb-2">Customer Discount ID Number</label>
                  <input value={discountIdNumber} onChange={(event) => setDiscountIdNumber(event.target.value)} className="w-full px-3 py-2 border border-border rounded-lg" placeholder="Required for Senior/PWD" />
                </div>
              )}
              {discountType === 'custom' && (
                <div>
                  <label className="block text-sm mb-2">Custom Discount Percentage</label>
                  <input value={customDiscountPercent} onChange={(event) => setCustomDiscountPercent(event.target.value)} type="number" className="w-full px-3 py-2 border border-border rounded-lg" placeholder="e.g. 5" />
                </div>
              )}
              <div className="bg-blue-50 border border-primary/20 rounded-lg p-3 text-xs text-primary">
                Discount validation saves to the discounts table with type, ID reference, percentage, and amount.
              </div>
              <button
                onClick={() => setShowDiscountModal(false)}
                disabled={(discountType === 'senior' || discountType === 'pwd') && !discountIdNumber.trim()}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Validate & Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {customizeItemIndex !== null && cart[customizeItemIndex] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg my-8 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg text-primary">Customize - {cart[customizeItemIndex].name}</h2>
              <button onClick={() => setCustomizeItemIndex(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-2">Remove Ingredients</label>
                <div className="space-y-2">
                  {cart[customizeItemIndex].ingredients.map((ingredient) => (
                    <div key={ingredient.name} className="flex items-center justify-between p-2 border border-border rounded-lg">
                      <div>
                        <span className="text-xs">{ingredient.name}</span>
                        <p className="text-[11px] text-muted-foreground">Default: {cart[customizeItemIndex].originalIngredients.find((item) => item.name === ingredient.name)?.quantity} {ingredient.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={ingredient.quantity}
                          onChange={(event) => updateIngredientQuantity(customizeItemIndex, ingredient.name, Number(event.target.value))}
                          className="w-20 px-2 py-1 border border-border rounded text-xs"
                        />
                        <span className="text-xs text-muted-foreground w-8">{ingredient.unit}</span>
                      </div>
                      <button onClick={() => deleteIngredient(customizeItemIndex, ingredient.name)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Notes/Comments</label>
                <textarea value={cart[customizeItemIndex].notes} onChange={(event) => updateNotes(customizeItemIndex, event.target.value)} placeholder="e.g., well done, no onions, extra sauce" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={3} />
              </div>
              <div className="bg-blue-50 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-primary">Ingredients will be checked and deducted from inventory.</p>
              </div>
            </div>
            <div className="p-5 border-t border-border">
              <button onClick={() => setCustomizeItemIndex(null)} className="w-full px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm">Done</button>
            </div>
          </div>
        </div>
      )}

      {showTakeoutMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl my-8 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg text-secondary">Add Takeout Order</h2>
              <button onClick={() => setShowTakeoutMode(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search takeout products"
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                />
              </div>

              <div className="bg-white rounded-lg p-1 mb-4 inline-flex gap-1">
                {menuCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredProducts.map((product) => (
                  <button key={product.id} onClick={() => addToCart(product, 'takeout')} className="bg-white rounded-lg p-2.5 hover:shadow-md transition-shadow text-left border border-border">
                    <img src={product.image} alt={product.name} className="aspect-square w-full rounded-lg object-cover mb-2 bg-muted" />
                    <h3 className="text-xs mb-0.5 line-clamp-1">{product.name}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-8">{productDescription(product.category)}</p>
                    <p className="text-xs text-secondary">{peso(product.price)}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-border">
              <button onClick={() => setShowTakeoutMode(false)} className="w-full px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 text-sm">Done Adding Takeout Items</button>
            </div>
          </div>
        </div>
      )}

      {showTableSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg text-primary">Select Available Table</h2>
              <button onClick={() => setShowTableSelection(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-3 mb-6">
                {db.all('tables').map((table) => (
                  <button
                    key={table.id}
                    onClick={() => table.status === 'available' && setSelectedTableNumber(Number(table.number))}
                    disabled={table.status !== 'available'}
                    className={`aspect-square text-white rounded-lg text-xl ${
                      table.status === 'available'
                        ? 'bg-green-500 hover:opacity-80'
                        : table.status === 'occupied'
                          ? 'bg-red-500 cursor-not-allowed opacity-70'
                          : table.status === 'reserved'
                            ? 'bg-yellow-500 cursor-not-allowed opacity-70'
                            : 'bg-gray-400 cursor-not-allowed opacity-70'
                    } ${selectedTableNumber === table.number ? 'ring-4 ring-secondary' : ''}`}
                  >
                    {String(table.number)}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowTableSelection(false)} disabled={!selectedTableNumber} className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg hover:bg-secondary/90 disabled:opacity-50">
                Assign Table {selectedTableNumber ? `#${selectedTableNumber}` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
