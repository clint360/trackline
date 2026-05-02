-- Notifications table + triggers for the dashboard bell.
-- Run in Supabase SQL Editor or via `supabase db push`.

-- ============================================================
--  Notifications table
-- ============================================================

create table if not exists public.notifications (
  id          bigserial primary key,
  kind        text not null,        -- 'booking.created' | 'booking.cancelled'
  title       text not null,
  body        text not null,
  ref_id      text,                 -- booking.consignment or payments.trans_id
  amount      integer,              -- FCFA amount (from booking)
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_created_idx on public.notifications(created_at desc);
create index if not exists notifications_read_idx    on public.notifications(read);
create index if not exists notifications_ref_idx     on public.notifications(ref_id);

-- ============================================================
--  RLS
-- ============================================================

alter table public.notifications enable row level security;

-- No anon access; service role manages reads / writes.

-- ============================================================
--  Trigger: auto-create notifications on booking events
-- ============================================================

create or replace function public.handle_booking_notification()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.status = 'valid' then
    insert into public.notifications (kind, title, body, ref_id, amount)
    values (
      'booking.created',
      'New booking · ' || NEW.consignment,
      NEW.passenger_name || ' booked seat ' || NEW.seat || ' via ' ||
        case when NEW.payment_method = 'MTN' then 'MTN MoMo' else 'Orange Money' end,
      NEW.consignment,
      NEW.amount
    );
    return NEW;

  elsif TG_OP = 'UPDATE' and OLD.status <> 'cancelled' and NEW.status = 'cancelled' then
    insert into public.notifications (kind, title, body, ref_id)
    values (
      'booking.cancelled',
      'Booking cancelled · ' || NEW.consignment,
      NEW.passenger_name || ' cancelled seat ' || NEW.seat,
      NEW.consignment
    );
    return NEW;
  end if;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

drop trigger if exists booking_notification_trigger on public.bookings;
create trigger booking_notification_trigger
  after insert or update on public.bookings
  for each row
  execute function public.handle_booking_notification();
