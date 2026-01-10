import {
  create,
  csv,
  drag,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  scaleOrdinal,
  schemeCategory10,
  type DSVRowArray,
} from "d3";

class Graph {
  #width = 928;
  #height = 600;

  static async index() {
    const data = await csv("suits.csv");
    const root = document.getElementById("graph");
    root?.appendChild(new Graph(data).draw()!);
  }

  constructor(private items: DSVRowArray<string>) {
    console.log("+++++++++++++++++++++++++++++++++++");
    console.log("+++++++++++++++++++++++++++++++++++");
    console.log("+++++++++++++++++++++++++++++++++++");
    console.log("+++++++++++++++++++++++++++++++++++");
    console.log("original", this.items);
    console.log("+++++++++++++++++++++++++++++");
    console.log("+++++++++++++++++++++++++++++");
    console.log("+++++++++++++++++++++++++++++");
    console.log("+++++++++++++++++++++++++++++");
  }

  drag = (simulation) => {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  draw() {
    const types = Array.from(new Set(this.items.map((i) => i.type)));
    const nodes = Array.from(
      new Set(this.items.flatMap((l) => [l.source, l.target])),
      (id) => ({ id })
    );

    const links = this.items.map((i) => i);
    const color = scaleOrdinal(types, schemeCategory10);

    const simulation = forceSimulation(nodes)
      .force(
        "link",
        forceLink(links).id((d) => d.id)
      )
      .force("charge", forceManyBody().strength(-400))
      .force("x", forceX())
      .force("y", forceY());

    const svg = create("svg")
      .attr("viewBox", [
        -this.#width / 2,
        -this.#height / 2,
        this.#width,
        this.#height,
      ])
      .attr("width", this.#width)
      .attr("heigth", this.#height)
      .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    svg
      .append("defs")
      .selectAll("marker")
      .data(types)
      .join("marker")
      .attr("id", (i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -0.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "white")
      .attr("d", "M0,-5L10,0L0,5");

    const link = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke", (d) => color(d.type))
      .attr(
        "marker-end",
        (d) => `url(${new URL(`#arrow-${d.type}`, document.location)})`
      );

    const node = svg
      .append("g")
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(this.drag(simulation));

    node
      .append("circle")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("r", 4);

    node
      .append("text")
      .attr("x", 8)
      .attr("y", " 0.31em")
      .text((d) => d.id)
      .clone(true)
      .lower()
      .attr("fill", "white");

    simulation.on("tick", () => {
      link.attr("d", linkArc);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return svg.node();
  }
}

function linkArc(d) {
  const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
  return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    `;
}

Graph.index();
