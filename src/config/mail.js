/*
  Purpose: collect mail-related environment variables in one place so mail
  setup code can read a consistent config object.

  Useful commands:
  node --check src/config/mail.js
  node -e "console.log(require('./src/config/mail'))"
*/

module.exports = {
	enabled: Boolean(process.env.MAIL_HOST),
	host: process.env.MAIL_HOST || '',
	port: process.env.MAIL_PORT || '',
	secure: process.env.MAIL_SECURE === 'true',
	username: process.env.MAIL_USER || '',
	from: process.env.MAIL_FROM || ''
};