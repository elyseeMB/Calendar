import "./style.css";
import {
  create,
  csv,
  csvFormatValue,
  format,
  groups,
  interpolatePiYG,
  pairs,
  quantile,
  range,
  scaleSequential,
  utcFormat,
  utcMonday,
  utcMonth,
  utcMonths,
  utcYear,
  type DSVRowArray,
  type ScaleSequential,
} from "d3";

type Props = {
  Date: string;
  High: string;
  Low: string;
  Open: string;
  Volume: string;
};

const data = await csv("DJI.csv");

export class Chart {
  #doc: Record<string, any>[];
  #cellSize: number = 24;
  #height = this.#cellSize * 7;
  #width = (this.#cellSize + 1.5) * 57;

  #timeWeek = utcMonday;
  #max: number | undefined;

  //@ts-ignore
  #color: ScaleSequential<string, never>;

  #formatMonth = utcFormat("%b");
  #formatValue = format("+.2%");
  #formatClose = format("$,.2f");

  #countDay = (i: number) => (i + 6) % 7;
  #formatDate = (i: number) => "SMTWTFS"[i];

  constructor(items: DSVRowArray<string>) {
    this.#normalize(items);
    this.handle();
  }

  #pathMonth(t) {
    const d = Math.max(0, Math.min(5, this.#countDay(t.getUTCDay())));
    const w = this.#timeWeek.count(utcYear(t), t);
    return `${
      d === 0
        ? `M${w * this.#cellSize},0`
        : d === 5
          ? `M${(w + 1) * this.#cellSize},0`
          : `M${(w + 1) * this.#cellSize},0V${d * this.#cellSize}H${w * this.#cellSize}`
    }V${5 * this.#cellSize}`;
  }

  handle() {
    this.#max = quantile(this.#doc, 0.9975, (d) => Math.abs(d.value));
    this.#color = scaleSequential(interpolatePiYG).domain([
      -this.#max!,
      +this.#max!,
    ]);
  }

  draw() {
    const years = groups(this.#doc, (d) => d.date.getUTCFullYear()).reverse();

    const svg = create("svg")
      .attr("width", this.#width)
      .attr("height", this.#height * years.length)
      .attr("viewBox", [0, 0, this.#width, this.#height * years.length])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    const year = svg
      .selectAll("g")
      .data(years)
      .join("g")
      .attr(
        "transform",
        (_, i) => `translate(40.5, ${this.#height * i + this.#cellSize * 1.5})`
      );

    year
      .append("text")
      .attr("x", -5)
      .attr("y", -5)
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("text-anchor", "end")
      .text(([i]) => i);

    year
      .append("g")
      .attr("text-anchor", "end")
      .selectAll()
      .data(range(1, 6))
      .join("text")
      .attr("x", -5)
      .attr("y", (i) => (this.#countDay(i) + 0.5) * this.#cellSize)
      .attr("dy", "0.31em")
      .attr("fill", "white")
      .text(this.#formatDate);

    year
      .append("g")
      .selectAll()
      .data(([_, item]) =>
        item.filter((d) => ![0, 6].includes(d.date.getUTCDay()))
      )
      .join("rect")
      .attr("width", this.#cellSize - 1)
      .attr("height", this.#cellSize - 1)
      .attr(
        "x",
        (d) =>
          this.#timeWeek.count(utcYear(d.date), d.date) * this.#cellSize + 0.5
      )
      .attr(
        "y",
        (d) => this.#countDay(d.date.getUTCDay()) * this.#cellSize + 0.5
      )
      .attr("fill", (d) => this.#color(d.value))

      .append("title")
      .text("Bonjour les gens");

    const month = year
      .append("g")
      .selectAll()
      .data(([, values]) =>
        utcMonths(utcMonth(values[0].date), values.at(-1).date)
      )
      .join("g");

    month
      .filter((d, i) => i)
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#242424")
      .attr("stroke-width", 3)
      .attr("d", (d) => this.#pathMonth(d));

    month
      .append("text")
      .attr(
        "x",
        (d) =>
          this.#timeWeek.count(utcYear(d), this.#timeWeek.ceil(d)) *
            this.#cellSize +
          2
      )
      .attr("fill", "white")
      .attr("y", -5)
      .text(this.#formatMonth);

    return svg.node();
  }

  #normalize(items: DSVRowArray<string>) {
    const data = pairs(
      items,
      ({ Close: Previous }, { Date: DateEvent, Close }) => ({
        date: new Date(DateEvent),
        value:
          (parseFloat(Close) - parseFloat(Previous)) / parseFloat(Previous),
        close: Close,
      })
    );
    this.#doc = data;
  }
}

const root = document.getElementById("app");
root?.appendChild(new Chart(data).draw()!);
