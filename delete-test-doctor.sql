-- Hard-deletes the test doctor youssef.bennejah@gmail.com ("Dr. Test Mail") and his empty test cabinet
-- ("Cabinet Test Mail"). Local dev DB only. Irreversible.
begin;

do $$
declare
  r record;
  uid text := '348a237f-4f98-46c2-9aa9-6534351c08eb';
  cid text := '68ab9c7a-b9a5-464b-b2c5-c26e05966aff';
begin
  -- every table that references users/cabinets, except users/cabinets themselves
  for r in
    select distinct kcu.table_name t, kcu.column_name c, ccu.table_name ref
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu using (constraint_name, table_schema)
    join information_schema.constraint_column_usage ccu using (constraint_name, table_schema)
    where tc.constraint_type = 'FOREIGN KEY'
      and ccu.table_name in ('users', 'cabinets')
      and kcu.table_name not in ('users', 'cabinets')
  loop
    execute format('delete from %I where %I = $1', r.t, r.c)
      using (case when r.ref = 'users' then uid else cid end);
  end loop;

  if to_regclass('refresh_tokens') is not null then
    execute 'delete from refresh_tokens where user_id = $1' using uid;
  end if;

  delete from users where id = uid;
  delete from cabinets where id = cid;
end $$;

select (select count(*) from users where lower(email) = 'youssef.bennejah@gmail.com') as user_left,
       (select count(*) from cabinets where id = '68ab9c7a-b9a5-464b-b2c5-c26e05966aff') as cabinet_left;

commit;
