// set the dimensions and margins of the graph
const margin = { top: 20, right: 20, bottom: 20, left: 50 },
  width = document.querySelector("#Page4_graph").clientWidth - margin.left - margin.right,
  height = document.querySelector("#Page4_graph").clientWidth / 2;

// append the svg object to the body of the page
var svg = d3
  .select("#Page4_graph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

function update(data, selected_LGA) {}

function draw(svg, data, selected_LGA) {}

//Read the data
d3.csv("data/Page4.csv").then(function (data) {
  // 将LGA列的值整合为一个无重复的列表
  const LGA_array = Array.from(new Set(data.map((d) => d.LGA)));

  var selected_LGA = LGA_array; // 默认值为全选

  const filteredData = data.filter(function (d) {
    return selected_LGA.includes(d.LGA);
  });

  let newData = Array.from(
    // 将Year, Subgroup列为相同值的行合并，并将Count列的值相加
    d3.group(
      filteredData,
      (d) => d.Year,
      (d) => d.Subgroup
    ),
    ([key1, values1]) => ({
      Year: key1,
      values: Array.from(values1, ([key2, values2]) => ({
        Subgroup: key2,
        Count: d3.sum(values2, (d) => d.Count),
      })),
    })
  ).flatMap((d) => d.values.map((e) => ({ Year: d.Year, Subgroup: e.Subgroup, Count: e.Count })));

  // group the data: I want to draw one line per group
  let subgroupedData = d3.group(newData, (d) => d.Subgroup);

  // Add X axis --> it is a date format
  const x = d3
    .scaleLinear()
    .domain(
      d3.extent(newData, function (d) {
        return d.Year;
      })
    )
    .range([0, width]);
  svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x).tickSizeOuter(0));

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(newData, function (d) {
        return +d.Count;
      }),
    ])
    .range([height, 0]);
  svg.append("g").attr("class", "yAxis").call(d3.axisLeft(y));

  // color palette
  const color = d3.scaleOrdinal().range(["#56b4e9", "#009e73", "#d55e00", "#0072b2"]);

  const tooltip = d3.select("#Page4_graph").append("div").style("visibility", "hidden").attr("class", "tooltip");
  const mouseover = function (event, d) {
    let x0 = x.invert(event.offsetX);
    let years = d[1].map((d) => +d.Year).reverse();
    let idx = Math.min(d3.bisect(years, x0), years.length - 1);
    tooltip
      .html(d[0] + "<br/>" + d[1][years.length - idx].Year + ": " + d[1][years.length - idx].Count)
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

  // Draw the line
  var lines = svg
    .selectAll(".line")
    .data(subgroupedData)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", function (d) {
      return color(d[0]);
    })
    .attr("stroke-width", 1.5)
    .attr("d", function (d) {
      return d3
        .line()
        .x(function (d) {
          return x(d.Year);
        })
        .y(function (d) {
          return y(+d.Count);
        })(d[1]);
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

  // 添加下拉选择框
  d3.select(".select-items")
    .selectAll()
    .data(LGA_array)
    .enter()
    .append("div")
    .attr("class", "select-item")
    .append("label", "input")
    .text(function (d) {
      return d;
    }) // text showed in the menu
    .append("input")
    .attr("type", "checkbox")
    .attr("value", function (d) {
      return d;
    }); // corresponding value returned by the button

  // 处理输入框
  const customSelect = document.querySelector(".custom-select");
  const selectSelected = customSelect.querySelector(".select-selected");
  const selectFilter = customSelect.querySelector(".select-filter");
  const selectInput = customSelect.querySelector("input[type='text']");
  const selectItems = customSelect.querySelector(".select-items");
  const selectItem = customSelect.querySelectorAll(".select-item");

  selectSelected.addEventListener("click", function () {
    selectItems.classList.toggle("select-hide");
    selectFilter.classList.toggle("show");
    selectInput.focus();
  });

  selectFilter.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  selectInput.addEventListener("input", function () {
    const keyword = selectInput.value.toLowerCase();

    selectItem.forEach(function (item) {
      const text = item.textContent.toLowerCase();

      if (text.includes(keyword)) {
        item.classList.remove("select-hide");
      } else {
        item.classList.add("select-hide");
      }
    });
  });

  selectItem.forEach(function (item) {
    const checkbox = item.querySelector("input[type='checkbox']");
    const label = item.querySelector("label");

    checkbox.addEventListener("change", function () {
      const selectedValues = [];

      selectItem.forEach(function (item) {
        const checkbox = item.querySelector("input[type='checkbox']");

        if (checkbox.checked) {
          selectedValues.push(checkbox.value);
        }
      });

      if (selectedValues.length > 0) {
        selectSelected.textContent = selectedValues.join(", ");
      } else {
        selectSelected.textContent = "Select an option";
      }
      update(selectedValues);
    });
  });

  // 点击文档时隐藏选项
  document.addEventListener("click", function (event) {
    if (!customSelect.contains(event.target)) {
      selectItems.classList.add("select-hide");
      selectFilter.classList.remove("show");
      selectInput.value = "";
    }
  });

  function update(selected_LGA) {
    const filteredData = data.filter(function (d) {
      return selected_LGA.includes(d.LGA);
    });

    let newData = Array.from(
      // 将Year, Subgroup列为相同值的行合并，并将Count列的值相加
      d3.group(
        filteredData,
        (d) => d.Year,
        (d) => d.Subgroup
      ),
      ([key1, values1]) => ({
        Year: key1,
        values: Array.from(values1, ([key2, values2]) => ({
          Subgroup: key2,
          Count: d3.sum(values2, (d) => d.Count),
        })),
      })
    ).flatMap((d) => d.values.map((e) => ({ Year: d.Year, Subgroup: e.Subgroup, Count: e.Count })));

    // group the data: I want to draw one line per group
    let subgroupedData = d3.group(newData, (d) => d.Subgroup);
    y.domain([
      0,
      d3.max(newData, function (d) {
        return +d.Count;
      }),
    ]);
    svg.select(".yAxis").transition().duration(100).ease(d3.easeLinear).call(d3.axisLeft(y));

    lines.remove();
    lines = svg
      .selectAll(".line")
      .data(subgroupedData)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", function (d) {
        return color(d[0]);
      })
      .attr("stroke-width", 1.5)
      .attr("d", function (d) {
        return d3
          .line()
          .x(function (d) {
            return x(d.Year);
          })
          .y(function (d) {
            return y(+d.Count);
          })(d[1]);
      })
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);
  }
});
