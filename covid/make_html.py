import argparse
import contextlib
import csv
import io
import json
import os
import pathlib
import re

from . import jhu_data, pop_data


STATE_DATA = pop_data.load_state_data()

PLOT_STATES = sorted(STATE_DATA)

# Ordered list of days we have data for:
data_days = None

with contextlib.closing(jhu_data.load_us_confirmed()) as jhu_confirmed:
    # dict[province][date]
    parsed_data = {}
    for row in jhu_confirmed:
        if data_days is None:
            data_days = sorted(row['confirmed_cases_by_date'])

        province = row['Province_State']
        if province in parsed_data:
            province_data = parsed_data[province]
        else:
            province_data = {}
            parsed_data[province] = province_data

        for date, count in row['confirmed_cases_by_date'].items():
            province_data[date] = province_data.get(date, 0) + count

output_section = io.StringIO()
output_section.write('const STATES = ');
json.dump(
    list([abbrev, name] for abbrev, (name, _) in sorted(STATE_DATA.items())),
    output_section,
)
output_section.write(';\n')

output_section.write('let DATA = {\n')
for abbrev in PLOT_STATES:
    output_section.write(f'\t{json.dumps(abbrev)}: [\n')
    province, population = STATE_DATA[abbrev]
    for date in data_days:
        date_js = f'new Date({date.year}, {date.month} - 1, {date.day})'
        value = parsed_data[province][date] / population * 100
        output_section.write(f'\t\t{{t: {date_js}, v: {value}}},\n')
    output_section.write('\t],\n')
output_section.write('};\n')

_MODULE = pathlib.Path(__file__).parent
_TEMPLATE_DIR = _MODULE / 'html_template'

def copy_file(src, dst):
    dst.write_bytes(src.read_bytes())


parser = argparse.ArgumentParser()
parser.add_argument('output_dir')
args = parser.parse_args()

output_dir = pathlib.Path(args.output_dir)
if not output_dir.exists():
    os.mkdir(output_dir)

(output_dir / 'covid_data.js').write_text(output_section.getvalue())

copy_file(_TEMPLATE_DIR / 'covid.js', output_dir / 'covid.js')
copy_file(_TEMPLATE_DIR / 'graph.js', output_dir / 'graph.js')
copy_file(_TEMPLATE_DIR / 'confirmed_cases_template.html', output_dir / 'page.html')
