import csv
from datetime import date
import re
from typing import Optional


CONFIRMED_CASES_PATH = 'COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv'


def load_us_confirmed():
    """Load the JHU confirmed COVID-19 case data

    The JHU CSV is a bunch of metadata headers, followed by one column per day.

    For each row, we yield a `dict` with the metadata only, plus one extra key:
    `'confirmed_cases_by_date'`, which is a mapping `Dict[date, int]`,
    date -> # of confirmed cases.
    """
    with open(CONFIRMED_CASES_PATH) as csv_file:
        reader = csv.DictReader(csv_file)
        for original_row in reader:
            modified_row = {}
            confirmed_cases = {}

            for k, v in original_row.items():
                k_as_date = _parse_jhu_date(k)
                if k_as_date is None:
                    # Not a date, just some metadata:
                    modified_row[k] = v
                else:
                    confirmed_cases[k_as_date] = int(v)

            modified_row['confirmed_cases_by_date'] = confirmed_cases
            yield modified_row


def _parse_jhu_date(s: str) -> Optional[date]:
    """Parses a JHU CSV date.

    JHU's CSVs contain dates in M/D/YY format. (Ugh.)

    Returns None if the given string isn't a date, or the date if it is.
    """

    match = _JHU_DATE_RE.match(s)
    if match is not None:
        month = int(match.group(1))
        day = int(match.group(2))
        year = 2000 + int(match.group(3))
        return date(year, month, day)
    else:
        return None


# Note: the regex isn't perfect.
_JHU_DATE_RE = re.compile('^([0-9]{1,2})/([0-9]{1,2})/([0-9]{2})$')
