import {
  create,
  utcMonday,
  utcYear,
  utcDays,
  utcMonths,
  utcMonth,
  utcFormat,
} from "d3";

export class Calendar extends HTMLElement {
  #today = new Date();
  #todayUTC = Date.UTC(
    this.#today.getFullYear(),
    this.#today.getMonth(),
    this.#today.getDate(),
  );
  #initialYear = 2019;

  #formatMonth = utcFormat("%b");
  #formatDate = (i: number) => "SMTWTFS"[i];
  #countDay = (i: number) => (i + 6) % 7;

  #rangeDate = Array.from({ length: 8 }, (_, k) => this.#initialYear + k);

  #doc = new Map<number, Date[]>(
    this.#rangeDate.map((year) => {
      const days = utcDays(
        new Date(Date.UTC(year, 0, 1)),
        new Date(Date.UTC(year + 1, 0, 1)),
      );

      return [year, days];
    }),
  );

  getParameters() {
    const size = parseInt(this.dataset.size!) || 16;
    const cellHeight = size + 2;
    const labelWidth = 20;
    const monthGap = 4;
    const width = (size + 1.5) * 57 + labelWidth;
    const yearHeight = cellHeight * 7 + size * 2;
    return { width, yearHeight, size, cellHeight, labelWidth, monthGap };
  }

  connectedCallback() {
    this.style.position = "relative";
    this.style.display = "block";
    const { width, yearHeight, size, cellHeight, labelWidth, monthGap } =
      this.getParameters();

    const svg = create("svg")
      .attr("width", width)
      .attr("height", yearHeight * this.#doc.size)
      .attr("viewBox", [0, 0, width, yearHeight * this.#doc.size])
      .attr("style", "max-width: 100%; height: auto;");

    const yearGroup = svg
      .selectAll("g.year")
      .data(this.#doc.keys())
      .join("g")
      .attr("class", "year")
      .attr(
        "transform",
        (_, i) => `translate(60, ${i * yearHeight + size * 2})`,
      );

    yearGroup
      .append("text")
      .attr("x", -5)
      .attr("y", -size * 0.5)
      .attr("fill", "white")
      .attr("text-anchor", "end")
      .text((d) => d);

    yearGroup
      .append("g")
      .selectAll("text")
      .data([0, 1, 2, 3, 4, 5, 6])
      .join("text")
      .attr("x", -5)
      .attr("y", (i) => this.#countDay(i) * cellHeight + (size - 2) / 2 + 4)
      .attr("fill", "white")
      .attr("font-size", size * 0.75)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "end")
      .text(this.#formatDate);

    const tooltip = document.createElement("div");
    tooltip.style.cssText =
      "position:absolute;background:#333;color:white;padding:4px 8px;border-radius:4px;font-size:12px;pointer-events:none;display:none";
    this.appendChild(tooltip);

    // Carrés jours
    yearGroup
      .append("g")
      .selectAll("rect")
      .data((year) => this.#doc.get(year)!)
      .join("rect")
      .attr("width", size - 2)
      .attr("height", size - 2)
      .attr(
        "x",
        (d) =>
          utcMonday.count(utcYear(d), d) * size +
          labelWidth +
          d.getUTCMonth() * monthGap,
      )
      .attr("y", (d) => this.#countDay(d.getUTCDay()) * cellHeight)
      .attr("fill", (d) =>
        d.getTime() === this.#todayUTC ? "#1a8ee0" : "#96969617",
      )
      .on("mouseenter", (event, d) => {
        tooltip.style.display = "block";
        tooltip.textContent = d.getDate().toString();
        tooltip.style.left = event.offsetX - 10 + "px";
        tooltip.style.top = event.offsetY - 30 + "px";
      })

      .on("mouseleave", () => {
        tooltip.style.display = "none";
      });

    const pathMonth = (t: Date) => {
      const d = Math.max(0, Math.min(7, this.#countDay(t.getUTCDay())));
      const w = utcMonday.count(utcYear(t), t);
      const m = t.getUTCMonth();
      const x0 = w * size + labelWidth + m * monthGap;
      const x1 = (w + 1) * size + labelWidth + m * monthGap;
      return `${
        d === 0
          ? `M${x1},0`
          : d === 7
            ? `M${x1},0`
            : `M${x1},0V${d * cellHeight}H${x0}`
      }V${7 * cellHeight}`;
    };

    const month = yearGroup
      .append("g")
      .selectAll()
      .data((i) =>
        utcMonths(new Date(Date.UTC(i, 0, 1)), new Date(Date.UTC(i + 1, 0, 1))),
      )
      .join("g");

    month
      .filter((d, i) => i)
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#242424")
      .attr("stroke-width", 3)
      .attr("d", (d) => pathMonth(d));

    month
      .append("text")
      .attr(
        "x",
        (d) =>
          utcMonday.count(utcYear(d), utcMonday.ceil(d)) * size +
          labelWidth +
          d.getUTCMonth() * monthGap,
      )
      .attr("fill", "white")
      .attr("y", -size * 0.5)
      .text(this.#formatMonth);

    this.appendChild(svg.node()!);
  }
}

customElements.define("calendar-graph", Calendar);
