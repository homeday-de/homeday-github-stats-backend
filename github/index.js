const F = require ('fluture');
const analyze = require('./analyze');
const repositories = require('./repositories');

exports.analyze = analyze;
exports.repositories = ({ authorizationToken }) => {
  return new Promise ((resolve, reject) => {
    F.fork
      (reject)
      ((response) => {
        resolve (response);        
      })
      (repositories ({ authorizationToken }));
  });
};