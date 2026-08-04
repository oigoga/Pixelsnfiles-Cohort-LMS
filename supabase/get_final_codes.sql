select full_name, email, code
from access_codes
where lower(email) in (
  'prevailamah09@gmail.com',
  'calebayeni16@gmail.com',
  'eriesirifav@gmail.com',
  'iokonye24@gmail.com'
)
order by full_name;
