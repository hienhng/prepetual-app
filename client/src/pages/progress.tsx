import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  TrendingUp, TrendingDown, Target, Trophy, Zap, Star, ChartLine,
  ArrowLeft, Binary, Book, FlaskConical, Globe, Languages, GraduationCap,
  CheckCircle2, XCircle, Clock
} from "lucide-react";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
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
  const EncouragementIcon = encouragement.icon;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/dashboard")}
          className="rounded-full"
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <ChartLine className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            Your Progress
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your learning journey across subjects</p>
        </div>
      </motion.div>

      {history.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-20">
          <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No results yet</h2>
          <p className="text-muted-foreground mb-6">Take some quizzes to start tracking your progress!</p>
          <Button onClick={() => setLocation("/create")} data-testid="button-create-quiz-empty">
            Create Your First Quiz
          </Button>
        </motion.div>
      ) : (
        <>
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 md:p-6 border border-primary/20">
              <div className="absolute top-4 right-4 opacity-10">
                <EncouragementIcon className="w-24 h-24" />
              </div>
              <div className="flex items-start gap-3 mb-5">
                <div className="p-2.5 rounded-full bg-primary/20 flex-shrink-0">
                  <EncouragementIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">{encouragement.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{encouragement.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center" data-testid="stat-avg-accuracy">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{averageAccuracy}%</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Avg. Accuracy</div>
                </div>
                <div className="text-center" data-testid="stat-total-attempts">
                  <div className="text-2xl md:text-3xl font-bold text-foreground">{totalAttempts}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Quizzes Taken</div>
                </div>
                <div className="text-center" data-testid="stat-trend">
                  <div className="flex items-center justify-center gap-1">
                    {trend.trend === "up" && <TrendingUp className="w-5 h-5 text-emerald-500" />}
                    {trend.trend === "down" && <TrendingDown className="w-5 h-5 text-rose-500" />}
                    <span className={`text-2xl md:text-3xl font-bold ${
                      trend.trend === "up" ? "text-emerald-500" :
                      trend.trend === "down" ? "text-rose-500" : "text-muted-foreground"
                    }`}>
                      {trend.trend === "up" ? `+${trend.change}%` :
                       trend.trend === "down" ? `-${trend.change}%` : "—"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Recent Trend</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3" data-testid="tabs-progress">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="subjects" data-testid="tab-subjects">Subjects</TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">All Results</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
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

              <TabsContent value="subjects" className="mt-6 space-y-4">
                {categoryStats.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No subject data yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categoryStats.map((stat, index) => {
                      const Icon = categoryIcons[stat.category] || GraduationCap;
                      return (
                        <motion.div
                          key={stat.category}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <Card className="overflow-hidden" data-testid={`card-subject-${stat.category.toLowerCase().replace(/\//g, '-')}`}>
                            <CardContent className="p-4 md:p-5">
                              <div className="flex items-start gap-3 flex-wrap">
                                <div className={`p-2.5 rounded-xl ${categoryBgClasses[stat.category] || "bg-muted"}`}>
                                  <Icon className={`w-5 h-5 ${categoryColorClasses[stat.category] || "text-muted-foreground"}`} />
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

              <TabsContent value="history" className="mt-6 space-y-3">
                {allResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No results yet.</p>
                  </div>
                ) : (
                  allResults.map((result, index) => {
                    const Icon = categoryIcons[result.category] || GraduationCap;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Card data-testid={`card-result-${index}`}>
                          <CardContent className="p-3 md:p-4">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${categoryBgClasses[result.category] || "bg-muted"}`}>
                                <Icon className={`w-4 h-4 ${categoryColorClasses[result.category] || "text-muted-foreground"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-foreground" data-testid={`text-result-title-${index}`}>{result.quizTitle}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <Badge variant="secondary" className="text-[10px]">
                                    {result.category}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">
                                    {format(parseISO(result.date), "MMM d, yyyy")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right" data-testid={`text-result-accuracy-${index}`}>
                                  <div className={`text-lg font-bold ${
                                    result.accuracy >= 80 ? "text-emerald-500" :
                                    result.accuracy >= 60 ? "text-amber-500" : "text-rose-500"
                                  }`}>
                                    {result.accuracy}%
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {result.correctAnswers}/{result.totalQuestions}
                                  </div>
                                </div>
                                {result.accuracy >= 80 ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 hidden sm:block" />
                                ) : result.accuracy >= 60 ? (
                                  <Target className="w-5 h-5 text-amber-500 hidden sm:block" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-rose-500 hidden sm:block" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
