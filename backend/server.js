const crypto = require('crypto');
const express = require('express');
const compression = require('compression');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const {
  ObjectId,
  config,
  createCollectionIfNotExists,
  deleteOne,
  findMany,
  findOne,
  formatDateTime,
  getDb,
  insertOne,
  updateOne
} = require('./lib/database');
const { requireRole } = require('./lib/auth');

const app = express();

// Enable GZIP compression to reduce network payload size (Lighthouse optimization)
app.use(compression());

// Simple request logger to aid debugging of routing and methods
app.use((req, res, next) => {
  try {
    const short = {
      contentType: req.headers['content-type'] || null,
      contentLength: req.headers['content-length'] || null,
      hasAuthorization: !!req.headers.authorization
    };
    console.log('REQ:', req.method, req.path, JSON.stringify(short));
  } catch (e) {
    console.log('REQ:', req.method, req.path);
  }
  next();
});
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const claimsUploadDir = path.join(publicDir, 'uploads', 'claims');
const partnersUploadDir = path.join(publicDir, 'uploads', 'partners');
const upload = multer({ storage: multer.memoryStorage() });

// --- Global Error Handlers ---
process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
});


function ensureDirectory(directoryPath) {
  try {
    fs.mkdirSync(directoryPath, { recursive: true });
  } catch (err) {
    if (err && err.code === 'EEXIST') {
      // Already exists — ignore
      return;
    }
    throw err;
  }
}

function sendJson(res, statusCode, payload) {
  res.status(statusCode).type('application/json').send(JSON.stringify(payload));
}

function methodNotAllowed(res, message = 'Method not allowed.') {
  sendJson(res, 405, { message });
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeFileName(fileName) {
  return path.basename(String(fileName || 'file')).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function formatFileSize(size) {
  if (size >= 1048576) {
    return `${Math.round((size / 1048576) * 10) / 10} MB`;
  }

  return `${Math.round(size / 1024)} KB`;
}

function isPdfFile(file) {
  const originalName = file?.originalname || '';
  return path.extname(originalName).toLowerCase() === '.pdf';
}

function fileBufferToPath(filePath, buffer) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, buffer);
}

function deleteFileIfExists(filePath) {
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    fs.unlinkSync(filePath);
  }
}

function collectBody(req) {
  return req.body && typeof req.body === 'object' ? req.body : {};
}

function toObjectId(id) {
  return new ObjectId(String(id));
}

async function getAdminName(adminId) {
  try {
    const admin = await findOne('users', { _id: toObjectId(adminId) });
    if (admin && admin.name) {
      return admin.name;
    }
  } catch (error) {
    // Fall back to the generic label below.
  }

  return 'Admin';
}

function normalizeHelpRequestStatus(status) {
  const normalized = normalizeString(status).toLowerCase();
  if (normalized === 'in-progress') {
    return 'pending';
  }

  if (normalized === 'resolved') {
    return 'completed';
  }

  if (['new', 'pending', 'completed'].includes(normalized)) {
    return normalized;
  }

  return 'new';
}

async function connectAndSeed() {
  await getDb();
  ensureDirectory(claimsUploadDir);
  ensureDirectory(partnersUploadDir);

  const collectionsToCreate = ['users', 'services', 'partners', 'recommendation_questions', 'leads', 'form_help_requests', 'settings', 'contacts', 'claims'];
  for (const collectionName of collectionsToCreate) {
    await createCollectionIfNotExists(collectionName);
  }

  const existingAdmin = await findOne('users', { email: config.adminEmail });
  if (!existingAdmin) {
    await insertOne('users', {
      name: 'Super Admin',
      email: config.adminEmail,
      password: config.adminPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const existingSettings = await findOne('settings', { _id: 'global' });
  if (!existingSettings) {
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
  }
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Handle JSON parse errors from body-parser and return JSON responses
app.use((err, req, res, next) => {
  if (!err) return next();

  // body-parser signals parse errors in a few ways; handle common cases
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    console.warn('Invalid JSON payload received for', req.method, req.path);
    sendJson(res, 400, { message: 'Invalid JSON payload.' });
    return;
  }

  // Not a JSON parse error — forward to default error handling
  next(err);
});

app.use('/uploads/claims', express.static(claimsUploadDir));
app.use('/uploads/partners', express.static(partnersUploadDir));
app.use(express.static(publicDir));
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

function createApiRouter() {
  const router = express.Router();

  router.post('/auth/login', async (req, res) => {
    const data = collectBody(req);
    if (!data.email || !data.password) {
      sendJson(res, 400, { message: 'Incomplete data.' });
      return;
    }

    try {
      const user = await findOne('users', { email: data.email });
      if (!user) {
        sendJson(res, 401, { message: 'User not found.' });
        return;
      }

      if (data.password !== user.password) {
        sendJson(res, 401, { message: 'Invalid credentials.' });
        return;
      }

      const token = Buffer.from(JSON.stringify({ id: user._id, role: user.role, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64');
      sendJson(res, 200, {
        message: 'Login successful.',
        token,
        role: user.role,
        name: user.name
      });
    } catch (error) {
      sendJson(res, 500, { message: `Error executing query: ${error.message}` });
    }
  });

  router.get('/public/claims', async (req, res) => {
    try {
      const claims = await findMany('claims', { status: 'active' }, { sort: { lastUpdated: -1 } });
      sendJson(res, 200, claims.map((claim) => ({
        ...claim,
        createdAt: claim.createdAt ? formatDateTime(claim.createdAt) : claim.createdAt,
        lastUpdated: claim.lastUpdated ? formatDateTime(claim.lastUpdated) : claim.lastUpdated
      })));
    } catch (error) {
      sendJson(res, 500, { message: `Error listing active claims: ${error.message}` });
    }
  });

  router.post('/public/contact', async (req, res) => {
    const data = collectBody(req);
    const name = normalizeString(data.name);
    const phone = normalizeString(data.phone);
    const city = normalizeString(data.city);

    if (!name || !phone || !city) {
      sendJson(res, 400, { error: 'Name, phone and city are required.' });
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      sendJson(res, 400, { error: 'Invalid phone number.' });
      return;
    }

    const email = normalizeString(data.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      sendJson(res, 400, { error: 'Invalid email address.' });
      return;
    }

    try {
      await insertOne('contacts', {
        name,
        phone,
        city,
        email,
        altPhone: normalizeString(data.altPhone),
        address: normalizeString(data.address),
        enquiryType: normalizeString(data.enquiryType),
        specify: normalizeString(data.specify).slice(0, 100),
        submittedAt: new Date(),
        status: 'new'
      });
      sendJson(res, 200, { success: true });
    } catch (error) {
      sendJson(res, 500, { error: `Failed to save: ${error.message}` });
    }
  });

  router.get('/public/recommendation_flow', async (req, res) => {
    try {
      const flows = await findMany('recommendation_questions', {});
      if (flows.length > 0) {
        const flow = { ...flows[0] };
        delete flow._id;
        sendJson(res, 200, flow);
        return;
      }

      sendJson(res, 200, { greeting: '', nodes: [], edges: [] });
    } catch (error) {
      sendJson(res, 500, { error: `Database error: ${error.message}` });
    }
  });

  router.post('/public/submit_lead', async (req, res) => {
    const data = collectBody(req);
    if (!data.name || !data.phone) {
      sendJson(res, 400, { error: 'Name and phone are required.' });
      return;
    }

    try {
      await insertOne('leads', {
        name: normalizeString(data.name),
        phone: normalizeString(data.phone),
        email: normalizeString(data.email),
        answers: Array.isArray(data.answers) ? data.answers : [],
        callbackSlots: Array.isArray(data.callbackSlots) ? data.callbackSlots : [],
        submittedAt: new Date(),
        status: 'new'
      });
      sendJson(res, 200, { success: true, message: 'Lead submitted successfully.' });
    } catch (error) {
      sendJson(res, 500, { error: `Failed to save lead: ${error.message}` });
    }
  });

  router.post('/public/form_help_requests', async (req, res) => {
    const data = collectBody(req);
    const name = normalizeString(data.name);
    const phone = normalizeString(data.phone);
    const description = normalizeString(data.description);
    const claimId = normalizeString(data.claimId);
    const claimName = normalizeString(data.claimName) || 'Claim Form';
    const claimCategory = normalizeString(data.claimCategory);

    const namePattern = /^[A-Za-z][A-Za-z\s.'-]{1,79}$/;
    const phonePattern = /^[0-9+\-()\s]{10,18}$/;

    if (!name || !namePattern.test(name)) {
      sendJson(res, 400, { message: 'Please enter a valid name.' });
      return;
    }

    if (!phone || !phonePattern.test(phone) || (phone.match(/\d/g) || []).length < 10) {
      sendJson(res, 400, { message: 'Please enter a valid phone number with at least 10 digits.' });
      return;
    }

    if (description.length > 500) {
      sendJson(res, 400, { message: 'Description must be 500 characters or fewer.' });
      return;
    }

    try {
      const requestId = `fhr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const timestamp = formatDateTime(new Date());

      await insertOne('form_help_requests', {
        requestId,
        name,
        phone,
        description,
        claimId,
        claimName,
        claimCategory,
        status: 'new',
        submittedAt: timestamp,
        updatedAt: timestamp,
        source: 'downloads'
      });

      sendJson(res, 201, {
        success: true,
        message: 'Your request has been submitted. Our team will contact you shortly.'
      });
    } catch (error) {
      sendJson(res, 500, { message: `Failed to submit request: ${error.message}` });
    }
  });

  router.get('/public/download_claim', async (req, res) => {
    const id = normalizeString(req.query.id);

    if (!id) {
      res.status(400).send('Claim ID is required.');
      return;
    }

    try {
      const claim = await findOne('claims', { _id: toObjectId(id) });
      if (!claim) {
        res.status(404).send('Claim form not found.');
        return;
      }

      await updateOne('claims', { _id: toObjectId(id) }, { $inc: { downloads: 1 } });
      res.redirect(`/${claim.filePath}`);
    } catch (error) {
      res.status(500).send(`Error processing download: ${error.message}`);
    }
  });

  router.get('/admin/claims', requireRole('admin'), async (req, res) => {
    try {
      const claims = await findMany('claims', {}, { sort: { lastUpdated: -1 } });
      sendJson(res, 200, claims.map((claim) => ({
        ...claim,
        createdAt: claim.createdAt ? formatDateTime(claim.createdAt) : claim.createdAt,
        lastUpdated: claim.lastUpdated ? formatDateTime(claim.lastUpdated) : claim.lastUpdated
      })));
    } catch (error) {
      sendJson(res, 500, { message: `Error listing claims: ${error.message}` });
    }
  });

  router.post('/admin/claims', requireRole('admin'), upload.single('pdf'), async (req, res) => {
    const body = collectBody(req);
    const id = normalizeString(body.id);
    const name = normalizeString(body.name);
    const category = normalizeString(body.category);
    const description = normalizeString(body.description);
    const status = normalizeString(body.status) || 'active';

    if (!name || !category) {
      sendJson(res, 400, { message: 'Form Name and Category are required.' });
      return;
    }

    try {
      let existingClaim = null;
      if (id) {
        existingClaim = await findOne('claims', { _id: toObjectId(id) });
        if (!existingClaim) {
          sendJson(res, 404, { message: 'Claim form not found for updating.' });
          return;
        }
      }

      let fileName = null;
      let filePath = null;
      let fileSize = null;

      if (req.file) {
        if (!isPdfFile(req.file)) {
          sendJson(res, 400, { message: 'Only PDF files are allowed.' });
          return;
        }

        const cleanName = sanitizeFileName(req.file.originalname);
        fileName = `${Math.floor(Date.now() / 1000)}_${cleanName}`;
        filePath = path.join(claimsUploadDir, fileName);
        fileBufferToPath(filePath, req.file.buffer);
        fileSize = formatFileSize(req.file.size);
      }

      if (!id && !filePath) {
        sendJson(res, 400, { message: 'PDF document upload is required for new claim forms.' });
        return;
      }

      const now = new Date();
      const adminName = await getAdminName(req.user.id);

      if (!id) {
        await insertOne('claims', {
          name,
          category,
          description,
          status,
          fileName,
          filePath: `uploads/claims/${fileName}`,
          fileSize,
          downloads: 0,
          uploadedBy: adminName,
          createdAt: now,
          lastUpdated: now
        });
        sendJson(res, 201, { success: true, message: 'Claim form published successfully.' });
        return;
      }

      const finalFileName = fileName !== null ? fileName : existingClaim.fileName;
      const finalFilePath = filePath !== null ? `uploads/claims/${fileName}` : existingClaim.filePath;
      const finalFileSize = fileSize !== null ? fileSize : existingClaim.fileSize;

      if (filePath !== null && existingClaim.filePath) {
        deleteFileIfExists(path.join(publicDir, existingClaim.filePath));
      }

      await updateOne('claims', { _id: toObjectId(id) }, {
        $set: {
          name,
          category,
          description,
          status,
          fileName: finalFileName,
          filePath: finalFilePath,
          fileSize: finalFileSize,
          lastUpdated: now
        }
      });

      sendJson(res, 200, { success: true, message: 'Claim form updated successfully.' });
    } catch (error) {
      sendJson(res, 500, { message: `Database write failed: ${error.message}` });
    }
  });

  router.delete('/admin/claims', requireRole('admin'), async (req, res) => {
    const id = normalizeString(req.query.id);
    if (!id) {
      sendJson(res, 400, { message: 'Claim ID is required for deletion.' });
      return;
    }

    try {
      const claim = await findOne('claims', { _id: toObjectId(id) });
      if (claim && claim.filePath) {
        deleteFileIfExists(path.join(publicDir, claim.filePath));
      }

      await deleteOne('claims', { _id: toObjectId(id) });
      sendJson(res, 200, { success: true, message: 'Claim form deleted successfully.' });
    } catch (error) {
      sendJson(res, 500, { message: `Failed to delete claim: ${error.message}` });
    }
  });

  router.get('/admin/contacts', requireRole('admin'), async (req, res) => {
    try {
      const contacts = await findMany('contacts', {}, { sort: { submittedAt: -1 } });
      sendJson(res, 200, contacts.map((contact) => ({
        ...contact,
        submittedAt: contact.submittedAt ? formatDateTime(contact.submittedAt) : contact.submittedAt
      })));
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });

  router.post('/admin/contacts', requireRole('admin'), async (req, res) => {
    const data = collectBody(req);
    if (!data.id || !data.status) {
      sendJson(res, 400, { error: 'id and status required' });
      return;
    }

    try {
      await updateOne('contacts', { _id: toObjectId(data.id) }, { $set: { status: data.status } });
      sendJson(res, 200, { success: true });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });

  router.get('/admin/leads', requireRole('admin'), async (req, res) => {
    try {
      const leads = await findMany('leads', {}, { sort: { submittedAt: -1 } });
      sendJson(res, 200, leads.map((lead) => ({
        ...lead,
        submittedAt: lead.submittedAt ? formatDateTime(lead.submittedAt) : lead.submittedAt
      })));
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });

  router.post('/admin/leads', requireRole('admin'), async (req, res) => {
    const data = collectBody(req);
    if (!data.id || !data.status) {
      sendJson(res, 400, { error: 'id and status required' });
      return;
    }

    try {
      await updateOne('leads', { _id: toObjectId(data.id) }, { $set: { status: data.status } });
      sendJson(res, 200, { success: true });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });

  router.get('/admin/form_help_requests', requireRole('admin'), async (req, res) => {
    try {
      const requests = await findMany('form_help_requests', {}, { sort: { submittedAt: -1 } });
      sendJson(res, 200, requests);
    } catch (error) {
      sendJson(res, 500, { message: `Error listing form filling requests: ${error.message}` });
    }
  });

  router.post('/admin/form_help_requests', requireRole('admin'), async (req, res) => {
    const data = collectBody(req);
    if (!data.id || !data.status) {
      sendJson(res, 400, { message: 'id and status required' });
      return;
    }

    try {
      await updateOne('form_help_requests', { requestId: normalizeString(data.id) }, {
        $set: {
          status: normalizeHelpRequestStatus(data.status),
          updatedAt: formatDateTime(new Date())
        }
      });
      sendJson(res, 200, { success: true, message: 'Request status updated successfully.' });
    } catch (error) {
      sendJson(res, 500, { message: `Failed to update request: ${error.message}` });
    }
  });

  router.delete('/admin/form_help_requests', requireRole('admin'), async (req, res) => {
    const id = normalizeString(req.query.id);
    if (!id) {
      sendJson(res, 400, { message: 'id required' });
      return;
    }

    try {
      await deleteOne('form_help_requests', { requestId: id });
      sendJson(res, 200, { success: true, message: 'Request deleted successfully.' });
    } catch (error) {
      sendJson(res, 500, { message: `Failed to delete request: ${error.message}` });
    }
  });

  router.get('/admin/partners', requireRole('admin'), async (req, res) => {
    try {
      const filter = req.query.id ? { _id: toObjectId(req.query.id) } : {};
      const rows = await findMany('partners', filter);
      sendJson(res, 200, rows);
    } catch (error) {
      sendJson(res, 500, { message: `Error: ${error.message}` });
    }
  });

  router.post('/public/partners', upload.single('photo'), async (req, res) => {
    try {
      const name = normalizeString(req.body.name);
      const phone = normalizeString(req.body.phone);
      const email = normalizeString(req.body.email);
      const address = normalizeString(req.body.address);
      const occupation = normalizeString(req.body.occupation);
      const meta = {};

      if (occupation === 'student') {
        meta.college = normalizeString(req.body.college);
        meta.course = normalizeString(req.body.course);
      } else {
        meta.company = normalizeString(req.body.company);
        meta.designation = normalizeString(req.body.designation);
      }

      if (!name || !phone || !email) {
        sendJson(res, 400, { message: 'Missing required fields (name, phone, email).' });
        return;
      }

      let photoPath = null;
      if (req.file) {
        const originalName = sanitizeFileName(req.file.originalname);
        const ext = path.extname(originalName);
        const safe = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\-.]/g, '_');
        const filename = `${safe}_${Date.now()}${ext}`;
        const destination = path.join(partnersUploadDir, filename);
        ensureDirectory(path.dirname(destination));
        fs.writeFileSync(destination, req.file.buffer);
        photoPath = `uploads/partners/${filename}`;
      }

      const insertedId = await insertOne('partners', {
        name,
        phone,
        email,
        address,
        occupation,
        meta,
        photo: photoPath,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      sendJson(res, 201, { message: 'Partner created', id: String(insertedId) });
    } catch (error) {
      sendJson(res, 500, { message: `Error: ${error.message}` });
    }
  });

  router.put('/admin/partners', requireRole('admin'), async (req, res) => {
    const input = collectBody(req);
    const id = normalizeString(input.id);
    if (!id) {
      sendJson(res, 400, { message: 'Missing id parameter.' });
      return;
    }

    try {
      const updateData = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.address !== undefined) updateData.address = input.address;
      if (input.occupation !== undefined) updateData.occupation = input.occupation;
      if (input.status !== undefined) updateData.status = input.status;

      const meta = {};
      if (input.college !== undefined) meta.college = input.college;
      if (input.course !== undefined) meta.course = input.course;
      if (input.company !== undefined) meta.company = input.company;
      if (input.designation !== undefined) meta.designation = input.designation;
      if (Object.keys(meta).length > 0) {
        updateData.meta = meta;
      }

      updateData.updatedAt = new Date();

      await updateOne('partners', { _id: toObjectId(id) }, { $set: updateData });
      sendJson(res, 200, { message: 'Updated' });
    } catch (error) {
      sendJson(res, 500, { message: `Error: ${error.message}` });
    }
  });

  router.delete('/admin/partners', requireRole('admin'), async (req, res) => {
    const input = collectBody(req);
    const id = normalizeString(input.id || req.query.id);
    if (!id) {
      sendJson(res, 400, { message: 'Missing id parameter.' });
      return;
    }

    try {
      await deleteOne('partners', { _id: toObjectId(id) });
      sendJson(res, 200, { message: 'Deleted' });
    } catch (error) {
      sendJson(res, 500, { message: `Error: ${error.message}` });
    }
  });

  router.get('/admin/recommendations', requireRole('admin'), async (req, res) => {
    try {
      const flows = await findMany('recommendation_questions', {});
      if (flows.length === 0) {
        sendJson(res, 200, {
          greeting: "Welcome! Let's find the best insurance plan for you.",
          nodes: [],
          edges: []
        });
        return;
      }

      sendJson(res, 200, flows[0]);
    } catch (error) {
      sendJson(res, 500, { message: `Error loading flow: ${error.message}` });
    }
  });

  router.post('/admin/recommendations', requireRole('admin'), async (req, res) => {
    const data = collectBody(req);

    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      sendJson(res, 400, { message: 'Invalid flow data structure.' });
      return;
    }

    try {
      const db = await getDb();
      await db.collection('recommendation_questions').deleteMany({});
      await insertOne('recommendation_questions', {
        greeting: data.greeting || '',
        nodes: data.nodes,
        edges: data.edges,
        updatedAt: new Date()
      });

      sendJson(res, 200, { message: 'Recommendation flow saved successfully.' });
    } catch (error) {
      sendJson(res, 500, { message: `Error saving flow: ${error.message}` });
    }
  });

  router.get('/admin/settings', requireRole('admin'), async (req, res) => {
    try {
      const settings = await findOne('settings', { _id: 'global' });
      if (settings) {
        sendJson(res, 200, settings);
        return;
      }

      sendJson(res, 404, { error: 'Settings not found' });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });

  router.post('/admin/settings', requireRole('admin'), async (req, res) => {
    const data = collectBody(req);
    if (!data || Object.keys(data).length === 0) {
      sendJson(res, 400, { error: 'Invalid payload' });
      return;
    }

    try {
      const updateData = { ...data };
      delete updateData._id;
      updateData.updatedAt = formatDateTime(new Date());

      await updateOne('settings', { _id: 'global' }, { $set: updateData }, { upsert: true });
      sendJson(res, 200, { success: true, message: 'Settings updated successfully' });
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
  });

  router.get('/admin/users', requireRole('admin'), async (req, res) => {
    try {
      const users = await findMany('users', {});
      sendJson(res, 200, users.map((user) => {
        const clone = { ...user };
        delete clone.password;
        return clone;
      }));
    } catch (error) {
      sendJson(res, 500, { message: `Error: ${error.message}` });
    }
  });

  router.post('/admin/users', requireRole('admin'), async (req, res) => {
    const data = collectBody(req);
    if (!data.name || !data.email || !data.role || !data.password) {
      sendJson(res, 400, { message: 'Incomplete data.' });
      return;
    }

    try {
      await insertOne('users', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      sendJson(res, 201, { message: 'User created successfully.' });
    } catch (error) {
      sendJson(res, 500, { message: `Error: ${error.message}` });
    }
  });

  router.all('*', (req, res) => {
    methodNotAllowed(res);
  });

  return router;
}

app.use('/backend/api', createApiRouter());
app.use(createApiRouter());

app.use((req, res) => {
  if (req.path.startsWith('/backend/api') || req.path.endsWith('.php')) {
    sendJson(res, 404, { message: 'Not found.' });
    return;
  }

  res.status(404).sendFile(path.join(publicDir, '404.html'));
});

if (require.main === module) {
  connectAndSeed()
    .then(() => {
      const port = process.env.PORT || Number(config.backendPort) || 8000;
      app.listen(port, () => {
        console.log(`Twinsure Node server running on port ${port}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start Twinsure server:', error);
      process.exit(1);
    });
}

module.exports = {
  app,
  connectAndSeed,
  createApiRouter,
  config
};