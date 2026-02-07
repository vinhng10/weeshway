bunx supabase stop

docker run --rm \
  -v supabase_db_danceai:/volume \
  -v supabase/backups:/backup \
  alpine \
  tar czf /backup/supabase_db_danceai.tar.gz -C /volume .

docker run --rm \
  -v supabase_edge_runtime_danceai:/volume \
  -v supabase/backups:/backup \
  alpine \
  tar czf /backup/supabase_edge_runtime_danceai.tar.gz -C /volume .

docker run --rm \
  -v supabase_storage_danceai:/volume \
  -v supabase/backups:/backup \
  alpine \
  tar czf /backup/supabase_storage_danceai.tar.gz -C /volume .

docker run --rm \
  -v supabase_db_danceai:/volume \
  -v supabase/backups:/backup \
  alpine \
  sh -c "rm -rf /volume/* && tar xzf /backup/supabase_db_danceai.tar.gz -C /volume"

docker run --rm \
  -v supabase_edge_runtime_danceai:/volume \
  -v supabase/backups:/backup \
  alpine \
  sh -c "rm -rf /volume/* && tar xzf /backup/supabase_edge_runtime_danceai.tar.gz -C /volume"

docker run --rm \
  -v supabase_storage_danceai:/volume \
  -v supabase/backups:/backup \
  alpine \
  sh -c "rm -rf /volume/* && tar xzf /backup/supabase_storage_danceai.tar.gz -C /volume"

bunx supabase start