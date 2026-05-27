/*
  Purpose: keep shared app constants in one place so the rest of the project
  can reference the same role names and collection list.

  Useful commands:
  node --check src/constants/index.js
  node -e "console.log(require('./src/constants'))"
*/

module.exports = {
	roles: {
		admin: 'admin',
		user: 'user',
		partner: 'partner',
		employee: 'employee'
	},
	collections: ['users', 'services', 'partners', 'recommendation_questions', 'leads', 'form_help_requests', 'settings', 'contacts', 'claims']
};