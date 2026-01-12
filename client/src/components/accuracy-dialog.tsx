import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, Target, Trophy, Zap, Star, ChartLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
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
}

interface AccuracyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  averageAccuracy: number;
  totalAttempts: number;
}

const chartConfig: ChartConfig = {
  accuracy: {
    label: "Accuracy",
    color: "hsl(var(--primary))",
  },
};

function getEncouragingMessage(accuracy: number): { title: string; message: string; icon: typeof Trophy } {
  if (accuracy >= 90) {
    return {
      title: "Outstanding!",
      message: "You're mastering your material. Keep up the excellent work!",
      icon: Trophy,
    };
  } else if (accuracy >= 75) {
    return {
      title: "Great Progress!",
      message: "You're doing well! A little more practice will make you unstoppable.",
      icon: Star,
    };
  } else if (accuracy >= 60) {
    return {
      title: "Keep Going!",
      message: "You're on the right track. Consistency is the key to success!",
      icon: Zap,
    };
  } else {
    return {
      title: "Every Step Counts!",
      message: "Learning takes time. Each quiz brings you closer to mastery!",
      icon: Target,
    };
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

export function AccuracyDialog({ open, onOpenChange, averageAccuracy, totalAttempts }: AccuracyDialogProps) {
  const { data: history = [], isLoading } = useQuery<ResultHistoryItem[]>({
    queryKey: ["/api/user/result-history"],
    enabled: open,
  });

  const encouragement = getEncouragingMessage(averageAccuracy);
  const EncouragementIcon = encouragement.icon;
  const trend = getTrend(history);

  const chartData = history.slice(-20).map((item, index) => ({
    index: index + 1,
    date: format(parseISO(item.date), "M/d"),
    accuracy: item.accuracy,
    quizTitle: item.quizTitle,
  }));

  const recentResults = history.slice(-5).reverse();

  const accuracyDistribution = [
    { range: "90-100%", count: history.filter(h => h.accuracy >= 90).length, fill: "hsl(142, 76%, 36%)" },
    { range: "75-89%", count: history.filter(h => h.accuracy >= 75 && h.accuracy < 90).length, fill: "hsl(142, 71%, 45%)" },
    { range: "60-74%", count: history.filter(h => h.accuracy >= 60 && h.accuracy < 75).length, fill: "hsl(48, 96%, 53%)" },
    { range: "40-59%", count: history.filter(h => h.accuracy >= 40 && h.accuracy < 60).length, fill: "hsl(25, 95%, 53%)" },
    { range: "0-39%", count: history.filter(h => h.accuracy < 40).length, fill: "hsl(0, 84%, 60%)" },
  ].filter(d => d.count > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Your Progress
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 border border-primary/20"
          >
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-10">
              <EncouragementIcon className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 sm:p-2.5 rounded-full bg-primary/20 flex-shrink-0">
                <EncouragementIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">{encouragement.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 sm:mt-1">{encouragement.message}</p>
              </div>
            </div>

            <div className="mt-4 sm:mt-5 grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary">{averageAccuracy}%</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Avg. Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{totalAttempts}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Quizzes Taken</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                  {trend.trend === "up" && <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />}
                  {trend.trend === "down" && <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />}
                  <span className={`text-xl sm:text-2xl font-bold ${
                    trend.trend === "up" ? "text-emerald-500" : 
                    trend.trend === "down" ? "text-rose-500" : "text-muted-foreground"
                  }`}>
                    {trend.trend === "up" ? `+${trend.change}%` : 
                     trend.trend === "down" ? `-${trend.change}%` : "—"}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Recent Trend</div>
              </div>
            </div>
          </motion.div>

          {history.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Accuracy Over Time</h4>
              <Card>
                <CardContent className="p-2 sm:p-4 pt-3 sm:pt-4">
                  <ChartContainer config={chartConfig} className="h-[140px] sm:h-[180px] w-full">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                        width={35}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => (
                              <div className="space-y-1">
                                <div className="font-medium text-xs">{item.payload.quizTitle}</div>
                                <div className="text-primary font-bold text-sm">{value}%</div>
                              </div>
                            )}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="accuracy"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#accuracyGradient)"
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 2 }}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {accuracyDistribution.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Score Distribution</h4>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {accuracyDistribution.map((item) => (
                      <div key={item.range} className="flex items-center gap-2 sm:gap-3">
                        <div className="w-14 sm:w-16 text-[10px] sm:text-xs text-muted-foreground">{item.range}</div>
                        <div className="flex-1">
                          <div className="h-5 sm:h-6 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / history.length) * 100}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: item.fill }}
                            />
                          </div>
                        </div>
                        <div className="w-8 sm:w-10 text-[10px] sm:text-xs text-right font-medium">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {recentResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Recent Results</h4>
              <div className="space-y-2">
                {recentResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-2.5 sm:p-3">
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{result.quizTitle}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {format(parseISO(result.date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className={`text-base sm:text-lg font-bold ${
                                result.accuracy >= 80 ? "text-emerald-500" :
                                result.accuracy >= 60 ? "text-amber-500" : "text-rose-500"
                              }`}>
                                {result.accuracy}%
                              </div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">
                                {result.correctAnswers}/{result.totalQuestions}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {history.length === 0 && !isLoading && (
            <div className="text-center py-6 sm:py-8">
              <Target className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
              <p className="text-sm text-muted-foreground">Take some quizzes to see your progress!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
