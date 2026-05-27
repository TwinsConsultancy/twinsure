// Archived MongoDB shell schema from the original project.
// Kept for reference; actual runtime uses database/init.js

// MongoDB Schema Definition and Initialization Script
// Run this file using the MongoDB shell:
// mongosh <database_name> schema.js

const dbName = 'twinsure_db';
db = db.getSiblingDB(dbName);

print("Creating collections and indexes for " + dbName + "...");

// 1. Users Collection
db.createCollection("users");
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

// Insert default Admin
if (db.users.countDocuments({ email: "admin@twinsure.com" }) === 0) {
    db.users.insertOne({
        name: "Super Admin",
        email: "admin@twinsure.com",
        password: "admin", // In production, this should be hashed
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
    });
    print("Default admin created: admin@twinsure.com / admin");
}

// 2. Services (Insurance Products)
db.createCollection("services");
db.services.createIndex({ "category": 1 });

// 3. Partners Collection
db.createCollection("partners");
db.partners.createIndex({ "userId": 1 });
db.partners.createIndex({ "referralCode": 1 }, { unique: true });

// 4. Recommendation Questions Builder
db.createCollection("recommendation_questions");
db.recommendation_questions.createIndex({ "type": 1 });

// 5. User Leads / Submitted Recommendations
db.createCollection("leads");
db.leads.createIndex({ "status": 1 });
db.leads.createIndex({ "createdAt": -1 });

print("Database schemas created successfully!");
