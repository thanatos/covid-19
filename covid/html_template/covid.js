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

function render() {
	console.log('render() called.');

	// set the dimensions and margins of the graph
	var margin = {top: 10, right: 40, bottom: 75, left: 30};
	var width = 450 - margin.left - margin.right;
	var height = 400 - margin.top - margin.bottom;

	const svg_el = document.getElementById('chart');
	width = svg_el.clientWidth - margin.left - margin.right;
	height = svg_el.clientHeight - margin.top - margin.bottom;
	// append the svg object to the body of the page
	var svg = d3.select('#chart')
		//.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		// translate this svg element to leave some margin.
		.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);

	// X scale and Axis
	var x = d3.scaleTime()
		// This is the min and the max of the data: 0 to 100 if percentages
		.domain(d3.extent(DATA['NY'], (p) => p.t))
		//.domain([0, 100])
		// This is the corresponding value I want in Pixel
		.range([0, width]);

	svg
		.append('g')
		.attr('transform', `translate(0, ${height})`)
		.call(d3.axisBottom(x).tickFormat(formatIso))
		.selectAll("text")	
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", "-.15em")
		.attr("transform", "rotate(-65)");

	// Y scale and Axis
	let max_y = 0;
	for(k in DATA) {
		if(!hasOwnProp(DATA, k)) continue;
		const this_max = d3.max(DATA[k], (p) => p.v);
		if(max_y < this_max) {
			max_y = this_max;
		}
	}
	max_y *= 1.1;

	const total_states = (function(){
		let total = 0;
		for(k in DATA) {
			if(!hasOwnProp(DATA, k)) continue;
			total += 1;
		}
		return total;
	})();
	
	var y = d3.scaleLinear()
		// This is the min and the max of the data: 0 to 100 if percentages
		.domain([0, max_y])
		// This is the corresponding value I want in Pixel
		.range([height, 0]);

	svg
		.append('g')
		.call(d3.axisLeft(y));

	// Add the lines
	let index = 0;
	for(k in DATA) {
		if(!hasOwnProp(DATA, k)) continue;

		console.log(`Assigning index ${index} to ${k}`);
		const [color, shape] = getColorAndShape(index, total_states);
		const state_group = svg.append("g");
		state_group.attr("data-state", k);

		state_group.append("path")
			.datum(DATA[k])
			.attr("data-state", k)
			.attr("fill", "none")
			.attr("stroke", color)
			.attr("stroke-width", 2)
			.attr(
				"d",
				d3.line()
					.x((p) => x(p.t))
					.y((p) => y(p.v))
			);
		state_group.append("g")
			.attr("fill", color)
			.selectAll("contents")
			.data(DATA[k])
			.enter()
			.append("use")
			.attr("href", `#point-${shape}`)
			.attr("x", (p) => x(p.t))
			.attr("y", (p) => y(p.v));

		const last_value = DATA[k][DATA[k].length - 1];

		const group = state_group.append('g')
			.attr('class', 'label')
			.attr('transform', `translate(${width} ${y(last_value.v)})`);
		group
			.append('line')
			.attr('x1', '0')
			.attr('y1', '0')
			.attr('x2', '10')
			.attr('y2', '0');

		group
			.append('text')
			.attr('x', '10')
			.text(k);

		// Configure this state in the legend:
		const key_svg = document.querySelector(`#controls label[data-state="${k}"] .key`);
		const sw = key_svg.clientWidth;
		const sh = key_svg.clientHeight;
		const vb = `${0 - sw / 2} ${0 - sh / 2} ${sw} ${sh}`;
		const key_svg_d3 = d3.select(key_svg);
		key_svg_d3.attr('viewBox', vb);
		const key_svg_g = key_svg_d3.select('g');
		key_svg_g.select("path").attr("stroke", color);
		key_svg_g
			.append("use")
			.attr("href", `#point-${shape}`)
			.attr("fill", color);
		index += 1;
	}
        
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
	render();
});

function eventErrorWrap(fn) {
	try {
		fn()
	} catch(err) {
		console.log(err);
	}
	return false;
}