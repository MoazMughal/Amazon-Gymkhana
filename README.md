# Generic Wholesale

> Pakistan's Premier Wholesale Marketplace - Connecting Suppliers, Retailers, and Businesses

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://genericwholesale.pk)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🌟 Overview

Generic Wholesale is a comprehensive B2B wholesale marketplace platform designed specifically for the Pakistani market. It connects verified suppliers with retailers and businesses, facilitating seamless wholesale transactions and business growth.

### Key Features

- 🏪 **Supplier Marketplace** - Browse and connect with 500+ verified Pakistani suppliers
- 💼 **Buyer Dashboard** - Manage orders, track suppliers, and analyze purchases
- 📊 **Seller Portal** - List products, manage inventory, and track sales
- 💳 **Payment Integration** - EasyPaisa payment gateway integration
- 📱 **WhatsApp Integration** - Direct communication with suppliers
- 🔐 **Secure Authentication** - JWT-based authentication system
- 📧 **Email Notifications** - Automated email system for orders and updates
- 🎨 **Modern UI/UX** - Responsive design with Bootstrap 5

## 🚀 Tech Stack

### Frontend
- **React 19** - Modern UI library
- **React Router DOM** - Client-side routing
- **Bootstrap 5** - Responsive CSS framework
- **Vite** - Fast build tool and dev server
- **Font Awesome** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Nodemailer** - Email service
- **Bcrypt** - Password hashing

### Additional Services
- **MongoDB Atlas** - Cloud database
- **Render** - Hosting platform
- **EasyPaisa** - Payment gateway
- **Twilio** - SMS notifications (optional)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas account)
- Git

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/MoazMughal/Amazon-Gymkhana.git
cd Amazon-Gymkhana
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 4. Configure Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

#### Backend (server/.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/amazon-gymkhana
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM_NAME=Generic Wholesale

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Optional: Payment & SMS
EASYPAISA_MERCHANT_ID=your_merchant_id
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_SECRET_KEY=your_secret_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## 🏃 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd server
npm run dev
```
Backend will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
npm run dev
```
Frontend will run on `http://localhost:5173`

### Production Build

#### Build Frontend
```bash
npm run build
```

#### Start Backend in Production
```bash
cd server
npm start
```

## 📁 Project Structure

```
generic-wholesale/
├── public/                 # Static assets
│   ├── assets/            # Product images
│   └── favicon.png        # Site favicon
├── server/                # Backend application
│   ├── middleware/        # Express middlewares
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts
│   ├── services/         # Business logic
│   └── server.js         # Entry point
├── src/                  # Frontend application
│   ├── assets/           # Images and static files
│   ├── components/       # React components
│   ├── context/          # React context providers
│   ├── pages/            # Page components
│   ├── styles/           # CSS files
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main App component
│   └── main.jsx          # Entry point
├── .env.example          # Environment variables template
├── package.json          # Frontend dependencies
└── vite.config.js        # Vite configuration
```

## 🔑 Key Features Explained

### For Buyers
- Browse wholesale products with detailed information
- Access verified supplier contacts
- Track orders and payment history
- Unlock supplier information with payment
- Direct WhatsApp communication

### For Suppliers
- Create and manage product listings
- Dashboard with sales analytics
- Verification system for credibility
- Direct buyer connections
- Payment tracking

### Admin Panel
- User management (buyers & suppliers)
- Product approval system
- Seller verification workflow
- Analytics and reporting
- Content management

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products/public` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sellers
- `GET /api/sellers` - Get all sellers
- `POST /api/sellers/register` - Seller registration
- `GET /api/sellers/profile` - Get seller profile
- `PUT /api/sellers/profile` - Update profile
- `POST /api/sellers/payment` - Process payment

### Buyers
- `POST /api/buyer/register` - Buyer registration
- `GET /api/buyer/profile` - Get buyer profile
- `GET /api/buyer/dashboard/stats` - Dashboard statistics
- `POST /api/buyer/unlock-supplier` - Unlock supplier contact

## 🚀 Deployment

### Deploy on Render

1. **Backend Deployment**
   - Create new Web Service
   - Connect GitHub repository
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables

2. **Frontend Deployment**
   - Create new Static Site
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Add `VITE_API_URL` environment variable

3. **Database**
   - Use MongoDB Atlas (free tier available)
   - Whitelist Render IPs: `0.0.0.0/0`

### Custom Domain Setup
1. Add custom domain in Render dashboard
2. Update DNS records at your domain provider:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: Your Render URL

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Environment variables for sensitive data
- CORS configuration for API security
- Input validation and sanitization
- MongoDB injection prevention

## 📞 Contact

- **Website**: [genericwholesale.pk](https://genericwholesale.pk)
- **Email**: info@genericwholesale.pk
- **Phone**: +92-303-4928000, +92-304-4928000
- **WhatsApp**: +92-303-4928000

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/MoazMughal/Amazon-Gymkhana/issues).

## 👨‍💻 Author

**Moaz Mughal**
- GitHub: [@MoazMughal](https://github.com/MoazMughal)

## 🙏 Acknowledgments

- Bootstrap team for the amazing CSS framework
- React team for the powerful UI library
- MongoDB team for the flexible database
- All contributors and supporters

---

Made with ❤️ in Pakistan
