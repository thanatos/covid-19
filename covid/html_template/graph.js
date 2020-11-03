class TimeSeriesGraph {
	constructor(svg_el) {
		this.svg_ = svg_el;
		this.render_();
	}

	render_() {
		console.log('render() called.');

		// set the dimensions and margins of the graph
		var margin = {top: 10, right: 40, bottom: 75, left: 30};
		var width = 450 - margin.left - margin.right;
		var height = 400 - margin.top - margin.bottom;

		width = this.svg_.clientWidth - margin.left - margin.right;
		height = this.svg_.clientHeight - margin.top - margin.bottom;
		// append the svg object to the body of the page
		var svg_d3 = d3.select(this.svg_)
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

		svg_d3
			.append('g')
			.attr('transform', `translate(0, ${height})`)
			.attr('class', 'y-axis')
			.call(d3.axisBottom(x).tickFormat(formatIso))
			.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", "-.15em")
			.attr("transform", "rotate(-65)");

		// Y scale and Axis
		let max_y = 0;
		for(var k in DATA) {
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

		svg_d3
			.append('g')
			.attr('class', 'x-axis')
			.call(d3.axisLeft(y));

		// Add the lines
		let index = 0;
		for(var k in DATA) {
			if(!hasOwnProp(DATA, k)) continue;

			console.log(`Assigning index ${index} to ${k}`);
			const [color, shape] = getColorAndShape(index, total_states);
			const state_group = svg_d3.append("g");
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
}
