-- 020 — Create ticket_messages table for real-time support tickets
-- The existing tickets table stores messages as JSONB, but for real-time
-- subscriptions and better querying we need a separate normalized table.

create table if not exists ticket_messages (
  id            uuid primary key default gen_random_uuid(),
  ticket_id     uuid not null references tickets(id) on delete cascade,
  sender        text not null check (sender in ('customer','support')),
  author        text,
  text          text not null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_ticket_messages_ticket
  on ticket_messages(ticket_id, created_at);

-- Enable realtime for the new table
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'ticket_messages'
  ) then
    execute 'alter publication supabase_realtime add table ticket_messages';
  end if;
end $$;

-- RLS: customers can read messages for their own tickets
-- staff can read all messages
create policy "customer_own_ticket_messages" on ticket_messages
  for select using (
    exists (
      select 1 from tickets
      where tickets.id = ticket_messages.ticket_id
      and tickets.customer_id = auth.uid()
    )
  );

create policy "staff_all_ticket_messages" on ticket_messages
  for select using (
    exists (
      select 1 from staff_accounts
      where staff_accounts.auth_uid = auth.uid()
      and staff_accounts.active = true
    )
  );

-- Only staff can insert messages as support
create policy "staff_insert_ticket_messages" on ticket_messages
  for insert with check (
    sender = 'support'
    and exists (
      select 1 from staff_accounts
      where staff_accounts.auth_uid = auth.uid()
      and staff_accounts.active = true
    )
  );

-- Customers can insert their own messages
create policy "customer_insert_own_ticket_messages" on ticket_messages
  for insert with check (
    sender = 'customer'
    and exists (
      select 1 from tickets
      where tickets.id = ticket_messages.ticket_id
      and tickets.customer_id = auth.uid()
    )
  );

-- Trigger for updated_at
create trigger trg_ticket_messages_updated
  before update on ticket_messages for each row execute function _set_updated_at();