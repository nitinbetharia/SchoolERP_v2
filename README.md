# 🏫 School ERP System v2.0

**A Complete School Management System with Multi-Tenant Architecture**

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-lightgrey.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3+-blue.svg)](https://tailwindcss.com/)

## 📋 Overview

School ERP is a comprehensive, multi-tenant school management system built with modern web technologies. It provides complete functionality for managing educational institutions including student admissions, fee collection, attendance tracking, and administrative operations.

### ✨ Key Features

- **🏢 Multi-Tenant Architecture** - Each school gets its own branded subdomain
- **📱 Mobile-First Design** - Responsive UI optimized for all devices
- **🎨 Custom Theming** - Tenant-specific colors, logos, and styling
- **🔒 Enterprise Security** - RBAC, rate limiting, audit logging
- **⚡ High Performance** - Caching, lazy loading, optimized queries
- **♿ Accessibility** - WCAG AA compliant, screen reader friendly
- **🔧 Maintainable** - Activity-driven architecture, TypeScript, DRY principles

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js 20 + TypeScript + Express.js
- **Database**: MySQL 8 (master DB + per-trust schemas)
- **Frontend**: Server-rendered EJS + Tailwind CSS
- **Authentication**: Dual mode (Sessions + JWT)
- **Validation**: Zod schemas with strict type safety
- **Deployment**: Docker Compose + Nginx

### Module Structure
```
src/modules/{module}/
├── controllers.ts    # HTTP request handlers (one per activity)
├── services.ts       # Business logic layer
├── repos.ts         # Data access layer with parameterized queries
├── dtos.ts          # Zod validation schemas
├── validators.ts    # Re-exports of DTOs for clarity
└── index.ts         # Barrel exports
```

**Modules**: `data`, `setup`, `auth`, `user`, `stud`, `fees`, `attd`, `rept`, `dash`, `comm`

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MySQL 8+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nitinbetharia/SchoolERP_v2.git
   cd SchoolERP_v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and other configurations
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📖 Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm run dev` - Run development server with TypeScript via ts-node
- `npm start` - Run production server from compiled JavaScript

### Testing
- `npm run test:contract` - Run contract tests against OpenAPI specification
- `npm run gen:contract:cases` - Generate contract test case skeletons from OpenAPI spec

### Database
- `npm run seed:database` - Seed initial system data
- `npm run test:comprehensive` - Run comprehensive API tests

## 🎯 System Modules

### 1. **SETUP Module** (✅ Frontend Complete)
- Trust creation and configuration
- School onboarding with guided wizard
- Academic year setup
- Class and section management
- Subject and grading configuration

### 2. **AUTH Module** (✅ Frontend Complete)
- Session-based authentication
- JWT token authentication
- OTP-based phone verification
- Password reset functionality

### 3. **USER Module** (Backend Complete)
- User creation and management
- Role and permission assignment
- Teacher-subject allocation
- Parent-student linking

### 4. **STUD Module** (Backend Complete)
- Student admission workflow
- Student profile management
- Inter-school transfers
- Academic progression tracking

### 5. **FEES Module** (Backend Complete)
- Fee structure definition
- Online payment processing
- Receipt generation
- Discount and scholarship management

### 6. **ATTD Module** (Backend Complete)
- Daily attendance tracking
- Attendance analytics
- Parent notifications

### 7. **REPT Module** (Backend Complete)
- Student reports
- Fee collection reports
- Attendance analytics
- Custom report builder

### 8. **DASH Module** (Backend Complete)
- Trust admin dashboard
- School admin dashboard
- Teacher dashboard

### 9. **COMM Module** (Backend Complete)
- SMS/Email/WhatsApp notifications
- In-app announcements
- Emergency broadcast alerts

## 🎨 Frontend Features

### Setup Wizard
- **Multi-step guided setup** with visual progress tracking
- **Auto-save functionality** preserves progress across sessions
- **Responsive forms** with client-side and server-side validation
- **Step dependencies** ensure proper configuration order

### Responsive Design
- **Mobile-first approach** optimized for all screen sizes
- **Touch-friendly interface** with 44px minimum touch targets
- **Adaptive typography** scales seamlessly across devices
- **High contrast support** for accessibility

### User Experience
- **Progressive enhancement** - works without JavaScript
- **Loading states** and visual feedback
- **Error handling** with user-friendly messages
- **Accessibility** with ARIA labels and keyboard navigation

## 🔒 Security Features

- **Input Validation**: Zod schemas with strict validation
- **Rate Limiting**: Configured for auth and sensitive endpoints
- **CSRF Protection**: Express security middleware
- **Session Security**: Secure session management
- **Password Security**: Minimum requirements and confirmation
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Template escaping enabled

## 📁 Project Structure

```
school-erp/
├── src/
│   ├── modules/          # Backend modules (10 modules, 66 activities)
│   ├── routes/           # Frontend route handlers
│   ├── middleware/       # Trust context, error handling
│   ├── web/             # Frontend views and assets
│   │   ├── views/       # EJS templates
│   │   │   ├── layouts/ # Base templates
│   │   │   ├── partials/# Reusable components
│   │   │   ├── setup/   # Setup wizard pages
│   │   │   ├── auth/    # Authentication pages
│   │   │   └── errors/  # Error pages
│   │   └── public/      # Static assets (CSS, JS, images)
│   ├── ui/              # Frontend utilities & adapters
│   ├── lib/             # Shared utilities
│   └── types/           # TypeScript type definitions
├── docs/                # Documentation
├── migrations/          # Database migrations
├── tests/               # Test suites
└── scripts/             # Utility scripts
```

## 🌐 API Endpoints

### Backend API (REST)
- **Data Module**: 12 system-level endpoints
- **Setup Module**: 7 configuration endpoints
- **Auth Module**: 2 authentication endpoints
- **User Module**: 6 user management endpoints
- **Student Module**: 8 student lifecycle endpoints
- **Fees Module**: 10 fee management endpoints
- **Attendance Module**: 4 attendance tracking endpoints
- **Reports Module**: 6 reporting endpoints
- **Dashboard Module**: 3 dashboard endpoints
- **Communication Module**: 3 messaging endpoints

### Frontend Routes
- **Authentication**: `/auth/*` - Login, OTP, password reset
- **Setup Wizard**: `/setup/*` - Multi-step configuration
- **Dashboard**: `/dashboard` - Main admin interface

See [SITEMAP.md](docs/SITEMAP.md) for complete endpoint documentation.

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME_MASTER=school_erp_master
SESSION_SECRET=your-session-secret
```

### Multi-Tenant Setup
Each trust gets its own subdomain:
- `trust1.schoolerp.com` → Trust 1 interface
- `trust2.schoolerp.com` → Trust 2 interface

## 📚 Documentation

- [Master Specification](SCHOOL_ERP_MASTER_SPECIFICATION.md) - Complete system specification
- [Development Guide](CLAUDE.md) - Development patterns and commands
- [Dependencies](docs/DEPENDENCIES_AND_PRE_FLIGHT.md) - Setup requirements
- [Sitemap](docs/SITEMAP.md) - Complete endpoint documentation

## 🧪 Testing

### Manual Testing Credentials
After running `npm run seed:database`, use these credentials:

**System Admin:**
- Email: `admin@system.local`
- Password: `SystemAdmin123!`

**Trust Admin:**
- Email: `admin@demo.trust`
- Password: `TrustAdmin123!`

### Test Flows
1. **Setup Wizard**: Navigate to `/setup` and complete trust configuration
2. **Authentication**: Test login with OTP verification
3. **Multi-tenant**: Access different subdomains
4. **Mobile**: Test responsive design on mobile devices

## 🚀 Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Using docker-compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `docs/` folder for detailed guides
- **Issues**: Open an issue on GitHub
- **Email**: support@schoolerp.com

## 🎯 Roadmap

### Completed ✅
- Multi-tenant architecture
- Complete backend API (66 activities)
- Setup wizard frontend
- Authentication system
- Responsive UI framework

### In Progress 🔄
- Additional frontend modules
- Advanced reporting
- Mobile app integration

### Planned 📅
- SSO integration
- Advanced analytics
- Parent mobile app
- Payment gateway integration

---

**Made with ❤️ for Education**