const dateDifferenceInMinutes = require ('date-fns/differenceInMinutes');
const dateIsAfter = require ('date-fns/isAfter');
const dateAddDay = require ('date-fns/addDays');
const dateIsWeekend = require ('date-fns/isWeekend');

const DAY_IN_MINUTES = 60 * 24;

const differenceInWorkMinutes = (dateEnd) => (dateStart) => {
  let difference = dateDifferenceInMinutes (dateEnd, dateStart);

  if (difference < 2 * DAY_IN_MINUTES) {
    return difference;
  }

  let modifiedStartDate = dateStart;

  while (dateIsAfter (dateEnd, modifiedStartDate)) {
    modifiedStartDate = dateAddDay (modifiedStartDate, 1);

    if (dateIsWeekend (modifiedStartDate)) {
      difference -= DAY_IN_MINUTES;
    }
  }

  return difference;
};

module.exports = differenceInWorkMinutes;
