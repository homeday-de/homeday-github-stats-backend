const getAuthorizationToken = (authHeader) => {
  const headerSplit = authHeader.split (' ');

  if (headerSplit.length === 0) {
    return '';
  }

  const [token] = headerSplit.slice (-1);
  return token;
};

module.exports = getAuthorizationToken;