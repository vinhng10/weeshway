bunx supabase stop

docker run --rm \
  -v supabase_db_weeshway:/volume \
  -v ./supabase/backups:/backup \
  alpine \
  tar czf /backup/supabase_db_weeshway.tar.gz -C /volume .

docker run --rm \
  -v supabase_edge_runtime_weeshway:/volume \
  -v ./supabase/backups:/backup \
  alpine \
  tar czf /backup/supabase_edge_runtime_weeshway.tar.gz -C /volume .

docker run --rm \
  -v supabase_storage_weeshway:/volume \
  -v ./supabase/backups:/backup \
  alpine \
  tar czf /backup/supabase_storage_weeshway.tar.gz -C /volume .

docker run --rm \
  -v supabase_db_weeshway:/volume \
  -v ./supabase/backups:/backup \
  alpine \
  sh -c "rm -rf /volume/* && tar xzf /backup/supabase_db_weeshway.tar.gz -C /volume"

docker run --rm \
  -v supabase_edge_runtime_weeshway:/volume \
  -v ./supabase/backups:/backup \
  alpine \
  sh -c "rm -rf /volume/* && tar xzf /backup/supabase_edge_runtime_weeshway.tar.gz -C /volume"

docker run --rm \
  -v supabase_storage_weeshway:/volume \
  -v ./supabase/backups:/backup \
  alpine \
  sh -c "rm -rf /volume/* && tar xzf /backup/supabase_storage_weeshway.tar.gz -C /volume"

bunx supabase start