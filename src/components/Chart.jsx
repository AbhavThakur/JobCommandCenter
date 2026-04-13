/**
 * Growth OS — ECharts wrapper (tree-shaken, same pattern as WealthOS)
 * Public API:
 *   <Chart>       – bar / line / area charts
 *   <DonutChart>  – donut chart
 */
import { memo, useRef, useEffect } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
  CanvasRenderer,
]);

function EChart({ option, style }) {
  const ref = useRef(null);
  const chart = useRef(null);
  const prevOption = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    echarts.getInstanceByDom(el)?.dispose();
    const inst = echarts.init(el, null, { renderer: "canvas" });
    chart.current = inst;
    prevOption.current = null;

    let rid;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rid);
      rid = requestAnimationFrame(() => {
        if (!inst.isDisposed()) inst.resize();
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(rid);
      ro.disconnect();
      inst.dispose();
    };
  }, []);

  useEffect(() => {
    const inst = chart.current;
    if (!inst || inst.isDisposed()) return;
    inst.setOption(option, { notMerge: true });
    prevOption.current = option;
  }, [option]);

  return <div ref={ref} style={{ width: "100%", ...style }} />;
}

/* ─── Shared dark theme defaults ─── */
const BASE = {
  backgroundColor: "transparent",
  textStyle: { fontFamily: "var(--sans, Inter, sans-serif)", color: "#94a3b8" },
  tooltip: {
    backgroundColor: "#1c2232",
    borderColor: "#2dd4bf33",
    textStyle: { color: "#e2e8f0", fontSize: 12 },
    extraCssText: "border-radius:10px;padding:10px 14px;",
  },
};

const PALETTE = [
  "#2dd4bf", // teal
  "#818cf8", // purple
  "#fbbf24", // amber
  "#34d399", // green
  "#f87171", // red
  "#60a5fa", // blue
];

/* ─── Chart ─── */
export const Chart = memo(function Chart({
  categories = [],
  series = [],
  height = 200,
  grid,
  horizontal = false,
  labelInterval = "auto",
  yAxisLabel,
  tooltip,
}) {
  const option = {
    ...BASE,
    tooltip: tooltip ?? { ...BASE.tooltip, trigger: "axis" },
    grid: {
      left: 8,
      right: 8,
      top: 16,
      bottom: 0,
      containLabel: true,
      ...grid,
    },
    [horizontal ? "yAxis" : "xAxis"]: {
      type: "category",
      data: categories,
      axisLabel: { color: "#64748b", fontSize: 11, interval: labelInterval },
      axisLine: { lineStyle: { color: "#1e293b" } },
      splitLine: { show: false },
    },
    [horizontal ? "xAxis" : "yAxis"]: {
      type: "value",
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      axisLabel: {
        color: "#64748b",
        fontSize: 11,
        formatter: yAxisLabel,
      },
    },
    series: series.map((s, i) => ({
      type: s.type ?? "bar",
      name: s.name,
      data: s.data,
      itemStyle: {
        color: s.color ?? PALETTE[i % PALETTE.length],
        borderRadius: s.type === "line" ? 0 : 4,
      },
      smooth: s.smooth ?? false,
      areaStyle: s.area ? { opacity: 0.12 } : undefined,
      lineStyle: s.type === "line" ? { width: 2 } : undefined,
      symbol: s.type === "line" ? "circle" : "none",
      symbolSize: 5,
    })),
  };

  return <EChart option={option} style={{ height }} />;
});

/* ─── DonutChart ─── */
export const DonutChart = memo(function DonutChart({
  data = [],
  height = 180,
  label = true,
}) {
  const option = {
    ...BASE,
    tooltip: { ...BASE.tooltip, trigger: "item" },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["52%", "78%"],
        center: ["50%", "50%"],
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color ?? PALETTE[i % PALETTE.length] },
        })),
        label: label
          ? {
              show: true,
              formatter: "{b}\n{d}%",
              fontSize: 11,
              color: "#94a3b8",
            }
          : { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0,0,0,0.5)",
          },
        },
      },
    ],
  };
  return <EChart option={option} style={{ height }} />;
});
