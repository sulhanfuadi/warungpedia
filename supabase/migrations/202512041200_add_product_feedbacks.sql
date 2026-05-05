create extension if not exists pgcrypto;

create table if not exists public.product_feedbacks (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    customer_name text not null check (char_length(customer_name) between 3 and 120),
    phone text not null check (phone ~ '^[0-9+]{9,16}$'),
    email text not null check (position('@' in email) > 1),
    province text not null,
    comment text not null check (char_length(comment) between 10 and 1000),
    rating smallint not null check (rating between 1 and 5),
    created_at timestamptz not null default now()
);

create index if not exists product_feedbacks_product_id_idx on public.product_feedbacks (product_id);
create index if not exists product_feedbacks_rating_idx on public.product_feedbacks (rating);
create index if not exists product_feedbacks_province_idx on public.product_feedbacks (province);

create or replace function public.seller_rating_distribution(seller_uuid uuid)
returns table(rating smallint, total bigint)
language sql
security definer
set search_path = public
as $$
    select pf.rating, count(*) as total
    from product_feedbacks pf
    join products p on p.id = pf.product_id
    where p.seller_id = seller_uuid
    group by pf.rating
    order by pf.rating;
$$;

create or replace function public.seller_feedback_province_distribution(seller_uuid uuid)
returns table(province text, total bigint)
language sql
security definer
set search_path = public
as $$
    select pf.province, count(*) as total
    from product_feedbacks pf
    join products p on p.id = pf.product_id
    where p.seller_id = seller_uuid
    group by pf.province
    order by total desc;
$$;
