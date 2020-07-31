"""Population data.

US state population data is from:
https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States_by_population
…using the first table, the "Estimate, July 1, 2019" column.
"""

import csv
import pathlib
from typing import Dict, Optional, Tuple, Union

__all__ = ['load_state_data']


_MODULE_PATH = pathlib.Path(__file__)


class _PopDataDialect(csv.Dialect):
    delimiter = '\t'
    lineterminator = '\n'
    strict = True
    # The manual says these are "default" values, but Dialect raises if we
    # don't specify them?
    quoting = csv.QUOTE_MINIMAL
    quotechar = '"'


def load_state_data(
    file_path: Optional[Union[pathlib.Path, str]] = None,
) -> Dict[str, Tuple[str, int]]:
    """Load the US state population data from state_data.tsv.

    Returns a mapping of a state abbreviation to
    `(long state name, population)`
    """
    if file_path is None:
        file_path = _MODULE_PATH.parent / 'state_data.tsv'

    data = {}
    with open(file_path, 'r') as fileobj:
        reader = csv.reader(fileobj, dialect=_PopDataDialect())
        for abbrev, state_name, pop_str in reader:
            pop = int(pop_str.replace('_', ''))
            data[abbrev] = (state_name, pop)

    return data
