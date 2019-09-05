const AuthenticationClient = require ('auth0').AuthenticationClient;
const auth0 = new AuthenticationClient ({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
});

module.exports = auth0;