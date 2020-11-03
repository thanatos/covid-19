function hasOwnProp(obj, k) {
	return Object.prototype.hasOwnProperty.call(obj, k);
}

function formatIso(t) {
	let month = t.getMonth() + 1;
	if(month < 10) {
		month = `0${month}`;
	}
	let day = t.getDate();
	if(day < 10) {
		day = `0${day}`;
	}
	return `${t.getFullYear()}-${month}-${day}`;
}

function getColorAndShape(n, total) {
	const required_colors = Math.ceil(total / 5 / 2);
	const light_or_dark = n % 2;
	n = Math.floor(n / 2);
	const color_index = n % required_colors;
	const shape_index = Math.floor(n / required_colors);
	const hue_frac = (1 / required_colors) * color_index;
	const hue = `${hue_frac}turn`;
	let hsl = "";
	if(light_or_dark == 0) {
		hsl = `hsl(${hue}, 100%, 50%)`;
	} else {
		hsl = `hsl(${hue}, 100%, 25%)`;
	}
	return [hsl, shape_index];
}

function makeStateControls() {
	let is_first = true;
	const form = document.getElementById('controls');
	for(const [abbreviation, name] of STATES) {
		if(is_first) {
			is_first = false;
		} else {
			// Newlines go…
			const br = document.createElement('br');
			form.appendChild(br);
		}
		const checkbox = document.createElement('input');
		checkbox.setAttribute('type', 'checkbox');
		checkbox.setAttribute('data-check-type', 'state-toggle');
		checkbox.checked = true;

		const key = document.createElementNS(SVG_NS, 'svg');
		key.setAttribute('class', 'key');
		const key_g = document.createElementNS(SVG_NS, 'g');
		key.appendChild(key_g);
		const path = document.createElementNS(SVG_NS, 'path');
		key_g.appendChild(path);
		path.setAttribute('stroke-width', '2');
		path.setAttribute('d', 'M-10,0L10,0');

		const label = document.createElement('label');
		label.setAttribute('data-state', abbreviation);
		label.appendChild(checkbox);
		label.appendChild(key);
		label.appendChild(
			document.createTextNode(`${abbreviation} — ${name}`)
		);
		label.addEventListener('mouseover', stateControlOnMouseOver);
		label.addEventListener('mouseout', stateControlOnMouseOut);
		checkbox.addEventListener('input', stateControlOnInput);
		form.appendChild(label);
	}
}

function pathOpacity(selection, opacity) {
	console.log(`pathOpacity(_, ${opacity})`);
	selection.transition().style("opacity", opacity ? 1 : 0);
}

function pathThickness(selection, thick) {
	selection.attr('stroke-width', thick ? 3 : 2);
}

function stateControlOnMouseOver(event) {
	const state = this.getAttribute('data-state');
	const path = d3.select('#chart').select(`g[data-state="${state}"] > path`);
	pathThickness(path, true);
}

function stateControlOnMouseOut(event) {
	const state = this.getAttribute('data-state');
	const path = d3.select('#chart').select(`g[data-state="${state}"] > path`);
	pathThickness(path, false);
}

function stateControlOnInput(event) {
	const state = this.parentElement.getAttribute('data-state');
	const path = d3.select('#chart').select(`g[data-state="${state}"]`);
	pathOpacity(path, this.checked);
}

function selectAllOrNone(new_state) {
	const form = document.getElementById('controls');
	const checkboxes = form.querySelectorAll('input[type="checkbox"][data-check-type="state-toggle"]');
	for(const checkbox of checkboxes) {
		const state = checkbox.parentElement.getAttribute('data-state');
		const path = d3.select('#chart').select(`g[data-state="${state}"]`);
		pathOpacity(path, new_state);
		checkbox.checked = new_state;
	}
}

const SVG_NS = 'http://www.w3.org/2000/svg';

document.addEventListener('DOMContentLoaded', (event) => {
	makeStateControls();
	new TimeSeriesGraph(document.getElementById('chart'));
});

function eventErrorWrap(fn) {
	try {
		fn()
	} catch(err) {
		console.log(err);
	}
	return false;
}
