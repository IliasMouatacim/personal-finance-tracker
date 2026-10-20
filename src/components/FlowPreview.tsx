"use client";
import Starburst from "@/components/Starburst";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  MoveUpRight,
  ShoppingBag,
  Coffee,
  Sparkles,
} from "lucide-react";
export default function FlowPreview() {
  const [period, setPeriod] = useState<"month" | "week">("month");
  const monthly = period === "month";
  const bars = monthly
    ? [30, 48, 35, 67, 52, 81, 70, 95, 80, 110, 97, 126]
    : [45, 31, 63, 50, 77, 64, 99];
  return (
    <div className="showcase">
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <div className="showcase-star" aria-hidden="true">
        <Starburst />
      </div>
      <span className="showcase-caption">
        A LITTLE STRUCTURE. A LOT MORE FREEDOM.
      </span>
      <div className="flow-card">
        <div className="flow-top">
          <span>
            <span className="tiny-logo">
              <Starburst />
            </span>{" "}
            Your money, in motion.
          </span>
          <span className="sample-tag">SAMPLE DATA</span>
        </div>
        <div className="flow-balance-row">
          <div>
            <p>Total balance</p>
            <strong>
              {monthly ? "$12,480" : "$3,120"}
              <span>.00</span>
            </strong>
          </div>
          <span className="growth-badge">
            <MoveUpRight size={13} /> {monthly ? "12.8" : "4.2"}%
          </span>
        </div>
        <div className="flow-chart-header">
          <span>Cash flow</span>
          <div className="period-switch">
            <button aria-pressed={!monthly} onClick={() => setPeriod("week")}>
              Week
            </button>
            <button aria-pressed={monthly} onClick={() => setPeriod("month")}>
              Month
            </button>
          </div>
        </div>
        <div
          className="flow-bars"
          aria-label={`Illustrative ${period} cash flow chart`}
        >
          {bars.map((height, i) => (
            <div
              key={i}
              className={i === bars.length - 1 ? "highlight-bar" : ""}
              style={{ height: `${height}px` }}
            >
              <i />
            </div>
          ))}
        </div>
        <div className="flow-chart-labels">
          <span>{monthly ? "01 OCT" : "MON"}</span>
          <span>{monthly ? "15 OCT" : "THU"}</span>
          <span>{monthly ? "31 OCT" : "SUN"}</span>
        </div>
        <div className="flow-totals">
          <div>
            <span className="metric-icon">
              <ArrowDownLeft size={16} />
            </span>
            <div>
              <small>Money in</small>
              <b>{monthly ? "$5,200" : "$1,300"}.00</b>
            </div>
          </div>
          <div>
            <span className="metric-icon metric-peach">
              <ArrowUpRight size={16} />
            </span>
            <div>
              <small>Money out</small>
              <b>{monthly ? "$2,340" : "$585"}.00</b>
            </div>
          </div>
        </div>
      </div>
      <div className="floating-receipt">
        <div className="receipt-icon">
          <ShoppingBag size={17} />
        </div>
        <div>
          <b>A little retail therapy</b>
          <small>Shopping · Just added</small>
        </div>
        <strong>−$64.00</strong>
      </div>
      <div className="floating-insight">
        <span>
          <Sparkles size={16} /> BIG PICTURE ENERGY
        </span>
        <strong>
          Small habits.
          <br />
          Better tomorrows.
        </strong>
        <div className="insight-line">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="coffee-chip">
        <Coffee size={15} />
        <span>Even the little things count.</span>
      </div>
    </div>
  );
}
