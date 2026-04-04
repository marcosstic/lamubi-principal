import { supabase } from './client.js';
const ORDERS_TABLE = 'orders';
const ORDER_ITEMS_TABLE = 'order_items';
const PRODUCTS_TABLE = 'products';
export async function listBuyerOrders(buyer_id){return supabase.from('orders').select('id,status,subtotal_usd,total_usd,placed_at,created_at').eq('buyer_id',buyer_id).order('created_at',{ascending:false});}

export async function getProductsBySku(skus){const safe=(skus||[]).map((s)=>String(s||'').trim()).filter(Boolean);if(!safe.length)return{data:[],error:null};return supabase.from(PRODUCTS_TABLE).select('id,sku,name,price_usd,active').in('sku',safe);}

export async function createOrderWithItems(input){
  const buyer_id=input?.buyer_id;const items=(input?.items||[]).map((x)=>({sku:String(x?.sku||'').trim(),qty:Number(x?.qty||0)})).filter((x)=>x.sku&&x.qty>0);
  if(!buyer_id||!items.length)return{data:null,error:{message:'buyer_id e items requeridos'}};
  const { data: products, error: prodErr } = await getProductsBySku(items.map((x)=>x.sku));
  if(prodErr)return{data:null,error:prodErr};
  const map=new Map((products||[]).map((p)=>[p.sku,p]));
  const enriched=items.map((it)=>({it,prod:map.get(it.sku)})).filter((x)=>x.prod&&x.prod.active);
  if(!enriched.length)return{data:null,error:{message:'No hay productos válidos'}};
  const subtotal_usd=enriched.reduce((s,x)=>s+Number(x.prod.price_usd||0)*x.it.qty,0);
  const placed_at=new Date().toISOString();
  const { data: order, error: orderErr } = await supabase.from(ORDERS_TABLE).insert({ buyer_id, status:'awaiting_verification', subtotal_usd, total_usd:subtotal_usd, placed_at }).select('id,status,subtotal_usd,total_usd,placed_at,created_at').single();
  if(orderErr)return{data:null,error:orderErr};
  const rows=enriched.map((x)=>({ order_id:order.id, product_id:x.prod.id, qty:x.it.qty, unit_price_usd:x.prod.price_usd }));
  const { error: itemsErr } = await supabase.from(ORDER_ITEMS_TABLE).insert(rows);
  if(itemsErr)return{data:null,error:itemsErr};
  return{data:order,error:null};
}

export async function getBuyerOrderWithItems(buyer_id, order_id){
  if(!buyer_id||!order_id)return{data:null,error:{message:'buyer_id y order_id requeridos'}};
  return supabase.from(ORDERS_TABLE).select('id,buyer_id,status,subtotal_usd,total_usd,placed_at,created_at,order_items:order_items(id,qty,unit_price_usd,product:products(id,sku,name))').eq('id',order_id).eq('buyer_id',buyer_id).maybeSingle();
}

export async function updateOrderStatus(orderId, status, opts = {}) {
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === 'approved') {
    patch.status = 'approved';
  }
  if (status === 'rejected') {
    patch.rejected_reason = opts.reason || null;
  }
  return supabase
    .from(ORDERS_TABLE)
    .update(patch)
    .eq('id', orderId)
    .select('id, status, updated_at')
    .single();
}

export async function listAllOrders(filters = {}) {
  let query = supabase
    .from(ORDERS_TABLE)
    .select('id, buyer_id, status, subtotal_usd, total_usd, placed_at, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  return query;
}

export async function getOrderWithDetails(orderId) {
  return supabase
    .from(ORDERS_TABLE)
    .select(`
      id, buyer_id, status, subtotal_usd, total_usd, placed_at, created_at, updated_at,
      buyer:profiles(id, full_name, phone),
      order_items:order_items(id, qty, unit_price_usd, product:products(id, sku, name))
    `)
    .eq('id', orderId)
    .maybeSingle();
}
