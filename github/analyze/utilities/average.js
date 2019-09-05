const S = require('sanctuary');

const average = numbers => S.pipe ([
  S.sum,
  S.when (() => S.size (numbers) > 0) (x => Math.round (x / S.size (numbers))),
]) (numbers);

module.exports = average;
