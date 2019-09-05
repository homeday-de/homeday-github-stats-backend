const ManagementClient = require ('auth0').ManagementClient;
const auth0 = new ManagementClient ({
  domain: process.env.AUTH0_BACKEND_DOMAIN,
  clientId: process.env.AUTH0_BACKEND_CLIENT_ID,
  clientSecret: process.env.AUTH0_BACKEND_CLIENT_SECRET,
});

module.exports = auth0;