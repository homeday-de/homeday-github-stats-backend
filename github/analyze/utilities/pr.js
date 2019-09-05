const S = require ('sanctuary');

const createdAt = S.pipe ([
  S.prop ('createdAt'),
  S.Just,
]);
const closedAt = S.pipe ([
  S.prop ('closedAt'),
  S.Just,
]);
const author = S.props (['author', 'login']);
const reviewRequestedAt = S.pipe ([
  S.props (['timelineItems', 'nodes']),
  S.head,
  S.maybe
    (S.Nothing)
    (createdAt),
]);

exports.createdAt = createdAt;
exports.closedAt = closedAt;
exports.author = author;
exports.reviewRequestedAt = reviewRequestedAt;
