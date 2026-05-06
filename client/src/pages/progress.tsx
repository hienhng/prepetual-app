import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  ChartLine,
  Loader2,
  Shapes,
  ArrowRight,
  Target,
  Clock3,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faChartSimple, faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCategoryIcon } from "@/lib/category-icons";
import { useLanguage } from "@/lib/language-context";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface ResultHistoryItem {
  date: string;
  accuracy: number;
  quizTitle: string;
  correctAnswers: number;
  totalQuestions: number;
  category: string;
  quizId: string;
}

interface UserStats {
  averageAccuracy: number;
  totalAttempts: number;
}

const categoryColors: Record<string, string> = {
  Math: "hsl(221, 83%, 53%)",
  English: "hsl(262, 83%, 58%)",
  Science: "hsl(142, 76%, 36%)",
  "Social Studies": "hsl(25, 95%, 53%)",
  "Global Languages": "hsl(340, 82%, 52%)",
  "Others/General": "hsl(200, 18%, 46%)",
};

const categoryGradients: Record<string, string> = {
  Math: "bg-gradient-to-br from-blue-500 to-blue-600",
  English: "bg-gradient-to-br from-violet-500 to-violet-600",
  Science: "bg-gradient-to-br from-emerald-500 to-emerald-600",
  "Social Studies": "bg-gradient-to-br from-orange-500 to-orange-600",
  "Global Languages": "bg-gradient-to-br from-pink-500 to-pink-600",
  "Others/General": "bg-gradient-to-br from-slate-500 to-slate-600",
};

function getEncouragingMessage(accuracy: number, t: any): string {
  if (accuracy >= 90) return t('progress.encouragementExcellent');
  if (accuracy >= 75) return t('progress.encouragementGood');
  if (accuracy >= 60) return t('progress.encouragementFair');
  return t('progress.encouragementPractice');
}

function getTrend(history: ResultHistoryItem[]): { trend: "up" | "down" | "neutral"; change: number } {
  if (history.length < 2) return { trend: "neutral", change: 0 };

  const recent = history.slice(-5);
  const older = history.slice(-10, -5);

  if (recent.length === 0 || older.length === 0) {
    return { trend: "neutral", change: 0 };
  }

  const recentAvg = recent.reduce((sum, result) => sum + result.accuracy, 0) / recent.length;
  const olderAvg = older.reduce((sum, result) => sum + result.accuracy, 0) / older.length;
  const change = Math.round(recentAvg - olderAvg);

  if (change > 2) return { trend: "up", change };
  if (change < -2) return { trend: "down", change: Math.abs(change) };
  return { trend: "neutral", change: 0 };
}

function StatCard({
  label,
  value,
  icon: Icon,
  isActive = true,
  testId,
  color = "blue",
}: {
  label: string;
  value: number | string;
  icon: any;
  isActive?: boolean;
  testId: string;
  color?: "blue" | "violet" | "emerald" | "teal" | "rose" | "slate";
}) {
  const colorSchemes = {
    blue: {
      bg: "bg-blue-50/50 dark:bg-blue-500/5",
      border: "border-blue-100 dark:border-blue-500/10",
      iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
      iconText: "text-blue-600 dark:text-blue-400",
    },
    violet: {
      bg: "bg-violet-50/50 dark:bg-violet-500/5",
      border: "border-violet-100 dark:border-violet-500/10",
      iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
      iconText: "text-violet-600 dark:text-violet-400",
    },
    emerald: {
      bg: "bg-emerald-50/50 dark:bg-emerald-500/5",
      border: "border-emerald-100 dark:border-emerald-500/10",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconText: "text-emerald-600 dark:text-emerald-400",
    },
    teal: {
      bg: "bg-teal-50/50 dark:bg-teal-500/5",
      border: "border-teal-100 dark:border-teal-500/10",
      iconBg: "bg-teal-500/10 dark:bg-teal-500/20",
      iconText: "text-teal-600 dark:text-teal-400",
    },
    rose: {
      bg: "bg-rose-50/50 dark:bg-rose-500/5",
      border: "border-rose-100 dark:border-rose-500/10",
      iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
      iconText: "text-rose-600 dark:text-rose-400",
    },
    slate: {
      bg: "bg-slate-50/50 dark:bg-slate-500/5",
      border: "border-slate-100 dark:border-slate-500/10",
      iconBg: "bg-slate-500/10 dark:bg-slate-500/20",
      iconText: "text-slate-600 dark:text-slate-400",
    },
    muted: {
      bg: "bg-muted/30",
      border: "border-border",
      iconBg: "bg-muted",
      iconText: "text-muted-foreground",
    },
  };

  const scheme = isActive ? colorSchemes[color] : colorSchemes.muted;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="relative h-full">
      <Card className={`h-full overflow-hidden border ${scheme.border} ${scheme.bg} shadow-sm transition-all duration-300 group`} data-testid={testId}>
        <CardContent className="flex h-full items-center gap-4 p-5 text-left">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${scheme.iconBg} ${scheme.iconText} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">{label}</p>
            <div className="text-2xl font-black tracking-tight text-foreground">{value}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function ProgressPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { language, t } = useLanguage();

  const { data: history = [], isLoading: historyLoading } = useQuery<ResultHistoryItem[]>({
    queryKey: ["/api/user/result-history"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const averageAccuracy = userStats?.averageAccuracy ?? 0;
  const totalAttempts = userStats?.totalAttempts ?? 0;
  const encouragement = getEncouragingMessage(averageAccuracy, t);
  const trend = getTrend(history);

  const categories = useMemo(() => {
    const values = new Set(history.map((item) => item.category));
    return Array.from(values).sort();
  }, [history]);

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    categories.forEach((category) => {
      config[category] = {
        label: category,
        color: categoryColors[category] || "hsl(var(--primary))",
      };
    });
    return config;
  }, [categories]);

  const chartData = useMemo(() => {
    if (history.length === 0) return [];

    const grouped: Record<string, { date: string; dateLabel: string; entries: Record<string, number[]> }> = {};

    history.forEach((item) => {
      const dateKey = format(parseISO(item.date), "yyyy-MM-dd");
      const dateLabel = format(parseISO(item.date), "M/d");

      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, dateLabel, entries: {} };
      }

      if (!grouped[dateKey].entries[item.category]) {
        grouped[dateKey].entries[item.category] = [];
      }

      grouped[dateKey].entries[item.category].push(item.accuracy);
    });

    return Object.values(grouped)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((group) => {
        const point: Record<string, any> = { date: group.dateLabel };

        for (const [category, accuracies] of Object.entries(group.entries)) {
          point[category] = Math.round(accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length);
        }

        return point;
      });
  }, [history]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; totalAccuracy: number; best: number }> = {};

    history.forEach((item) => {
      if (!stats[item.category]) {
        stats[item.category] = { count: 0, totalAccuracy: 0, best: 0 };
      }

      stats[item.category].count++;
      stats[item.category].totalAccuracy += item.accuracy;
      stats[item.category].best = Math.max(stats[item.category].best, item.accuracy);
    });

    return Object.entries(stats)
      .map(([category, stat]) => ({
        category,
        count: stat.count,
        avgAccuracy: Math.round(stat.totalAccuracy / stat.count),
        best: stat.best,
      }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  const accuracyDistribution = useMemo(
    () =>
      [
        { range: "90-100%", count: history.filter((item) => item.accuracy >= 90).length, color: "bg-emerald-500" },
        { range: "75-89%", count: history.filter((item) => item.accuracy >= 75 && item.accuracy < 90).length, color: "bg-emerald-400" },
        { range: "60-74%", count: history.filter((item) => item.accuracy >= 60 && item.accuracy < 75).length, color: "bg-amber-400" },
        { range: "40-59%", count: history.filter((item) => item.accuracy >= 40 && item.accuracy < 60).length, color: "bg-orange-500" },
        { range: "0-39%", count: history.filter((item) => item.accuracy < 40).length, color: "bg-rose-500" },
      ].filter((item) => item.count > 0),
    [history],
  );

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        <motion.section variants={itemVariants}>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <h1 className="text-2xl font-bold text-foreground md:text-3xl" data-testid="text-page-title">
                    {t("progress.title")}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground md:text-base">
                    {totalAttempts > 0 ? encouragement : t("progress.noAttempts")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="h-9 rounded-full px-4 text-sm font-semibold">
                    {totalAttempts} {totalAttempts === 1 ? t("progress.attempt") : t("progress.attempts")}
                  </Badge>
                  <Button variant="outline" className="h-9 rounded-full" onClick={() => setLocation(totalAttempts > 0 ? "/history" : "/create")}>
                    {totalAttempts > 0 ? t("progress.reviewQuizzes") : t("progress.createQuiz")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {history.length === 0 ? (
          <motion.section variants={itemVariants}>
            <Card className="border-border/50 shadow-sm">
              <CardContent className="px-8 py-16">
                <div className="mx-auto max-w-md text-center">
                  <div className="mb-5 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
                      <ChartLine className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-bold tracking-tight">{t("progress.noResults")}</h3>
                  <p className="mb-6 text-sm text-muted-foreground">{t("progress.noResultsDescription")}</p>
                  <Button onClick={() => setLocation("/create")} className="rounded-xl px-5" data-testid="button-create-quiz-empty">
                    {t("progress.createFirstQuiz")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        ) : (
          <>
            <motion.section variants={itemVariants}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label={t("progress.accuracy")}
                  value={`${averageAccuracy}%`}
                  icon={() => <FontAwesomeIcon icon={faBullseye} className="h-6 w-6" />}
                  color="emerald"
                  isActive={totalAttempts > 0}
                  testId="stat-avg-accuracy"
                />
                <StatCard
                  label={t("progress.quizzesTaken")}
                  value={totalAttempts}
                  icon={() => <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6" />}
                  color="blue"
                  testId="stat-total-attempts"
                />
                <StatCard
                  label={t("progress.trend")}
                  value={trend.trend === "up" ? `+${trend.change}%` : trend.trend === "down" ? `-${trend.change}%` : "—"}
                  icon={() => {
                    if (trend.trend === "up") return <TrendingUp className="h-6 w-6" />;
                    if (trend.trend === "down") return <TrendingDown className="h-6 w-6" />;
                    return <FontAwesomeIcon icon={faChartSimple} className="h-6 w-6" />;
                  }}
                  color={trend.trend === "up" ? "teal" : trend.trend === "down" ? "rose" : "slate"}
                  isActive={trend.trend !== "neutral"}
                  testId="stat-trend"
                />
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">{t("progress.performanceDetails")}</h2>
                    <p className="text-sm text-muted-foreground">{t("progress.performanceDetailsDescription")}</p>
                  </div>
                </div>

                <TabsList className="mt-4 h-auto flex-wrap justify-start gap-4 rounded-none border-b border-border bg-transparent p-0" data-testid="tabs-progress">
                  <TabsTrigger
                    value="overview"
                    className="gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-0 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    data-testid="tab-overview"
                  >
                    <ChartLine className="h-3.5 w-3.5" />
                    {t("progress.overview")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="subjects"
                    className="gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-0 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    data-testid="tab-subjects"
                  >
                    <Shapes className="h-3.5 w-3.5" />
                    {t("progress.subjects")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-5 space-y-6">
                  {history.length >= 2 && (
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <ChartLine className="h-4 w-4 text-primary" />
                          {t("progress.accuracyOverTime")}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{t("progress.accuracyOverTimeDescription")}</p>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                          <ChartContainer config={chartConfig} className="h-[250px] w-full md:h-[320px]">
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} width={40} />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value, name) => (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{name}:</span>
                                        <span className="text-sm font-semibold">{value}%</span>
                                      </div>
                                    )}
                                  />
                                }
                              />
                              {categories.map((category) => (
                                <Line
                                  key={category}
                                  type="monotone"
                                  dataKey={category}
                                  stroke={categoryColors[category] || "hsl(var(--primary))"}
                                  strokeWidth={2.5}
                                  dot={{ fill: categoryColors[category] || "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                                  activeDot={{ r: 5, strokeWidth: 0 }}
                                  connectNulls
                                />
                              ))}
                            </LineChart>
                          </ChartContainer>
                        </div>

                        {categories.length > 1 && (
                          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                            {categories.map((category) => {
                              const Icon = getCategoryIcon(category);
                              return (
                                <div key={category} className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground" data-testid={`legend-${category.toLowerCase().replace(/\//g, "-")}`}>
                                  <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: categoryColors[category] }} />
                                  <Icon className="h-3 w-3" />
                                  <span>{category}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {accuracyDistribution.length > 0 && (
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <Target className="h-4 w-4 text-primary" />
                          {t("progress.scoreDistribution")}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{t("progress.scoreDistributionDescription")}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
                          {accuracyDistribution.map((item) => (
                            <div key={item.range} className="flex items-center gap-3" data-testid={`distribution-${item.range}`}>
                              <div className="w-16 text-xs font-medium text-muted-foreground">{item.range}</div>
                              <div className="flex-1">
                                <div className="h-7 overflow-hidden rounded-full bg-muted">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max((item.count / history.length) * 100, 4)}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className={`h-full rounded-full ${item.color}`} />
                                </div>
                              </div>
                              <div className="w-10 text-right text-xs font-semibold">{item.count}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="subjects" className="mt-5 space-y-4">
                  {categoryStats.length === 0 ? (
                    <Card className="border-border/50 shadow-sm">
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">{t("progress.noSubjectData")}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {categoryStats.map((stat, index) => {
                        const Icon = getCategoryIcon(stat.category);
                        const gradient = categoryGradients[stat.category] || categoryGradients["Others/General"];

                        return (
                          <motion.div key={stat.category} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
                            <Card className="overflow-hidden border-border/50 shadow-sm" data-testid={`card-subject-${stat.category.toLowerCase().replace(/\//g, "-")}`}>
                              <CardContent className="p-4 md:p-5">
                                <div className="flex flex-wrap items-start gap-3">
                                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gradient} shadow-md`}>
                                    <Icon className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-foreground" data-testid={`text-subject-name-${stat.category.toLowerCase().replace(/\//g, "-")}`}>
                                      {stat.category}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {t("progress.quizzesTakenCount", { count: stat.count })}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="rounded-full text-[11px]">
                                    <Clock3 className="mr-1 h-3 w-3" />
                                    {t("common.active")}
                                  </Badge>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center" data-testid={`stat-subject-avg-${stat.category.toLowerCase().replace(/\//g, "-")}`}>
                                    <div className={`text-xl font-bold ${stat.avgAccuracy >= 80 ? "text-emerald-500" : stat.avgAccuracy >= 60 ? "text-amber-500" : "text-rose-500"}`}>
                                      {stat.avgAccuracy}%
                                    </div>
                                    <div className="mt-0.5 text-[10px] text-muted-foreground">{t("progress.average")}</div>
                                  </div>
                                  <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center" data-testid={`stat-subject-best-${stat.category.toLowerCase().replace(/\//g, "-")}`}>
                                    <div className="text-xl font-bold text-primary">{stat.best}%</div>
                                    <div className="mt-0.5 text-[10px] text-muted-foreground">{t("progress.bestScore")}</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.section>
          </>
        )}
      </motion.div>
    </div>
  );
}
