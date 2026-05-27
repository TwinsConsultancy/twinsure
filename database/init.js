const { config, createCollectionIfNotExists, findOne, insertOne } = require('../backend/lib/database');

async function main() {
  const collectionsToCreate = ['users', 'services', 'partners', 'recommendation_questions', 'leads', 'form_help_requests', 'settings', 'contacts', 'claims'];

  console.log(`Connected to MongoDB.`);
  console.log(`Initializing database: ${config.mongodbDatabase}\n`);

  for (const collectionName of collectionsToCreate) {
    try {
      const created = await createCollectionIfNotExists(collectionName);
      if (created) {
        console.log(`✅ Collection created: ${collectionName}`);
      } else {
        console.log(`ℹ️ Collection already exists: ${collectionName}`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${collectionName}: ${error.message}`);
    }
  }

  const existingAdmin = await findOne('users', { email: config.adminEmail });
  if (existingAdmin === null) {
    await insertOne('users', {
      name: 'Super Admin',
      email: config.adminEmail,
      password: config.adminPassword,
      role: 'admin',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
    console.log(`\n🔑 Default Admin created: ${config.adminEmail}`);
  } else {
    console.log('\n🔑 Admin user already exists.');
  }

  const existingSettings = await findOne('settings', { _id: 'global' });
  if (existingSettings === null) {
    await insertOne('settings', {
      _id: 'global',
      supportEmail: 'support@twinsure.com',
      supportPhone: '+91 9999988888',
      officeAddress: 'Twinsure H.Q., Chennai, Tamil Nadu - 600xxx',
      workingHours: 'Mon-Fri: 9AM - 6PM',
      timeZone: 'IST',
      defaultLanguage: 'English',
      maintenanceMode: false,
      whatsappButton: true,
      emailNotifications: true,
      whatsappNotifications: true,
      leadAlerts: true,
      partnerAlerts: true,
      claimAlerts: true,
      notificationPriority: 'high',
      sessionTimeout: '60',
      loginAttempts: '5',
      recEngineEnabled: true,
      leadPopup: true,
      callbackSlot: true,
      partnerRegEnabled: true,
      referralTracking: true,
      publicCommissionInfo: false,
      minCommission: '5',
      maxCommission: '25',
      manualPartnerApproval: true,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
    console.log('\n⚙️ Default Settings initialized.');
  } else {
    console.log('\n⚙️ Settings already exist.');
  }

  console.log('\n🎉 Database initialization complete!');
}

main().catch((error) => {
  console.error(`\n❌ Connection error: ${error.message}`);
  process.exit(1);
});