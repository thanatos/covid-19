import contextlib
import csv
import re
import subprocess

from covid import jhu_data, pop_data


STATE_DATA = pop_data.load_state_data()

# Note: you can edit this array to only plot certain states:
PLOT_STATES = sorted(STATE_DATA)
# PLOT_STATES = ['LA', 'NY']

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

with open('processed.tsv', 'w') as processed:
    for date in data_days:
        counts = {}
        count_by_province = {}
        date_str = '{}-{:02}-{:02}'.format(date.year, date.month, date.day)
        cells = [date_str]
        for abbrev in PLOT_STATES:
            province, population = STATE_DATA[abbrev]
            cells.append(parsed_data[province][date] / population * 100)

        print('\t'.join(str(c) for c in cells), file=processed)

def windows_2(it):
    it = iter(it)
    last = next(it)
    for i in it:
        yield last, i
        last = i

with open('per-day-change.tsv', 'w') as processed:
    for yesterday, today in windows_2(data_days):
        counts = {}
        count_by_province = {}
        date_str = '{}-{:02}-{:02}'.format(today.year, today.month, today.day)
        cells = [date_str]
        for abbrev in PLOT_STATES:
            province, population = STATE_DATA[abbrev]
            new_cases = parsed_data[province][today] - parsed_data[province][yesterday]
            cells.append(new_cases / population * 100)

        print('\t'.join(str(c) for c in cells), file=processed)

BASE_COMMANDS = '''\
set timefmt '%Y-%m-%d'
set xdata time
set format x "%b %d"
set key outside
set pointsize 0.3
set ylabel "Confirmed cases per 100 persons"
set term svg size 1000, 500
'''

with open('plot.gnuplot', 'w') as plot_file:
    plot_file.write(BASE_COMMANDS)
    print('plot \\', file=plot_file)
    plot_lines = []
    for idx, st_abbrev in enumerate(PLOT_STATES):
        plot_lines.append(f"\t'processed.tsv' using 1:{idx+2} title '{st_abbrev}',")
    plot_file.write(' \\\n'.join(plot_lines))
    plot_file.write('\n')

with open('plot.svg', 'wb') as output_file:
    subprocess.run(
        ('gnuplot', '-c', 'plot.gnuplot'),
        stdout=output_file,
    )


with open('per-day-change.gnuplot', 'w') as plot_file:
    plot_file.write(BASE_COMMANDS)
    print('plot \\', file=plot_file)
    plot_lines = []
    for idx, st_abbrev in enumerate(PLOT_STATES):
        plot_lines.append(f"\t'per-day-change.tsv' using 1:{idx+2} title '{st_abbrev}',")
    plot_file.write(' \\\n'.join(plot_lines))
    plot_file.write('\n')

with open('per-day-change.svg', 'wb') as output_file:
    subprocess.run(
        ('gnuplot', '-c', 'per-day-change.gnuplot'),
        stdout=output_file,
    )
