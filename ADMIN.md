# Admin Dashboard

## Access URL

```
/manage-portal-x7k9
```

Local: http://localhost:3000/manage-portal-x7k9

## Setup

1. Run the migration in Supabase SQL Editor:
   ```
   src/lib/db/migrations/001_admin_schema.sql
   ```

2. Set yourself as admin:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

## Features

- **Dashboard** - Overview stats and recent activity
- **Products** - Manage marketplace products (CRUD + CSV import)
- **Feedback** - View and manage user feedback
- **Analytics** - User and trip statistics
- **Trips** - View all user trips
