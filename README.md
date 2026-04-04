# QR-Based Café Menu Ordering System

A simple, bug-resistant MVP web application for a QR-based café menu ordering system. Perfect for college projects!

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** (v14 or higher)
- **PostgreSQL** database server

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup PostgreSQL Database

1. **Install PostgreSQL** if you haven't already:
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - During installation, set a password for the `postgres` user

2. **Create the database**:
   Open pgAdmin or psql and run:
   ```sql
   CREATE DATABASE cafe_menu;
   ```

3. **Run the setup script**:
   Connect to the `cafe_menu` database and run the SQL commands in `database_setup.sql`:
   ```bash
   # Using psql command line
   psql -U postgres -d cafe_menu -f database_setup.sql
   ```
   
   Or copy-paste the contents of `database_setup.sql` into pgAdmin query tool.

4. **Update database credentials** (if needed):
   Edit `db.js` file with your PostgreSQL credentials:
   ```javascript
   const pool = new Pool({
     user: 'postgres',
     host: 'localhost',
     database: 'cafe_menu',
     password: 'your_password', // Change this
     port: 5432,
   });
   ```

### Step 3: Run the Application

```bash
npm start
```

The server will start on **http://localhost:3000**

## 📱 Testing the Application

### Testing Flow (Recommended Order)

#### 1. **QR Test Page (Laptop)**
Open in your browser:
```
http://localhost:3000/scan
```
This displays a QR code for Table #1.

#### 2. **Customer Menu (Mobile or Desktop)**
You have two options:

**Option A: Using Phone (Real Experience)**
- Use your phone's camera to scan the QR code on the `/scan` page
- The menu will open on your phone at: `http://localhost:3000/menu?table=1`
- **Note:** Your phone and laptop must be on the same network. You may need to replace `localhost` with your computer's IP address in the QR code.

**Option B: Desktop Testing**
- Simply open in another browser window/tab:
  ```
  http://localhost:3000/menu?table=1
  ```

**Menu Features:**
- Browse available items
- Click "Add to Cart" for any item
- Cart icon shows item count
- Click cart icon to view items
- Adjust quantities with +/- buttons
- Click "Place Order" to submit

#### 3. **Cashier Dashboard**
Open in a new tab:
```
http://localhost:3000/cashier
```

**Features:**
- See all incoming orders in real-time
- Orders auto-refresh every 5 seconds
- Each order shows:
  - Table number
  - Ordered items with quantities
  - Order time
  - Current status
- Click "Mark as Preparing" when kitchen starts
- Click "Mark as Completed" when order is ready

#### 4. **Admin Dashboard**
Open in a new tab:
```
http://localhost:3000/admin
```

**Features:**
- Add new menu items (name, price, description, availability)
- Edit existing items
- Delete items
- Toggle item availability (in-stock/out-of-stock)
- Changes reflect immediately on customer menu

## 🗂️ Project Structure

```
qr-cafe-menu/
│
├── server.js              # Main Express server
├── db.js                  # Database connection config
├── database_setup.sql     # SQL script to create tables
├── package.json           # Dependencies
│
├── routes/
│   ├── menu.js           # Menu API endpoints
│   └── orders.js         # Order API endpoints
│
└── public/
    ├── scan.html         # QR test page
    ├── menu.html         # Customer menu page
    ├── cashier.html      # Cashier dashboard
    ├── admin.html        # Admin dashboard
    ├── style.css         # All styling
    └── script.js         # Frontend JavaScript
```

## 🛠️ API Endpoints

### Menu APIs
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create new menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Order APIs
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `PUT /api/orders/:id` - Update order status

## 🎯 Key Features

✅ **No Login Required** - Instant access  
✅ **Mobile-First Design** - Works great on phones  
✅ **Real-Time Updates** - Auto-refresh on cashier dashboard  
✅ **Cart System** - Add/remove items, adjust quantities  
✅ **Order Status Tracking** - Pending → Preparing → Completed  
✅ **Inventory Management** - Toggle item availability  
✅ **Clean UI** - Simple, modern, and intuitive  
✅ **Well Commented Code** - Easy to understand and modify  

## 🔧 Troubleshooting

### Database Connection Error
If you see "Database connection error":
1. Make sure PostgreSQL is running
2. Check credentials in `db.js`
3. Verify database `cafe_menu` exists

### Port Already in Use
Error: "Port 3000 is already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in server.js
const PORT = 3001; // Different port
```

### QR Code Not Working on Phone
The QR contains `http://localhost:3000/menu?table=1`. For phone access:
1. Find your computer's IP address:
   - Windows: `ipconfig` in terminal
   - Look for IPv4 Address (e.g., 192.168.1.100)
2. Update `scan.html` line 27:
   ```javascript
   const menuUrl = 'http://192.168.1.100:3000/menu?table=1';
   ```

### Menu Items Not Showing
1. Check if database has data:
   ```sql
   SELECT * FROM menu_items;
   ```
2. Run the INSERT statement from `database_setup.sql` if empty

## 📝 Sample Data

The database setup includes 8 sample items:
- Espresso (₹3.50)
- Cappuccino (₹4.50)
- Latte (₹4.00)
- Mocha (₹5.00)
- Green Tea (₹3.00)
- Sandwich (₹5.50)
- Croissant (₹2.50)
- Cake Slice (₹4.00)

## 💡 Tips for Demo/Presentation

1. **Start with Admin Panel** - Show how to manage menu
2. **Move to Scan Page** - Display QR code on projector
3. **Use Phone to Scan** - Live demo of scanning
4. **Place Order** - Add items and submit
5. **Show Cashier Dashboard** - Display incoming order
6. **Update Status** - Mark as preparing/completed

## 🔐 Security Notes

This is an MVP for educational purposes. For production:
- Add authentication/authorization
- Implement input validation
- Use environment variables for sensitive data
- Add HTTPS support
- Implement rate limiting

## 📚 Technologies Used

- **Backend:** Node.js, Express (ES Modules)
- **Database:** PostgreSQL
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **QR Generation:** qrcode library
- **Architecture:** REST API

## 🎓 Learning Points

This project demonstrates:
- RESTful API design
- Database schema design
- CRUD operations
- Async/await patterns
- Mobile-first responsive design
- Client-server communication
- State management (cart)

---

**Built for College Projects** ✨  
Simple, clean, and easy to extend!
