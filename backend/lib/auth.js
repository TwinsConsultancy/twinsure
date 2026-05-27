/**
 * Extracts the authorization header from the incoming request.
 * Handles multiple common casing variations for the header name.
 * @param {Object} req - Express request object.
 * @returns {string} The authorization header value or an empty string if not found.
 */
function getAuthorizationHeader(req) {
  return req.get('Authorization') || req.get('authorization') || req.headers.authorization || req.headers.Authorization || '';
}

/**
 * Authenticates a request by verifying the base64 encoded JWT-like token.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object|null} The decoded user object if authenticated, null otherwise.
 */
function authenticate(req, res) {
  let authHeader = getAuthorizationHeader(req);

  if (authHeader) {
    authHeader = authHeader.replace(/^Bearer\s+/i, '');
    try {
      const decoded = JSON.parse(Buffer.from(authHeader, 'base64').toString('utf8'));
      if (decoded && decoded.role && decoded.exp > Math.floor(Date.now() / 1000)) {
        return decoded;
      }
    } catch (error) {
      // Fall through to unauthorized response.
    }
  }

  res.status(401).json({ message: 'Unauthorized access.' });
  return null;
}

/**
 * Middleware factory that enforces role-based access control.
 * @param {string} role - The required role (e.g., "admin").
 * @returns {Function} Express middleware function.
 */
function requireRole(role) {
  return (req, res, next) => {
    const user = authenticate(req, res);
    if (!user) {
      return;
    }

    if (user.role !== role) {
      res.status(403).json({ message: `Forbidden. Requires ${role} role.` });
      return;
    }

    req.user = user;
    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};