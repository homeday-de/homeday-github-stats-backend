const unique = transform => items => items.reduce ((acc, current) => {
  if (acc.some (x => transform (x) === transform (current))) {
    return acc;
  }

  return [...acc, current];
}, []);

module.exports = unique;
