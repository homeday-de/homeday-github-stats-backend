const fetch = require ('node-fetch');
const F = require ('fluture');
const S = require ('sanctuary');
const $ = require ('sanctuary-def');
const dateFormat = require ('date-fns/format');

const fetchData = ({
  dateFrom,
  dateTo,
  githubUser,
  githubRepo,
  data = S.Just ([]),
  cursor = '',
  authorizationToken,
}) => {
  if (!dateFrom || !dateTo || !githubUser || !githubRepo) {
    return F.resolve (data);
  }

  const variables = {
    searchQuery: `
      type:pr
      is:merged
      repo:${githubUser}/${githubRepo}
      created:${dateFormat (dateFrom, 'yyyy-MM-dd')}..${dateFormat (dateTo, 'yyyy-MM-dd')}
      -author:app/dependabot-preview
      `.replace (/\n/g, ' '),
  };
  const query = `
    query ($searchQuery: String!) {
      search(
        type:ISSUE,
        query:$searchQuery,
        first:100,
        ${cursor ? `after:"${cursor}"` : ''}
      ) {
        nodes {
          ... on PullRequest {
            createdAt,
            closedAt,
            author {
              login
            },
            timelineItems(first:1, itemTypes:REVIEW_REQUESTED_EVENT) {
              nodes {
                ... on ReviewRequestedEvent {
                  createdAt
                }
              }
            },
            reviews(first:100) {
              nodes {
                createdAt,
                author {
                  login
                }
              }
            }
          }
        },
        pageInfo {
          endCursor,
          hasNextPage
        }
      }
    }
  `;

  return F ((reject, resolve) => {
    F.tryP (() => fetch (process.env.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `bearer ${authorizationToken}`,
      },
      body: JSON.stringify ({
        query,
        variables,
      }),
    }))
      .pipe (F.chain (F.encaseP (res => res.json ())))
      .fork (
        () => {
          reject ();
        },
        (response) => {
          const nodes = S.gets
            (S.is ($.Array ($.Object)))
            (['data', 'search', 'nodes'])
            (response);
          const hasNextPage = S.gets
            (S.is ($.Boolean))
            (['data', 'search', 'pageInfo', 'hasNextPage'])
            (response);
          const endCursor = S.gets
            (S.is ($.String))
            (['data', 'search', 'pageInfo', 'endCursor'])
            (response);

          const dataSoFar = S.concat(data)(nodes);

          if (S.fromMaybe (false) (hasNextPage)) {
            fetchData ({
              dateFrom,
              dateTo,
              githubUser,
              githubRepo,
              data: dataSoFar,
              cursor: S.fromMaybe ('') (endCursor),
              authorizationToken,
            }).fork (
              reject,
              resolve,
            );
            return;
          }

          resolve (dataSoFar);
        },
      );
  });
};

module.exports = fetchData;
