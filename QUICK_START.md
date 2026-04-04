# Quick Start - QR Café Menu System

## Installation Steps (First Time Only)

### 1. Install Node.js Packages
```bash
npm install
```

### 2. Setup PostgreSQL Database

**Create Database:**
```sql
CREATE DATABASE cafe_menu;
```

**Run Setup Script:**
- Open pgAdmin or psql
- Connect to `cafe_menu` database
- Run all commands from `database_setup.sql`

**Update Password in db.js:**
Edit line 7 in db.js:
```javascript
password: 'your_password', // Change to your PostgreSQL password
```

### 3. Start the Server
```bash
npm start
```

Server runs on: http://localhost:3000

---

## Testing Flow (Complete Demo)

### Step 1: Open Scan Page (Laptop)
http://localhost:3000/scan

### Step 2: Open Menu (Phone or New Tab)
- Scan QR code with phone, OR
- Visit: http://localhost:3000/menu?table=1

### Step 3: Place Order (Customer)
1. Browse menu items
2. Click "Add to Cart" on items
3. Click cart icon (top right)
4. Adjust quantities
5. Click "Place Order"

### Step 4: View Order (Cashier Dashboard)
http://localhost:3000/cashier

- See new order appear
- Click "Mark as Preparing"
- Click "Mark as Completed"

### Step 5: Manage Menu (Admin Dashboard)
http://localhost:3000/admin

- Add new menu item
- Edit existing item
- Delete item
- Toggle availability

---

## All URLs at a Glance

| Page | URL | Purpose |
|------|-----|---------|
| Home | http://localhost:3000 | Redirects to /scan |
| QR Test | http://localhost:3000/scan | Display QR code |
| Menu | http://localhost:3000/menu | Customer ordering |
| Cashier | http://localhost:3000/cashier | Order management |
| Admin | http://localhost:3000/admin | Menu management |

---

## Common Issues & Solutions

### ❌ Database Connection Error
**Solution:** 
1. Check PostgreSQL is running
2. Verify password in `db.js`
3. Ensure database `cafe_menu` exists

### ❌ Port 3000 Already in Use
**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### ❌ Phone Can't Access Localhost
**Solution:**
1. Find your PC's IP: Run `ipconfig` in terminal
2. Update `public/scan.html` line 27:
   ```javascript
   const menuUrl = 'http://YOUR_IP:3000/menu?table=1';
   ```

---

## Project Files Overview

```
qr/
├── server.js           ← Main server file
├── db.js              ← Database config
├── database_setup.sql ← SQL setup script
├── package.json       ← Dependencies
│
├── routes/
│   ├── menu.js       ← Menu API
│   └── orders.js     ← Orders API
│
└── public/
    ├── scan.html     ← QR page
    ├── menu.html     ← Customer menu
    ├── cashier.html  ← Cashier dashboard
    ├── admin.html    ← Admin panel
    ├── style.css     ← Styling
    └── script.js     ← Frontend logic
```

---

## Database Tables

### menu_items
- id (auto)
- name
- price (in paise/cents)
- description
- available (true/false)

### orders
- id (auto)
- table_number
- status (pending/preparing/completed)
- created_at

### order_items
- id (auto)
- order_id
- menu_item_id
- quantity

---

## Sample Test Data

After running database_setup.sql, you'll have:
- 8 menu items (coffee, tea, food)
- All items available
- Ready to test immediately!

---

Happy Coding! 🚀
