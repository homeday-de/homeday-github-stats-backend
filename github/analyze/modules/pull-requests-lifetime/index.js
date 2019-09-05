const S = require ('sanctuary');
const F = require ('fluture');
const fetchData = require ('./fetch-data');
const average = require ('../../utilities/average');
const differenceInWorkMinutes = require ('../../utilities/differenceInWorkMinutes');
const { reviewRequestedAt } = require ('../../utilities/pr');

const analyze = ({
  dateFrom,
  dateTo,
  githubUser,
  githubRepo,
  authorizationToken,
}) => fetchData ({
  dateFrom,
  dateTo,
  githubUser,
  githubRepo,
  authorizationToken,
})
  .pipe(
    F.map ((data) => {
      // Calculations we are interested in

      // Average time before any opened PR is closed
      const averageLifetime = S.pipe([
        S.map
          (record => differenceInWorkMinutes
            (new Date (S.prop ('closedAt') (record)))
            (new Date (S.prop ('createdAt') (record)))
          ),
        average,
      ])(S.fromMaybe([])(data));

      const prsWhereReviewWasRequested = S.filter (
        S.pipe ([
          reviewRequestedAt,
          S.isNothing,
          S.not,
        ])
      ) (S.fromMaybe ([]) (data));

      const averageLifetimeWhereReviewRequested = S.pipe([
        S.map
          (record => differenceInWorkMinutes
            (new Date (S.prop ('closedAt') (record)))
            (new Date (S.prop ('createdAt') (record)))
          ),
        average,
      ])(prsWhereReviewWasRequested);

      return {
        $meta: {
          name: 'Pull requests lifetime',
        },
        averageLifetime: {
          name: 'Average lifetime of all merged pull requests',
          value: averageLifetime,
          formattedValue: `${(averageLifetime / 60).toFixed (2)} hour(s)`
        },
        averageLifetimeWhereReviewRequested: {
          name: 'Average lifetime of merged pull requests where review was requested',
          value: averageLifetimeWhereReviewRequested,
          formattedValue: `${(averageLifetimeWhereReviewRequested / 60).toFixed (2)} hour(s)`
        },
      };
    })
  );

module.exports = analyze;
