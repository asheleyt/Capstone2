import { ref, computed } from 'vue';

// Shared order state
const allOrders = ref([
  // Sample completed orders
  {
    id: 1,
    number: '001',
    time: '14:30',
    date: '2024-01-15',
    table: 'Table 1',
    status: 'Completed',
    total: 450,
    items: [
      { id: 1, name: 'Grilled Chicken', quantity: 2, price: 150 },
      { id: 2, name: 'French Fries', quantity: 1, price: 80 },
      { id: 3, name: 'Soft Drink', quantity: 2, price: 35 }
    ],
    completedAt: '2024-01-15T14:45:00'
  },
  {
    id: 2,
    number: '002',
    time: '14:25',
    date: '2024-01-15',
    table: 'Table 3',
    status: 'Completed',
    total: 320,
    items: [
      { id: 4, name: 'Beef Steak', quantity: 1, price: 200 },
      { id: 5, name: 'Rice', quantity: 1, price: 30 },
      { id: 6, name: 'Iced Tea', quantity: 1, price: 45 },
      { id: 7, name: 'Soup', quantity: 1, price: 45 }
    ],
    completedAt: '2024-01-15T14:40:00'
  },
  {
    id: 3,
    number: '003',
    time: '14:20',
    date: '2024-01-15',
    table: 'Table 5',
    status: 'Completed',
    total: 280,
    items: [
      { id: 8, name: 'Fish Fillet', quantity: 1, price: 180 },
      { id: 9, name: 'Vegetables', quantity: 1, price: 60 },
      { id: 10, name: 'Water', quantity: 1, price: 20 },
      { id: 11, name: 'Dessert', quantity: 1, price: 20 }
    ],
    completedAt: '2024-01-15T14:35:00'
  }
]);

// Current active orders (for POS)
const currentOrders = ref([
  {
    id: 4,
    number: '004',
    time: '15:30',
    date: '2024-01-15',
    table: 'Table 1',
    status: 'Pending',
    total: 450,
    items: [
      { id: 12, name: 'Grilled Chicken', quantity: 2, price: 150 },
      { id: 13, name: 'French Fries', quantity: 1, price: 80 },
      { id: 14, name: 'Soft Drink', quantity: 2, price: 35 }
    ],
    createdAt: '2024-01-15T15:30:00'
  },
  {
    id: 5,
    number: '005',
    time: '15:25',
    date: '2024-01-15',
    table: 'Table 3',
    status: 'Preparing',
    total: 320,
    items: [
      { id: 15, name: 'Beef Steak', quantity: 1, price: 200 },
      { id: 16, name: 'Rice', quantity: 1, price: 30 },
      { id: 17, name: 'Iced Tea', quantity: 1, price: 45 },
      { id: 18, name: 'Soup', quantity: 1, price: 45 }
    ],
    createdAt: '2024-01-15T15:25:00'
  },
  {
    id: 6,
    number: '006',
    time: '15:20',
    date: '2024-01-15',
    table: 'Table 5',
    status: 'Ready',
    total: 280,
    items: [
      { id: 19, name: 'Fish Fillet', quantity: 1, price: 180 },
      { id: 20, name: 'Vegetables', quantity: 1, price: 60 },
      { id: 21, name: 'Water', quantity: 1, price: 20 },
      { id: 22, name: 'Dessert', quantity: 1, price: 20 }
    ],
    createdAt: '2024-01-15T15:20:00'
  },
  {
    id: 7,
    number: '007',
    time: '15:15',
    date: '2024-01-15',
    table: 'Table 2',
    status: 'Pending',
    total: 195,
    items: [
      { id: 23, name: 'Pasta Carbonara', quantity: 1, price: 120 },
      { id: 24, name: 'Garlic Bread', quantity: 1, price: 35 },
      { id: 25, name: 'Lemonade', quantity: 1, price: 40 }
    ],
    createdAt: '2024-01-15T15:15:00'
  }
]);

let nextOrderId = 8;
let nextOrderNumber = 8;

export function useOrders() {
  // Computed properties
  const completedOrders = computed(() => allOrders.value);
  
  const pendingOrders = computed(() => 
    currentOrders.value.filter(order => order.status === 'Pending')
  );
  
  const preparingOrders = computed(() => 
    currentOrders.value.filter(order => order.status === 'Preparing')
  );
  
  const readyOrders = computed(() => 
    currentOrders.value.filter(order => order.status === 'Ready')
  );

  const totalRevenue = computed(() => {
    return allOrders.value.reduce((sum, order) => sum + order.total, 0);
  });

  const todayRevenue = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return allOrders.value
      .filter(order => order.date === today)
      .reduce((sum, order) => sum + order.total, 0);
  });

  // Functions
  function addNewOrder(orderData) {
    const newOrder = {
      id: nextOrderId++,
      number: String(nextOrderNumber++).padStart(3, '0'),
      time: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      date: new Date().toISOString().split('T')[0],
      table: orderData.table || 'Table 1',
      status: 'Pending',
      total: orderData.total,
      items: orderData.items,
      createdAt: new Date().toISOString()
    };
    
    currentOrders.value.unshift(newOrder);
    return newOrder;
  }

  function updateOrderStatus(orderId, newStatus) {
    const order = currentOrders.value.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      
      // If completed, move to allOrders and remove from currentOrders
      if (newStatus === 'Completed') {
        order.completedAt = new Date().toISOString();
        allOrders.value.unshift({ ...order });
        
        // Remove from current orders after a delay
        setTimeout(() => {
          currentOrders.value = currentOrders.value.filter(o => o.id !== orderId);
        }, 2000);
      }
    }
  }

  function getOrdersByDate(date) {
    return allOrders.value.filter(order => order.date === date);
  }

  function getOrdersByStatus(status) {
    return allOrders.value.filter(order => order.status === status);
  }

  function getOrderById(orderId) {
    return allOrders.value.find(order => order.id === orderId) || 
           currentOrders.value.find(order => order.id === orderId);
  }

  function deleteOrder(orderId) {
    allOrders.value = allOrders.value.filter(order => order.id !== orderId);
    currentOrders.value = currentOrders.value.filter(order => order.id !== orderId);
  }

  // Simulate new orders coming in (for demo purposes)
  function simulateNewOrder() {
    const sampleOrders = [
      {
        table: 'Table 4',
        total: 380,
        items: [
          { id: 26, name: 'Pork Chop', quantity: 1, price: 180 },
          { id: 27, name: 'Mashed Potatoes', quantity: 1, price: 60 },
          { id: 28, name: 'Gravy', quantity: 1, price: 20 },
          { id: 29, name: 'Coffee', quantity: 1, price: 30 },
          { id: 30, name: 'Cheesecake', quantity: 1, price: 90 }
        ]
      },
      {
        table: 'Table 6',
        total: 250,
        items: [
          { id: 31, name: 'Chicken Salad', quantity: 1, price: 120 },
          { id: 32, name: 'Bread Roll', quantity: 2, price: 15 },
          { id: 33, name: 'Orange Juice', quantity: 1, price: 40 },
          { id: 34, name: 'Ice Cream', quantity: 1, price: 60 }
        ]
      }
    ];

    const randomOrder = sampleOrders[Math.floor(Math.random() * sampleOrders.length)];
    addNewOrder(randomOrder);
  }

  return {
    // State
    allOrders,
    currentOrders,
    
    // Computed
    completedOrders,
    pendingOrders,
    preparingOrders,
    readyOrders,
    totalRevenue,
    todayRevenue,
    
    // Functions
    addNewOrder,
    updateOrderStatus,
    getOrdersByDate,
    getOrdersByStatus,
    getOrderById,
    deleteOrder,
    simulateNewOrder
  };
} 