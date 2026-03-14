import { useState, useEffect } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { getWardenOverview, environmentalData, getWellnessLabel } from "../../data/mockData";
import { getWardenOverview as fetchOverview } from "../../api/warden";
import { useEnvironment } from '../../context/EnvironmentContext'
import KPICard from "../../components/KPICard";
import InsightCard from "../../components/InsightCard";
import SectionHeader from "../../components/SectionHeader";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const SCORE_COLORS = {
  thriving: "#22c55e",
  good: "#84cc16",
  fair: "#f59e0b",
  needsAttention: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono">
      <p className="font-bold text-[#111827] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function WardenOverview() {
  const { user } = useAdminAuth();
  const { env: liveEnv } = useEnvironment();
  const hostelName = user?.hostel_id || user?.hostelId || "BH-3";
  const navigate = useNavigate();
  const mockEnv = environmentalData[environmentalData.length - 1];
  const [data, setData] = useState(() => getWardenOverview(hostelName));
  const [env, setEnv] = useState({
    aqi: liveEnv?.aqi ?? mockEnv.aqi,
    aqiCategory: liveEnv?.aqi_category ?? mockEnv.aqiCategory,
    aqiColor: liveEnv?.aqi_color ?? mockEnv.aqiColor,
    outdoorSafe: liveEnv?.outdoor_safe ?? mockEnv.outdoorSafe,
  });

  const safeStudentsTotal = Math.max(data?.studentsTotal || 0, 1)
  const safeStudentsLogged = Math.max(data?.studentsLoggedToday || 0, 1)

  useEffect(() => {
    fetchOverview().then((api) => {
      const apiEnv = api.environment || {}
      setEnv({
        aqi: apiEnv.aqi ?? liveEnv?.aqi ?? mockEnv.aqi,
        aqiCategory: apiEnv.aqi_category ?? apiEnv.aqiCategory ?? liveEnv?.aqi_category ?? mockEnv.aqiCategory,
        aqiColor: apiEnv.aqi_color ?? apiEnv.aqiColor ?? liveEnv?.aqi_color ?? mockEnv.aqiColor,
        outdoorSafe: apiEnv.outdoor_safe ?? apiEnv.outdoorSafe ?? liveEnv?.outdoor_safe ?? mockEnv.outdoorSafe,
      })
      setData({
        studentsLoggedToday: api.kpis?.logged_today?.value ?? data.studentsLoggedToday,
        studentsTotal:       api.kpis?.logged_today?.total ?? data.studentsTotal,
        participationToday:  (api.kpis?.logged_today?.pct ?? 0) / 100,
        participationYesterday: Math.max(0, ((api.kpis?.logged_today?.pct ?? 0) - (api.kpis?.logged_today?.trend_vs_yesterday ?? 0)) / 100),
        avgWellnessScore:    api.kpis?.avg_wellness_score?.value ?? data.avgWellnessScore,
        wellnessTrend:       api.kpis?.avg_wellness_score?.trend_vs_last_week ?? 0,
        needsAttentionCount: api.kpis?.needs_attention_count?.value ?? 0,
        weeklyParticipation: (api.kpis?.weekly_participation?.value_pct ?? 0) / 100,
        scoreDistribution: {
          thriving:       api.score_distribution?.thriving?.count       ?? data.scoreDistribution.thriving,
          good:           api.score_distribution?.good?.count           ?? data.scoreDistribution.good,
          fair:           api.score_distribution?.fair?.count           ?? data.scoreDistribution.fair,
          needsAttention: api.score_distribution?.needs_attention?.count ?? data.scoreDistribution.needsAttention,
        },
        weeklyTrend: (api.weekly_trend ?? []).map((d) => ({ date: d.date, score: d.avg_score })),
        activityToday: {
          logged: api.activity_snapshot?.logged_today ?? data.activityToday.logged,
          types:  (api.activity_snapshot?.top_types ?? []).map((t) => ({ type: t.type, count: t.count })),
        },
        signals: {
          sleep: api.signals?.sleep?.avg_hours ?? data.signals.sleep,
          mood:  Math.min(5, Math.max(1, 3 + (api.signals?.mood?.trend_pct ?? 0) / 50)),
        },
      });
    }).catch(() => {});
  }, [hostelName, liveEnv?.aqi]);
  const needsAttentionPct =
    (data.needsAttentionCount / safeStudentsTotal) * 100;
  const wellnessLabel = getWellnessLabel(data.avgWellnessScore);

  const distData = [
    {
      name: "Thriving",
      value: data.scoreDistribution.thriving,
      color: SCORE_COLORS.thriving,
    },
    {
      name: "Good",
      value: data.scoreDistribution.good,
      color: SCORE_COLORS.good,
    },
    {
      name: "Fair",
      value: data.scoreDistribution.fair,
      color: SCORE_COLORS.fair,
    },
    {
      name: "Needs Attention",
      value: data.scoreDistribution.needsAttention,
      color: SCORE_COLORS.needsAttention,
    },
  ];

  const stackedData = distData.map((d) => ({ name: d.name, value: d.value }));

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
            Hostel Dashboard
          </p>
          <h1 className="text-[20px] font-bold text-[#111827]">{hostelName}</h1>
          <p className="text-[11px] text-[#6B7280]">
            Showing data for your hostel only ·{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
            Current AQI
          </p>
          <p className="text-[18px] font-bold" style={{ color: env.aqiColor }}>
            {env.aqi}
          </p>
          <p className="text-[9px] text-[#6B7280]">{env.aqiCategory}</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label="Students Logged Today"
          value={`${data.studentsLoggedToday} / ${data.studentsTotal}`}
          subtext={`${Math.round(data.participationToday * 100)}% participation today`}
          trend={data.participationToday - data.participationYesterday}
          trendLabel={`${((data.participationToday - data.participationYesterday) * 100).toFixed(0)}% vs yesterday`}
        />
        <KPICard
          label="Avg Wellness Score"
          value={data.avgWellnessScore}
          subtext={wellnessLabel.label}
          statusColor={wellnessLabel.color}
          trend={data.wellnessTrend}
          trendLabel={`${Math.abs(data.wellnessTrend).toFixed(1)} vs last week`}
        />
        <KPICard
          label="Needs Attention"
          value={data.needsAttentionCount}
          subtext="students below 40 score this week"
          statusColor={
            needsAttentionPct > 10
              ? "#ef4444"
              : needsAttentionPct > 5
                ? "#f59e0b"
                : "#22c55e"
          }
          badge="COUNT ONLY"
        />
        <KPICard
          label="Weekly Participation"
          value={`${Math.round(data.weeklyParticipation * 100)}%`}
          subtext="of hostel logged data this week"
          trend={0.03}
          trendLabel="+3% vs last week"
        />
      </div>

      {/* Wellness Score Distribution */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader
          title="Wellness Score Distribution"
          subtitle="Current week — student count by wellness band"
        />
        <div className="flex gap-6 items-center">
          <div className="flex-1 h-8 flex rounded-none overflow-hidden border border-[#E5E7EB]">
            {distData.map((d) => (
              <div
                key={d.name}
                style={{
                  width: `${(d.value / safeStudentsLogged) * 100}%`,
                  backgroundColor: d.color,
                }}
                className="relative group"
                title={`${d.name}: ${d.value} students`}
              />
            ))}
          </div>
          <div className="flex gap-4 shrink-0">
            {distData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <div>
                  <p
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: d.color }}
                  >
                    {d.name.split(" ")[0]}
                  </p>
                  <p className="text-[11px] font-bold text-[#111827]">
                    {d.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {needsAttentionPct > 15 && (
          <div className="mt-4 border border-[#fde68a] bg-[#fffbeb] p-3 flex items-center justify-between">
            <p className="text-[11px] text-[#92400e] font-medium">
              A notable portion of your hostel is in the low wellness range this
              week. Consider a hostel-wide activity initiative.
            </p>
            <button
              onClick={() => navigate("/admin/warden/initiatives")}
              className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b] whitespace-nowrap ml-4 hover:underline"
            >
              Create Initiative →
            </button>
          </div>
        )}
      </div>

      {/* Trend + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Weekly trend */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] p-5">
          <SectionHeader
            title="28-Day Wellness Trend"
            subtitle="Hostel average score · dashed line = 60 threshold"
          />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={data.weeklyTrend}
              margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                tickFormatter={(d) => d.slice(5)}
                interval={3}
              />
              <YAxis domain={[30, 100]} tick={{ fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={60}
                stroke="#E5E7EB"
                strokeDasharray="4 2"
                label={{
                  value: "60",
                  position: "right",
                  fontSize: 9,
                  fill: "#9CA3AF",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#111827"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity today */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] p-5">
          <SectionHeader
            title="Today's Activity"
            subtitle={`${data.activityToday.logged} students logged`}
          />
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={[
                  { name: "Logged", value: data.activityToday.logged },
                  {
                    name: "Not Logged",
                     value: Math.max(0, safeStudentsLogged - data.activityToday.logged),
                  },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill="#111827" />
                <Cell fill="#F3F4F6" />
              </Pie>
              <Tooltip
                contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {data.activityToday.types.map((t) => (
              <div
                key={t.type}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="text-[#6B7280]">{t.type}</span>
                <span className="font-bold text-[#111827]">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="This Week's Key Signals" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Sleep */}
          <div className="border border-[#E5E7EB] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    data.signals.sleep < 6
                      ? "#ef4444"
                      : data.signals.sleep < 7
                        ? "#f59e0b"
                        : "#22c55e",
                }}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Sleep
              </span>
            </div>
            <p className="text-[16px] font-bold text-[#111827]">
              {data.signals.sleep.toFixed(1)} hrs
            </p>
            <p className="text-[10px] text-[#6B7280] mt-1">
              {data.signals.sleep < 7
                ? "Below the 7-hour recommended threshold"
                : "Within healthy range"}
            </p>
          </div>

          {/* Mood */}
          <div className="border border-[#E5E7EB] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    data.signals.mood < 3 ? "#ef4444" : "#f59e0b",
                }}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Mood
              </span>
            </div>
            <p className="text-[16px] font-bold text-[#111827]">
              {data.signals.mood.toFixed(1)} / 5
            </p>
            <p className="text-[10px] text-[#6B7280] mt-1">
              Mood trending down vs last week
            </p>
          </div>

          {/* AQI */}
          <div className="border border-[#E5E7EB] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    env.aqi > 200
                      ? "#ef4444"
                      : env.aqi > 100
                        ? "#f59e0b"
                        : "#22c55e",
                }}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Environment
              </span>
            </div>
            <p className="text-[16px] font-bold text-[#111827]">
              AQI {env.aqi}
            </p>
            <p className="text-[10px] text-[#6B7280] mt-1">
              {env.aqi > 150
                ? "Outdoor activity not recommended"
                : "Safe for outdoor activities"}
            </p>
          </div>
        </div>
      </div>

      <InsightCard
        insight={`Activity participation drops significantly on Sundays in ${hostelName} (avg 22% vs 58% on weekdays). Consider scheduling a Sunday morning group activity.`}
      />
    </div>
  );
}
