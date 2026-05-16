🌐 1. Public Website (Landing Experience)
This is the front door—the first impression, the silent salesman.
Core Pages
    Home
        Brand intro
        Key offerings (Insurance + Partner earning)
        CTA: Get Insurance / Become Partner
    About
        Company vision, trust, credibility
        Why Twinsure
        Company vision, trust, credibility
        Why Twinsure
    Services
        New Insurance
        Renewal Insurance
        View Existing Insurance
        Insurance Categories (Health, Vehicle, Life, etc.)
        Individual service detail pages
        ROI calculators (dynamic per service)
        Recommendation System (Smart Engine)
            Dynamic questionnaire (decision-tree based)
            Adaptive questions (based on previous answers)
            Input collection:
                dynamcally set in the admin dashboard (asper the recommendations.md file)
            Output:
                Recommended insurance plans
                ROI calculation
            Backend flow:
            Store final response
            Send to employee dashboard
            Show “We’ll contact you soon”
    Partner Page
        Benefits of becoming partner
        Commission structure
        CTA to register
    Contact Page
        Inquiry form
        Support details
    Login / Signup (User / Partner / Employee / Admin)


🔐 2. Authentication System
    Role-based login:
        User (not needed now)
        Partner (not needed now)
        Employee (not needed now)
        Admin
    Login methods:
        Phone + Password
        OTP (optional / mandatory for admin)
        Referral code support (during signup)


👤 3. User Dashboard (Client Panel) (not needed now)
    Profile & Data
        Profile CRUD
        Document upload & management
        Insurance details tracking
    Insurance Services
        Apply for new insurance
        View existing insurance
        Renew / Upgrade plans
    Payments
        Pay to organization account
        Payment tracking
        Dual receipts:
            User → Organization
            Organization → Provider
    Support System
        Chat with employee
        Schedule calls (time slots)
        Raise issue tickets
        Claim request submission
        Claim tracking (status updates)


🤝 4. Partner Dashboard (not needed now)
    (Everything a user has + earning system)
    Referral System
        Unique referral code
        Track referred users
        Manual referral submission (phone number based)
        Earnings & Wallet
        Commission lifecycle:
            Referral → 20 days waiting → Eligible
            Added to wallet
        Wallet features:
        Balance view
        Transaction history
        Withdrawal System
            Request withdrawal
            2-day safety waiting period
            Admin approval required
        Wallet Usage
            Use wallet to pay own insurance
            Same approval + waiting flow
        Performance
            Monthly targets (optional)
            Earnings analytics


🧑‍💼 5. Employee Dashboard (not needed now)
    Profile
        CRUD operations
    Client & Partner Management
        View full details
        Manage interactions
        Communication
    Chat system (user & partner)
        Call scheduling handling
    Claims Management
        View & categorize claims
        Verify documents
        Update claim status
    Payment Operations
        Verify incoming payments
        Remind users for pending payments
        Trigger payment to insurance providers
        Upload provider payment receipts
    Referral Processing
        Validate referral claims
        Forward commission requests to admin
    Notifications
        Tasks like:
            Pending payments
            Claim actions
            Approval requests
            Data Handling
            Bulk data entry
            Export reports
    CRUD Operations
        Clients
        Partners
        Claims


🧠 6. Admin Dashboard (Control Tower)
    Access Control
        Mandatory OTP login
        Full System Control
    All employee capabilities +
        User Management
            CRUD:
                Users
                Partners
                Employees
        Commission Management
            Approve / Reject commissions
            Set commission % per insurance type
            Manual adjustments
        Financial System
            Wallet monitoring
            Withdrawal approvals
            Amount tally system
        Insurance Provider Management
            Add / Edit / Remove providers
            Example:
                Vehicle → Cholamandalam, Maruti Suzuki
                Health → etc.
        Analytics & Insights
            Claim-wise analysis
            Partner performance
            Provider performance
            Referral vs Direct comparison
            Revenue tracking
            Trend analysis
            Renewal System
            Track renewals
            Upgrade vs renewal insights
        Data Management
            Bulk import/export
            Full audit logs
        System Controls
            Maintenance mode (disable platform temporarily)


⚙️ 7. Core System Engines (Behind the Scenes)
    💰 Commission Engine
        Rules:
            20-day validation period
            Admin approval required
            Wallet-based credit
            Triggers:
                Referral validation
                Payment completion
    🧾 Payment Flow Engine
        User pays → Organization
        Employee verifies
        Employee pays → Provider
        Receipt uploaded & linked
    🧠 Recommendation Engine
        asper recommendations.md file
    💬 Communication Engine
        Chat system (real-time or async)
        Call scheduling system
    📊 Analytics Engine
        Tracks:
            Revenue
            Claims
            Referrals
            Conversions
    🔔 Notification System
        Role-based alerts:
        Users (claims, payments)
        Partners (earnings)
        Employees (tasks)
        Admin (approvals)
    🔒 8. Security & Compliance
        OTP authentication (critical roles)
        Document verification
        Fraud prevention:
            Withdrawal delay (2 days)
            Commission delay (20 days)
        Data encryption
        Role-based access control
    🧩 9. Additional Advanced Features (Future Ready)
        AI-based recommendation improvements
        Fraud detection system
        Automated claim pre-verification
        Partner ranking system
        Smart reminders (renewals, payments)
        Multi-language support

🧭 Flow Summary (Simple View)
    User Journey
        Visitor → Recommendation → Submit Details → Employee Connect → Payment → Insurance Activated → Claim/Renewal
    Partner Journey
        Refer → Wait 20 days → Commission → Wallet → Withdraw / Use
    Employee Flow
        Lead → Verify → Process → Pay Provider → Update Records
    Admin Flow
        Monitor → Approve → Analyze → Control


🧩UI requirements:
    professional and dynamic mobile friendly design
    use colors : Midnight sky (00296b, 003f88, 00509d, fdc500, ffd500) only.

🧠Tech stack:
    Frontend: HTML5, CSS3, js
    frontend framework: use core code no frameworks to be used
    Backend: PHP
    backend framework: Laravel
    Database: Mongodb
    authentication: jwt (not required now)
