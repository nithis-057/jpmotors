import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true }
});


export async function fetchProducts() {
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching products:", error.message);
        return [];
    }
}

export async function fetchUsers() {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching users:", error.message);
    return [];
  }
}

export async function insertUser(newUser) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select();

    if (error) throw error;
    
  
    return data[0]; 
  } catch (error) {
    console.error("Error creating user:", error.message);
    return null;
  }
}

export async function fetchAllOrders() {
    try {
        // Fetch orders AND join order_items + products to get names/quantities
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users ( name ),
                order_items (
                    quantity,
                    price_at_order,
                    products ( name )
                )
            `)
            .order('date', { ascending: false });
            
        if (error) throw error;
        
        // Transform Supabase nested data into the flat structure App.jsx expects
        return data.map(order => ({
            id: order.id,
            userId: order.user_id,
            date: order.date,
            status: order.status,
            total: order.total,
            customerName: order.users?.name || 'Unknown',
            items: order.order_items.map(oi => ({
                name: oi.products?.name || 'Unknown Part',
                qty: oi.quantity,
                price: oi.price_at_order
            }))
        }));
    } catch (error) {
        console.error("Error fetching orders:", error.message);
        return [];
    }
}

export async function insertNewOrder(orderData, orderItems) {
    try {
        // 1. Insert the Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: orderData.userId,
                total: orderData.total,
                status: 'Pending',
                date: new Date().toISOString().split('T')[0]
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Prepare Order Items
        const itemsToInsert = orderItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_order: item.price_at_order
        }));

        // 3. Insert Items
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        return true;
    } catch (error) {
        console.error("Error placing order:", error.message);
        return false;
    }
}

export async function updateOrderStatus(orderId, newStatus) {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Error updating status:", error.message);
        return false;
    }
}

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('users') 
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    return false;
  }
  return true;
};