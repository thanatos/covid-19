clone-jhu:
	git clone 'https://github.com/CSSEGISandData/COVID-19.git'

update-jhu:
	(cd COVID-19 && git fetch && git rebase)

gnuplot:
	python3 process_data.py
html:
	python3 -m covid.make_html > page.html
