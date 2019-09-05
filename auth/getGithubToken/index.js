const auth0 = require ('../client');
const auth0Management = require ('../managementClient');

const getGithubToken = async ({ authorizationToken }) => {
  let profile;

  try {
    profile = await auth0.getProfile (authorizationToken);
  } catch (e) {
    return null;
  }

  if (profile === 'Unauthorized') {
    return null;
  }

  const fullUser = await auth0Management.getUser ({ id: profile.sub });

  const githubIdentity = fullUser.identities.find(
    identity => identity.connection === 'github',
  );

  if (githubIdentity === undefined) {
    return null;
  }

  return githubIdentity.access_token;
};

module.exports = getGithubToken;