// set the dimensions and margins of the graph
const margin = { top: 20, right: 20, bottom: 20, left: 50 },
  width = document.querySelector("#Page3_graph").clientWidth - margin.left - margin.right,
  height = document.querySelector("#Page3_graph").clientWidth / 2;

// append the svg object to the body of the page
const svg = d3
  .select("#Page3_graph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse the Data
d3.csv("data/Page3.csv").then(function (data) {
  // List of subgroups = header of the csv files = soil condition here
  const subgroups = data.columns.slice(1);

  // List of groups = species here = value of the first column called group -> I show them on the X axis
  const groups = data.map((d) => d.year);

  // Add X axis
  const x = d3.scaleBand().domain(groups).range([0, width]).padding([0.2]);
  svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x).tickSizeOuter(0));

  // Add Y axis
  const y = d3.scaleLinear().domain([0, 3200]).range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // color palette = one color per subgroup
  const color = d3.scaleOrdinal().domain(subgroups).range(["#dc267f", "#fe6100", "#ffb000"]);

  //stack the data? --> stack per subgroup
  const stackedData = d3.stack().keys(subgroups)(data);

  // ----------------
  // Create a tooltip
  // ----------------
  const tooltip = d3.select("#Page3_graph").append("div").style("visibility", "hidden").attr("class", "tooltip");

  const desc_dict = {
    "B30": "B30 Burglary/Break and enter",
    "B40": "B40 Theft",
    "Other": "Other offence subdivisions"
  };
  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function (event, d) {
    const subgroupName = d3.select(this.parentNode).datum().key;
    const subgroupValue = d.data[subgroupName];
    tooltip
      .html(desc_dict[subgroupName] + ": " + subgroupValue)
      .style("visibility", "visible")
      .style("left", event.pageX + "px")
      .style("top", event.pageY - 10 + "px");
  };
  const mousemove = function (event, d) {
    tooltip
      .style("transform", "translate(-0%, -60%)")
      .style("visibility", "visible")
      .style("left", event.pageX + "px")
      .style("top", event.pageY - 30 + "px");
  };
  const mouseleave = function (event, d) {
    tooltip.style("visibility", "hidden");
  };

  // Show the bars
  svg
    .append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .join("g")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    // enter a second time = loop subgroup per subgroup to add all rectangles
    .data((d) => d)
    .join("rect")
    .attr("x", (d) => x(d.data.year))
    .attr("y", (d) => y(d[0]))
    .attr("width", x.bandwidth())
    .attr("height", (d) => 0)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

  const observer = new IntersectionObserver((entries) => {
    // 对于每个观察到的元素
    entries.forEach((entry) => {
      // 如果元素进入视口, 先清零高度
      if (entry.isIntersecting) {
        svg
          .selectAll("rect")
          .attr("y", (d) => y(d[0]))
          .attr("height", (d) => 0);
        // 显示柱形图动画
        svg
          .selectAll("g")
          .selectAll("rect")
          .transition()
          .duration(500)
          .attr("y", (d) => y(d[1]))
          .attr("height", (d) => y(d[0]) - y(d[1]))
          .delay((d, i) => {
            return i * 100;
          });
      }
    });
  }).observe(document.querySelector("#Page3_graph"));
});
