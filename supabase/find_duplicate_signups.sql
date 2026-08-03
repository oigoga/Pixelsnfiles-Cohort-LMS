-- Find every email that has more than one access code / account.
-- Read-only — safe to run any time in the Supabase SQL Editor.

select
  lower(ac.email)                              as email,
  count(*)                                      as accounts,
  array_agg(ac.code   order by ac.created_at)   as codes,
  array_agg(ac.full_name order by ac.created_at) as names,
  array_agg(ac.created_at order by ac.created_at) as registered_at
from access_codes ac
group by lower(ac.email)
having count(*) > 1
order by count(*) desc;
