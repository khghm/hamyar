-- بررسی سفارش جدید
select 'orders' as tbl, count(*) from orders where id = 'ef342fba-9ffe-4119-83c9-71adfe0bbafc'
union all
select 'order_items', count(*) from order_items where order_id = 'ef342fba-9ffe-4119-83c9-71adfe0bbafc'
union all
select 'invoices', count(*) from invoices where order_id = 'ef342fba-9ffe-4119-83c9-71adfe0bbafc'
union all
select 'invoice_items', count(*) from invoice_items where invoice_id = '9c1743d2-4d70-477b-bf71-a29521a721ca'
union all
select 'notifications_customer', count(*) from notifications where user_id = '2ea9ed9a-3772-4109-975b-97444ffe29b7' and dedupe_key = 'order-customer-ef342fba-9ffe-4119-83c9-71adfe0bbafc'
union all
select 'notifications_staff', count(*) from notifications where dedupe_key like 'order-staff-%-ef342fba-9ffe-4119-83c9-71adfe0bbafc';
