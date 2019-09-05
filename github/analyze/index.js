const F = require ('fluture');
const dateFormat = require('date-fns/format');
const pullRequestsLifetime = require ('./modules/pull-requests-lifetime');
const pullRequestsReviewTime = require ('./modules/pull-requests-review-time');

const analyze = ({
  user,
  repo,
  dateFrom,
  dateTo,
  authorizationToken,
}) => {
  return new Promise ((resolve, reject) => {
    F.fork
      (reject)
      ((analyses) => {
        const response = {
          repository: {
            user: user,
            name: repo,
          },
          date: {
            from: dateFrom,
            to: dateTo,
          },
          analyses: analyses.map((analysis, i) => {
            const { name } = analysis.$meta;
            const results = Object.keys (analysis).reduce ((acc, key) => {
              if (key === '$meta') {
                return acc;
              }
    
              return [
                ...acc,
                {
                  name: analysis[key].name,
                  value: analysis[key].formattedValue,
                },
              ];
            }, []);
    
            return {
              name,
              results,
            };
          }),
        };
    
        resolve (response);        
      })
      (F.parallel (2) ([
        pullRequestsLifetime ({
          dateFrom: new Date (dateFrom),
          dateTo: new Date(dateTo),
          githubUser: user,
          githubRepo: repo,
          authorizationToken,
        }),
        pullRequestsReviewTime ({
          dateFrom: new Date (dateFrom),
          dateTo: new Date(dateTo),
          githubUser: user,
          githubRepo: repo,
          authorizationToken,
        }),
      ]))
  });
};

module.exports = analyze;