# Database Setup Instructions

## PostgreSQL Database Setup for FST Cost Management

### Prerequisites
- PostgreSQL installed and running
- PostgreSQL superuser credentials (usually `postgres`)
- PHP with `pgsql` extension enabled

### Method 1: Using PHP Script (Recommended)

1. **Update database credentials** in `config.php` or `.env` file:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=fst_cost_db
   DB_USER=postgres
   DB_PASS=your_password
   ```

2. **Run the PHP setup script**:
   ```bash
   php database/create_database.php
   ```

   The script will:
   - Check if the database exists
   - Create the database if it doesn't exist
   - Create all tables, indexes, functions, and triggers
   - Verify the setup

### Method 2: Using SQL File Directly

1. **Connect to PostgreSQL**:
   ```bash
   psql -U postgres
   ```

2. **Create the database**:
   ```sql
   CREATE DATABASE fst_cost_db;
   \c fst_cost_db
   ```

3. **Run the SQL file**:
   ```bash
   psql -U postgres -d fst_cost_db -f database/create_database.sql
   ```

### Database Schema

The database includes the following tables:

- **countries** - Country master data
- **regions** - Regional divisions within countries
- **cities** - Cities within regions
- **departments** - Departments within cities
- **users** - User accounts (LDAP authentication)

### Table Relationships

```
countries (1) ────> (N) regions
regions (1) ────> (N) cities
cities (1) ────> (N) departments
cities (1) ────> (N) users
departments (1) ────> (N) users
```

### Verification

To verify the database was created correctly:

```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check users table structure
\d users

-- Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### Troubleshooting

#### Connection Errors
- Verify PostgreSQL is running: `sudo service postgresql status`
- Check credentials in `config.php`
- Verify PostgreSQL user has CREATE DATABASE privilege

#### Permission Errors
- Ensure the PostgreSQL user has superuser privileges or CREATE DATABASE privilege
- For production, create a dedicated user with appropriate privileges

#### Port Issues
- Default PostgreSQL port is 5432
- Check if port is correct in configuration

### Notes

- All tables have `created_at` and `updated_at` timestamps
- `updated_at` is automatically updated via triggers
- Foreign keys use CASCADE or SET NULL depending on relationships
- Status fields have CHECK constraints for data integrity

