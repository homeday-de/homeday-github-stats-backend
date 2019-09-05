const F = require ('fluture');
const S = require ('sanctuary');
const $ = require ('sanctuary-def');
const Octokit = require ('@octokit/rest');

const getRepositories = ({
  data = S.Just ([]),
  authorizationToken,
}) => {
  const octokit = Octokit ({
    auth: `bearer ${authorizationToken}`,
  });

  return F ((reject, resolve) => {
    F.tryP (() => octokit.paginate('GET /user/repos'))
      .fork (
        () => {
          reject ();
        },
        (response) => {
          resolve (response);
        },
      );
  });
};

module.exports = getRepositories;
