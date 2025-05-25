-- Check for duplicate indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check for foreign keys without indexes
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    CASE 
        WHEN idx.indexname IS NULL THEN 'NO INDEX'
        ELSE 'INDEXED'
    END as index_status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN pg_indexes idx 
    ON idx.tablename = tc.table_name 
    AND idx.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Check for unused indexes (potential duplicates)
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE 
        WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
        WHEN indexdef LIKE '%PRIMARY KEY%' THEN 'PRIMARY KEY'
        ELSE 'REGULAR'
    END as index_type
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
