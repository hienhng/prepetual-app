import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  TrendingUp, TrendingDown, Target, Trophy, Zap, Star, ChartLine,
  Binary, Book, FlaskConical, Globe, Languages, GraduationCap,
  CheckCircle2, XCircle, Clock, Loader2
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faChartSimple, faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface ResultHistoryItem {
  date: string;
  accuracy: number;
  quizTitle: string;
  correctAnswers: number;
  totalQuestions: number;
  category: string;
}

interface UserStats {
  averageAccuracy: number;
  totalAttempts: number;
}

const categoryIcons: Record<string, any> = {
  "Math": Binary,
  "English": Book,
  "Science": FlaskConical,
  "Social Studies": Globe,
  "Global Languages": Languages,
  "Others/General": GraduationCap,
};

const categoryColors: Record<string, string> = {
  "Math": "hsl(221, 83%, 53%)",
  "English": "hsl(262, 83%, 58%)",
  "Science": "hsl(142, 76%, 36%)",
  "Social Studies": "hsl(25, 95%, 53%)",
  "Global Languages": "hsl(340, 82%, 52%)",
  "Others/General": "hsl(200, 18%, 46%)",
};

const categoryColorClasses: Record<string, string> = {
  "Math": "text-blue-500",
  "English": "text-violet-500",
  "Science": "text-emerald-500",
  "Social Studies": "text-orange-500",
  "Global Languages": "text-pink-500",
  "Others/General": "text-slate-500",
};

const categoryBgClasses: Record<string, string> = {
  "Math": "bg-blue-500/10",
  "English": "bg-violet-500/10",
  "Science": "bg-emerald-500/10",
  "Social Studies": "bg-orange-500/10",
  "Global Languages": "bg-pink-500/10",
  "Others/General": "bg-slate-500/10",
};

const categoryGradients: Record<string, string> = {
  "Math": "bg-gradient-to-br from-blue-500 to-blue-600",
  "English": "bg-gradient-to-br from-violet-500 to-violet-600",
  "Science": "bg-gradient-to-br from-emerald-500 to-emerald-600",
  "Social Studies": "bg-gradient-to-br from-orange-500 to-orange-600",
  "Global Languages": "bg-gradient-to-br from-pink-500 to-pink-600",
  "Others/General": "bg-gradient-to-br from-slate-500 to-slate-600",
};

function getEncouragingMessage(accuracy: number): { title: string; message: string; icon: typeof Trophy } {
  if (accuracy >= 90) {
    return { title: "Outstanding!", message: "You're mastering your material. Keep up the excellent work!", icon: Trophy };
  } else if (accuracy >= 75) {
    return { title: "Great Progress!", message: "You're doing well! A little more practice will make you unstoppable.", icon: Star };
  } else if (accuracy >= 60) {
    return { title: "Keep Going!", message: "You're on the right track. Consistency is the key to success!", icon: Zap };
  } else {
    return { title: "Every Step Counts!", message: "Learning takes time. Each quiz brings you closer to mastery!", icon: Target };
  }
}

function getTrend(history: ResultHistoryItem[]): { trend: "up" | "down" | "neutral"; change: number } {
  if (history.length < 2) return { trend: "neutral", change: 0 };
  const recent = history.slice(-5);
  const older = history.slice(-10, -5);
  if (recent.length === 0 || older.length === 0) return { trend: "neutral", change: 0 };
  const recentAvg = recent.reduce((sum, r) => sum + r.accuracy, 0) / recent.length;
  const olderAvg = older.reduce((sum, r) => sum + r.accuracy, 0) / older.length;
  const change = Math.round(recentAvg - olderAvg);
  if (change > 2) return { trend: "up", change };
  if (change < -2) return { trend: "down", change: Math.abs(change) };
  return { trend: "neutral", change: 0 };
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  gradient,
  isActive = true,
  testId,
}: { 
  label: string; 
  value: number | string; 
  icon: any; 
  gradient: string;
  isActive?: boolean;
  testId: string;
}) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }} 
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-visible border-0 shadow-md" data-testid={testId}>
        <CardContent className="p-0">
          <div className={`p-4 rounded-md transition-all duration-500 ${isActive ? gradient : "bg-muted shadow-inner"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mb-0.5 transition-colors text-white/60 text-[10px] text-left font-medium uppercase tracking-wider">{label}</p>
                <motion.p 
                  className={`text-2xl font-bold transition-colors ${isActive ? "text-white" : "text-foreground"}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  {value}
                </motion.p>
              </div>
              <div className="p-3 rounded-xl transition-all duration-500 flex items-center justify-center bg-white/20 backdrop-blur-sm scale-110 shadow-lg text-[#ffffff]">
                <Icon className="w-6 h-6 transition-colors text-white" />
              </div>
            </div>
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

  const { data: history = [], isLoading: historyLoading } = useQuery<ResultHistoryItem[]>({
    queryKey: ["/api/user/result-history"],
  });

  const { data: userStats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const averageAccuracy = userStats?.averageAccuracy ?? 0;
  const totalAttempts = userStats?.totalAttempts ?? 0;
  const encouragement = getEncouragingMessage(averageAccuracy);
  const trend = getTrend(history);

  const categories = useMemo(() => {
    const cats = new Set(history.map(h => h.category));
    return Array.from(cats).sort();
  }, [history]);

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    categories.forEach(cat => {
      config[cat] = {
        label: cat,
        color: categoryColors[cat] || "hsl(var(--primary))",
      };
    });
    return config;
  }, [categories]);

  const chartData = useMemo(() => {
    if (history.length === 0) return [];

    const grouped: Record<string, { date: string; dateLabel: string; entries: Record<string, number[]> }> = {};
    
    history.forEach(item => {
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
      .map(group => {
        const point: Record<string, any> = { date: group.dateLabel };
        for (const [cat, accuracies] of Object.entries(group.entries)) {
          point[cat] = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
        }
        return point;
      });
  }, [history]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; totalAccuracy: number; best: number }> = {};
    history.forEach(item => {
      if (!stats[item.category]) {
        stats[item.category] = { count: 0, totalAccuracy: 0, best: 0 };
      }
      stats[item.category].count++;
      stats[item.category].totalAccuracy += item.accuracy;
      stats[item.category].best = Math.max(stats[item.category].best, item.accuracy);
    });
    return Object.entries(stats)
      .map(([category, s]) => ({
        category,
        count: s.count,
        avgAccuracy: Math.round(s.totalAccuracy / s.count),
        best: s.best,
      }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  const accuracyDistribution = useMemo(() => [
    { range: "90-100%", count: history.filter(h => h.accuracy >= 90).length, color: "bg-emerald-500" },
    { range: "75-89%", count: history.filter(h => h.accuracy >= 75 && h.accuracy < 90).length, color: "bg-emerald-400" },
    { range: "60-74%", count: history.filter(h => h.accuracy >= 60 && h.accuracy < 75).length, color: "bg-amber-400" },
    { range: "40-59%", count: history.filter(h => h.accuracy >= 40 && h.accuracy < 60).length, color: "bg-orange-500" },
    { range: "0-39%", count: history.filter(h => h.accuracy < 40).length, color: "bg-rose-500" },
  ].filter(d => d.count > 0), [history]);

  const allResults = useMemo(() => {
    return [...history].reverse();
  }, [history]);

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.section variants={itemVariants}>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1" data-testid="text-page-title">
              Your Progress
            </h1>
            <p className="text-muted-foreground">
              {totalAttempts > 0
                ? encouragement.message
                : "Take some quizzes to start tracking your progress."}
            </p>
          </div>
        </motion.section>

        {history.length === 0 ? (
          <motion.section variants={itemVariants}>
            <Card className="overflow-visible">
              <CardContent className="py-16 px-8">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ChartLine className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold mb-1">No results yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">Take some quizzes to start tracking your learning journey!</p>
                  <Button onClick={() => setLocation("/create")} data-testid="button-create-quiz-empty">
                    Create Your First Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        ) : (
          <>
            <motion.section variants={itemVariants}>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  label="ACCURACY"
                  value={`${averageAccuracy}%`}
                  icon={() => <FontAwesomeIcon icon={faBullseye} className="h-6 w-6" />}
                  gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  isActive={totalAttempts > 0}
                  testId="stat-avg-accuracy"
                />
                <StatCard
                  label="QUIZZES TAKEN"
                  value={totalAttempts}
                  icon={() => <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6" />}
                  gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                  testId="stat-total-attempts"
                />
                <StatCard
                  label="TREND"
                  value={
                    trend.trend === "up" ? `+${trend.change}%` :
                    trend.trend === "down" ? `-${trend.change}%` : "—"
                  }
                  icon={() => {
                    if (trend.trend === "up") return <TrendingUp className="h-6 w-6" />;
                    if (trend.trend === "down") return <TrendingDown className="h-6 w-6" />;
                    return <FontAwesomeIcon icon={faChartSimple} className="h-6 w-6" />;
                  }}
                  gradient={
                    trend.trend === "up" ? "bg-gradient-to-br from-teal-500 to-teal-600" :
                    trend.trend === "down" ? "bg-gradient-to-br from-rose-500 to-rose-600" :
                    "bg-gradient-to-br from-slate-500 to-slate-600"
                  }
                  isActive={trend.trend !== "neutral"}
                  testId="stat-trend"
                />
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-transparent p-0 h-auto gap-4 rounded-none border-b border-border justify-start flex-wrap" data-testid="tabs-progress">
                  <TabsTrigger
                    value="overview"
                    className="gap-1.5 rounded-none bg-transparent px-0 pb-2.5 pt-0 shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground"
                    data-testid="tab-overview"
                  >
                    <ChartLine className="h-3.5 w-3.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="subjects"
                    className="gap-1.5 rounded-none bg-transparent px-0 pb-2.5 pt-0 shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground"
                    data-testid="tab-subjects"
                  >
                    <Target className="h-3.5 w-3.5" />
                    Subjects
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="gap-1.5 rounded-none bg-transparent px-0 pb-2.5 pt-0 shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground"
                    data-testid="tab-history"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    All Results
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-5 space-y-6">
                  {history.length >= 2 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <ChartLine className="w-4 h-4 text-primary" />
                          Accuracy Over Time
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Performance by subject across your recent quizzes</p>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <ChartContainer config={chartConfig} className="h-[250px] md:h-[320px] w-full">
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `${value}%`}
                              width={40}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value, name) => (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">{name}:</span>
                                      <span className="font-semibold text-sm">{value}%</span>
                                    </div>
                                  )}
                                />
                              }
                            />
                            {categories.map(cat => (
                              <Line
                                key={cat}
                                type="monotone"
                                dataKey={cat}
                                stroke={categoryColors[cat] || "hsl(var(--primary))"}
                                strokeWidth={2}
                                dot={{ fill: categoryColors[cat] || "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                connectNulls
                              />
                            ))}
                          </LineChart>
                        </ChartContainer>
                        {categories.length > 1 && (
                          <div className="flex flex-wrap gap-3 mt-3 justify-center">
                            {categories.map(cat => {
                              const Icon = categoryIcons[cat] || GraduationCap;
                              return (
                                <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`legend-${cat.toLowerCase().replace(/\//g, '-')}`}>
                                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[cat] }} />
                                  <Icon className="w-3 h-3" />
                                  <span>{cat}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {accuracyDistribution.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Score Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {accuracyDistribution.map((item) => (
                            <div key={item.range} className="flex items-center gap-3" data-testid={`distribution-${item.range}`}>
                              <div className="w-16 text-xs text-muted-foreground font-medium">{item.range}</div>
                              <div className="flex-1">
                                <div className="h-7 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max((item.count / history.length) * 100, 4)}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className={`h-full rounded-full ${item.color}`}
                                  />
                                </div>
                              </div>
                              <div className="w-10 text-xs text-right font-semibold">{item.count}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="subjects" className="mt-5 space-y-4">
                  {categoryStats.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No subject data yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {categoryStats.map((stat, index) => {
                        const Icon = categoryIcons[stat.category] || GraduationCap;
                        const gradient = categoryGradients[stat.category] || categoryGradients["Others/General"];
                        return (
                          <motion.div
                            key={stat.category}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                          >
                            <Card className="overflow-hidden" data-testid={`card-subject-${stat.category.toLowerCase().replace(/\//g, '-')}`}>
                              <CardContent className="p-4 md:p-5">
                                <div className="flex items-start gap-3 flex-wrap">
                                  <div className={`w-9 h-9 rounded-lg ${gradient} flex items-center justify-center`}>
                                    <Icon className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-foreground" data-testid={`text-subject-name-${stat.category.toLowerCase().replace(/\//g, '-')}`}>{stat.category}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {stat.count} {stat.count === 1 ? "quiz" : "quizzes"} taken
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <div className="text-center p-2.5 rounded-lg bg-muted/50" data-testid={`stat-subject-avg-${stat.category.toLowerCase().replace(/\//g, '-')}`}>
                                    <div className={`text-xl font-bold ${
                                      stat.avgAccuracy >= 80 ? "text-emerald-500" :
                                      stat.avgAccuracy >= 60 ? "text-amber-500" : "text-rose-500"
                                    }`}>
                                      {stat.avgAccuracy}%
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Average</div>
                                  </div>
                                  <div className="text-center p-2.5 rounded-lg bg-muted/50" data-testid={`stat-subject-best-${stat.category.toLowerCase().replace(/\//g, '-')}`}>
                                    <div className="text-xl font-bold text-primary">{stat.best}%</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Best Score</div>
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

                <TabsContent value="history" className="mt-5 space-y-2">
                  {allResults.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">No results yet</h3>
                      <p className="text-sm text-muted-foreground">Your quiz results will appear here.</p>
                    </div>
                  ) : (
                    allResults.map((result, index) => {
                      const Icon = categoryIcons[result.category] || GraduationCap;
                      const gradient = categoryGradients[result.category] || categoryGradients["Others/General"];
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                          <div
                            className="relative flex gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-all duration-200 border border-transparent hover:border-border/40"
                            data-testid={`card-result-${index}`}
                          >
                            <div className="flex items-center justify-center flex-shrink-0">
                              <div className={`w-9 h-9 rounded-lg ${gradient} flex items-center justify-center`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground" data-testid={`text-result-title-${index}`}>{result.quizTitle}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                <span>{result.category}</span>
                                <span className="text-muted-foreground/50">·</span>
                                <span>{format(parseISO(result.date), "MMM d, yyyy")}</span>
                                <span className="text-muted-foreground/50">·</span>
                                <span>{result.correctAnswers}/{result.totalQuestions} correct</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0" data-testid={`text-result-accuracy-${index}`}>
                              <span className={`text-lg font-bold ${
                                result.accuracy >= 80 ? "text-emerald-500" :
                                result.accuracy >= 60 ? "text-amber-500" : "text-rose-500"
                              }`}>
                                {result.accuracy}%
                              </span>
                              {result.accuracy >= 80 ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 hidden sm:block" />
                              ) : result.accuracy >= 60 ? (
                                <Target className="w-4 h-4 text-amber-500 hidden sm:block" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500 hidden sm:block" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
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
