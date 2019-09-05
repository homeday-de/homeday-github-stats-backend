const S = require ('sanctuary');
const F = require ('fluture');
const fetchData = require ('./fetch-data');
const average = require ('../../utilities/average');
const unique = require ('../../utilities/unique');
const differenceInWorkMinutes = require ('../../utilities/differenceInWorkMinutes');
const {
  createdAt,
  closedAt,
  author,
  reviewRequestedAt,
} = require ('../../utilities/pr');

const firstReviewTimestamp = ({ ifEmpty = () => S.Nothing } = {}) => (pr) => S.pipe ([
  S.props (['reviews', 'nodes']),
  S.filter (S.pipe ([
    author,
    S.equals (author (pr)),
    S.not,
  ])),
  S.head,
  S.maybe
    (ifEmpty (pr))
    (createdAt),
])(pr);
const secondReviewTimestamp = ({ ifEmpty = () => S.Nothing } = {}) => (pr)  => S.ifElse
  (S.pipe ([
    S.props (['reviews', 'nodes']),
    S.filter (S.pipe ([
      author,
      S.equals (author (pr)),
      S.not,
    ])),
    unique (author),
    S.size,
    S.gte (2),
  ]))
  (S.pipe ([
    S.props (['reviews', 'nodes']),
    S.filter (S.pipe ([
      author,
      S.equals (author (pr)),
      S.not,
    ])),
    unique (author),
    S.tail,
    S.maybeToNullable,
    S.head,
    S.maybe
      (ifEmpty (pr))
      (createdAt),
  ]))
  (() => ifEmpty (pr))
  (pr);

S.pipe ([
  S.props (['reviews', 'nodes']),
  S.head,
  S.maybe
    (S.Nothing)
    (createdAt),
]);
const reviewWaitTime = reviewTime => S.pipe ([
  S.filter (S.pipe ([reviewTime, S.isJust])),
  S.map
    (record => differenceInWorkMinutes
      (new Date (S.maybeToNullable (reviewTime (record))))
      (new Date (S.maybeToNullable (
        S.ifElse
          (S.pipe ([
            reviewRequestedAt,
            S.isNothing,
          ]))
          (createdAt)
          (reviewRequestedAt)
          (record),
      )))
    ),
]);
const averageReviewWaitTime = reviewTime => S.pipe ([
  reviewWaitTime (reviewTime),
  average,
]);
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
  .pipe (
    F.map((data) => {
      // We take into account only those pull requests for which a review
      // was actually requested
      const dataset = S.filter (
        S.pipe ([
          reviewRequestedAt,
          S.isNothing,
          S.not,
        ])
      ) (S.fromMaybe ([]) (data));

      // Average time we wait until a PR gets a first review
      const averageFirstReviewWaitTime = averageReviewWaitTime
        (firstReviewTimestamp ({ ifEmpty: closedAt }))
        (dataset);

      // Average time we wait until a PR gets a second review
      const averageSecondReviewWaitTime = averageReviewWaitTime
        (secondReviewTimestamp ({ ifEmpty: closedAt }))
        (dataset);

      // Number of PRs that were not reviewed
      const numberOfReviewedPrs = S.pipe
        ([
          reviewWaitTime (firstReviewTimestamp ()),
          S.size,
        ])
        (dataset);
      const numberOfUnreviewedPrs = S.size (dataset) - numberOfReviewedPrs;

      // Number of PRs that get 1 review in <= 48 hrs
      const numberOfPrsReviewedOnceIn48Hours = S.pipe
        ([
          reviewWaitTime (firstReviewTimestamp ()),
          S.filter (S.lte (48 * 60)),
          S.size,
        ])
        (dataset);

      // Percentage of PRs that get 1 review in <= 48 hrs
      const percentageOfPrsReviewedOnceIn48Hours = S.size (dataset) === 0
        ? 0
        : numberOfPrsReviewedOnceIn48Hours / S.size (dataset);

      // Number of PRs that get 2 reviews in <= 48 hrs
      const numberOfPrsReviewedTwiceIn48Hours = S.pipe
        ([
          reviewWaitTime (secondReviewTimestamp ()),
          S.filter (S.lte (48 * 60)),
          S.size,
        ])
        (dataset);

      // Percentage of PRs that get 2 reviews in <= 48 hrs
      const percentageOfPrsReviewedTwiceIn48Hours = S.size (dataset) === 0
        ? 0
        : numberOfPrsReviewedTwiceIn48Hours / S.size (dataset);

      return {
        $meta: {
          name: 'Pull requests review time'
        },
        averageFirstReviewWaitTime: {
          name: 'Average first review wait time',
          value: averageFirstReviewWaitTime,
          formattedValue: `${(averageFirstReviewWaitTime / 60).toFixed (2)} hour(s)`
        },
        averageSecondReviewWaitTime: {
          name: 'Average second review wait time',
          value: averageSecondReviewWaitTime,
          formattedValue: `${(averageSecondReviewWaitTime / 60).toFixed (2)} hour(s)`
        },
        numberOfPrsReviewedOnceIn48Hours: {
          name: 'Number of PRs reviewed at least once in 48 hours',
          value: numberOfPrsReviewedOnceIn48Hours,
          formattedValue: `${numberOfPrsReviewedOnceIn48Hours} PR(s)`
        },
        percentageOfPrsReviewedOnceIn48Hours: {
          name: 'Percentage of PRs reviewed at least once in 48 hours',
          value: percentageOfPrsReviewedOnceIn48Hours,
          formattedValue: `${Math.round (percentageOfPrsReviewedOnceIn48Hours * 100)}%`,
        },
        numberOfPrsReviewedTwiceIn48Hours: {
          name: 'Number of PRs reviewed at least twice in 48 hours',
          value: numberOfPrsReviewedTwiceIn48Hours,
          formattedValue: `${numberOfPrsReviewedTwiceIn48Hours} PR(s)`
        },
        percentageOfPrsReviewedTwiceIn48Hours: {
          name: 'Percentage of PRs reviewed at least twice in 48 hours',
          value: percentageOfPrsReviewedTwiceIn48Hours,
          formattedValue: `${Math.round (percentageOfPrsReviewedTwiceIn48Hours * 100)}%`,
        },
        numberOfUnreviewedPrs: {
          name: 'Number of PRs that have never received a review',
          value: numberOfUnreviewedPrs,
          formattedValue: `${numberOfUnreviewedPrs} PR(s)`
        },
      };
    })
  );

module.exports = analyze;
