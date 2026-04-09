-- Agregar estado 'used' al constraint orders_status_check
-- Este cambio permite que el RPC redeem_qr_token pueda marcar órdenes como usadas
-- cuando se canjea un QR token

alter table public.orders
drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check
check (
  status = any (
    array[
      'draft',
      'placed',
      'awaiting_verification',
      'approved',
      'rejected',
      'cancelled',
      'used'
    ]
  )
);
