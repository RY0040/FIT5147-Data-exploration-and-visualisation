// set the dimensions and margins of the graph
const margin = { top: 20, right: 10, bottom: 20, left: 0 },
  width = document.querySelector("#Page5_graph").clientWidth - margin.left - margin.right,
  // height = document.querySelector("#Page5_graph").clientWidth / 2;
  height = 600;

var tickDuration = 2000;
var top_n = 10;
let barPadding = (height - (margin.bottom + margin.top)) / (top_n * 5);
var year = 2013;

// append the svg object to the body of the page
const svg = d3
  .select("#Page5_graph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("data/Page5_Property_lost_value.csv").then(function (data) {
  const color = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.name))
    .range(d3.schemeCategory10);
  data.forEach((d) => {
    (d.value = +d.value), (d.lastValue = +d.lastValue), (d.value = d.value), (d.year = +d.year), (d.color = color(d.name));
  });

  let yearSlice = data
    .filter((d) => d.year == year)
    .sort((a, b) => b.value - a.value)
    .slice(0, top_n);

  yearSlice.forEach((d, i) => (d.rank = i));

  // 定义x轴和y轴比例尺
  let x = d3
    .scaleLog()
    .domain([1, d3.max(yearSlice, (d) => d.value)])
    .range([margin.left, width - margin.right - 65]);

  let y = d3
    .scaleLinear()
    .domain([top_n, 0])
    .range([height - margin.bottom, margin.top]);

  // 添加x轴
  const xAxis = d3
    .axisTop(x)
    .ticks(width > 500 ? 5 : 2)
    .tickSize(-(height - margin.top - margin.bottom))
    .tickFormat(d3.format(","))
    .tickValues(x.ticks().filter((tick) => Number.isInteger(Math.log10(tick))));

  svg
    .append("g")
    .attr("class", "axis xAxis")
    .attr("transform", `translate(0, ${margin.top})`)
    .call(xAxis)
    .selectAll(".tick line")
    .classed("origin", (d) => d == 0);

  svg
    .selectAll("rect.bar")
    .data(yearSlice, (d) => d.name)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", x(1) + 1)
    .attr("width", (d) => x(d.value) - x(1) - 1)
    .attr("y", (d) => y(d.rank) + 5)
    .attr("height", y(1) - y(0) - barPadding)
    .style("fill", (d) => d.color);

  svg
    .selectAll("text.label")
    .data(yearSlice, (d) => d.name)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => x(d.value) - 8)
    .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
    .style("text-anchor", "end")
    .html((d) => d.name);

  svg
    .selectAll("text.valueLabel")
    .data(yearSlice, (d) => d.name)
    .enter()
    .append("text")
    .attr("class", "valueLabel")
    .attr("x", (d) => x(d.value) + 5)
    .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
    .text((d) => d3.format(",.0f")(d.lastValue));

  let yearText = svg
    .append("text")
    .attr("class", "yearText")
    .attr("x", width - margin.right)
    .attr("y", height - 25)
    .style("text-anchor", "end")
    .html(~~year);
  // .call(YearCaption, year, 10);

  year = d3.format(".1f")(+year + 1);
  let ticker = d3.interval((e) => {
    yearSlice = data
      .filter((d) => d.year == year && !isNaN(d.value))
      .sort((a, b) => b.value - a.value)
      .slice(0, top_n);

    yearSlice.forEach((d, i) => (d.rank = i));

    x.domain([1, d3.max(yearSlice, (d) => d.value)]);

    svg.select(".xAxis").transition().duration(tickDuration).ease(d3.easeLinear).call(xAxis);

    let bars = svg.selectAll(".bar").data(yearSlice, (d) => d.name);

    bars
      .enter()
      .append("rect")
      .attr("class", (d) => `bar ${d.name.replace(/\s/g, "_")}`)
      .attr("x", x(1) + 1)
      .attr("width", (d) => x(d.value) - x(1) - 1)
      .attr("y", (d) => y(top_n + 1) + 5)
      .attr("height", y(1) - y(0) - barPadding)
      .style("fill", (d) => d.color)
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("y", (d) => y(d.rank) + 5);

    bars
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("width", (d) => x(d.value) - x(1) - 1)
      .attr("y", (d) => y(d.rank) + 5);

    bars
      .exit()
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("width", (d) => x(d.value) - x(1) - 1)
      .attr("y", (d) => y(top_n + 1) + 5)
      .remove();

    let labels = svg.selectAll(".label").data(yearSlice, (d) => d.name);

    labels
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.value) - 8)
      .attr("y", (d) => y(top_n + 1) + 5 + (y(1) - y(0)) / 2)
      .style("text-anchor", "end")
      .html((d) => d.name)
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

    labels
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", (d) => x(d.value) - 8)
      .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

    labels
      .exit()
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", (d) => x(d.value) - 8)
      .attr("y", (d) => y(top_n + 1) + 5)
      .remove();

    let valueLabels = svg.selectAll(".valueLabel").data(yearSlice, (d) => d.name);

    valueLabels
      .enter()
      .append("text")
      .attr("class", "valueLabel")
      .attr("x", (d) => x(d.value) + 5)
      .attr("y", (d) => y(top_n + 1) + 5)
      .text((d) => d3.format(",.0f")(d.lastValue))
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1);

    valueLabels
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", (d) => x(d.value) + 5)
      .attr("y", (d) => y(d.rank) + 5 + (y(1) - y(0)) / 2 + 1)
      .tween("text", function (d) {
        let i = d3.interpolateRound(d.lastValue, d.value);
        return function (t) {
          this.textContent = d3.format(",")(i(t));
        };
      });

    valueLabels
      .exit()
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", (d) => x(d.value) + 5)
      .attr("y", (d) => y(top_n + 1) + 5)
      .remove();
    yearText.html(~~year);
    if (year == 2022) ticker.stop();
    year = d3.format(".1f")(+year + 1);
  }, tickDuration);
});
const YearCaption = function (text, year, strokeWidth) {
  text
    .select(function () {
      return this.parentNode.insertBefore(this.cloneNode(true), this);
    })
    .style("fill", "#ffffff")
    .style("stroke", "#ffffff")
    .style("stroke-width", strokeWidth)
    .style("stroke-linejoin", "round")
    .style("opacity", 1);
};
