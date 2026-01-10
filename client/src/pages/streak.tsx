import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Target, Trophy, Calendar, Sparkles, ChevronLeft, ChevronRight, Flame, TrendingUp, Award } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/hooks/useAuth";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isActive: boolean;
}

const motivationalMessages = [
  { minStreak: 0, message: "Start your journey today!", subtext: "Complete a quiz with 9+ questions to begin your streak." },
  { minStreak: 1, message: "Great start! Every journey begins with a single step.", subtext: "Come back tomorrow to keep the fire burning!" },
  { minStreak: 2, message: "Two days strong! You're building momentum.", subtext: "Consistency is the key to mastery." },
  { minStreak: 3, message: "Three days in a row! You're on fire!", subtext: "Your dedication is truly inspiring." },
  { minStreak: 5, message: "Five days! That's a whole school week!", subtext: "You're forming a powerful learning habit." },
  { minStreak: 7, message: "A full week! Incredible commitment!", subtext: "You're in the top 10% of learners." },
  { minStreak: 14, message: "Two weeks of learning! Unstoppable!", subtext: "Your brain is thanking you for this." },
  { minStreak: 21, message: "21 days! They say habits form in 21 days.", subtext: "Learning is now part of who you are." },
  { minStreak: 30, message: "A whole month! You're a legend!", subtext: "Your future self is so proud of you." },
  { minStreak: 50, message: "50 days! Half a century of dedication!", subtext: "You're achieving true greatness." },
  { minStreak: 100, message: "100 DAYS! You're absolutely phenomenal!", subtext: "True mastery in action. Incredible!" },
  { minStreak: 365, message: "ONE FULL YEAR! You're a learning champion!", subtext: "This level of dedication is legendary." },
];

function getMotivationalMessage(streak: number) {
  const sorted = [...motivationalMessages].sort((a, b) => b.minStreak - a.minStreak);
  for (const msg of sorted) {
    if (streak >= msg.minStreak) {
      return msg;
    }
  }
  return motivationalMessages[0];
}

function getStreakEmoji(streak: number): string {
  if (streak >= 100) return "🏆";
  if (streak >= 50) return "⭐";
  if (streak >= 30) return "🔥";
  if (streak >= 14) return "💪";
  if (streak >= 7) return "🎯";
  if (streak >= 3) return "✨";
  return "🌱";
}

function FullCalendar({ streakDates }: { streakDates: string[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const streakSet = useMemo(() => new Set(streakDates), [streakDates]);
  
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
  
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };
  
  const hasStreak = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return streakSet.has(dateStr);
  };

  const isConsecutiveStreak = (day: number, direction: "prev" | "next") => {
    const checkDay = direction === "prev" ? day - 1 : day + 1;
    if (checkDay < 1 || checkDay > daysInMonth) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(checkDay).padStart(2, "0")}`;
    return streakSet.has(dateStr);
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-12" />);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const streakDay = hasStreak(day);
    const today = isToday(day);
    const hasPrevStreak = streakDay && isConsecutiveStreak(day, "prev");
    const hasNextStreak = streakDay && isConsecutiveStreak(day, "next");
    const dayPosition = (firstDayOfMonth + day - 1) % 7;
    const isStartOfRow = dayPosition === 0;
    const isEndOfRow = dayPosition === 6;
    
    const isStreakStart = streakDay && !hasPrevStreak;
    const isStreakEnd = streakDay && !hasNextStreak;
    const wrapAtRowStart = streakDay && hasPrevStreak && isStartOfRow;
    const wrapAtRowEnd = streakDay && hasNextStreak && isEndOfRow;
    const isSingleStreakDay = isStreakStart && isStreakEnd;
    
    days.push(
      <div
        key={day}
        className="h-12 flex items-center justify-center relative overflow-visible"
      >
        {streakDay && !isSingleStreakDay && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-12 bg-orange-200 dark:bg-orange-900"
            style={{
              left: (isStreakStart || wrapAtRowStart) ? 'calc(50% - 24px)' : '-4px',
              right: (isStreakEnd || wrapAtRowEnd) ? 'calc(50% - 24px)' : '-4px',
              borderRadius: `${(isStreakStart || wrapAtRowStart) ? '9999px' : '0'} ${(isStreakEnd || wrapAtRowEnd) ? '9999px' : '0'} ${(isStreakEnd || wrapAtRowEnd) ? '9999px' : '0'} ${(isStreakStart || wrapAtRowStart) ? '9999px' : '0'}`,
            }}
          />
        )}
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all z-10
            ${streakDay ? "bg-orange-400 dark:bg-orange-700 text-white" : ""}
            ${today && !streakDay ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
            ${!streakDay && !today ? "text-muted-foreground" : ""}
          `}
        >
          {day}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          data-testid="button-prev-month"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold text-foreground">{monthName}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          data-testid="button-next-month"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}

export default function StreakPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: streakData, isLoading: streakLoading } = useQuery<StreakData>({
    queryKey: ["/api/user/streak"],
  });

  const { data: streakHistory, isLoading: historyLoading } = useQuery<string[]>({
    queryKey: ["/api/user/streak-history"],
  });

  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user) return null;

  const isLoading = streakLoading || historyLoading;
  const currentStreak = streakData?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? 0;
  const isActive = streakData?.isActive ?? false;
  const motivational = getMotivationalMessage(currentStreak);
  const totalActiveDays = streakHistory?.length ?? 0;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px]"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-orange-500/10 blur-[100px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-6"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Flame className="w-10 h-10 text-orange-500" />
              </motion.div>
            </div>
          ) : (
            <>
              {/* Hero Section with Fire Icon */}
              <motion.div 
                className="text-center mb-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {/* Big Fire Icon */}
                <motion.div 
                  className="relative w-40 h-40 mx-auto mb-6"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-orange-500/30 blur-3xl rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <FontAwesomeIcon 
                    icon={faFire} 
                    className={`w-full h-full relative z-10 drop-shadow-[0_0_40px_rgba(249,115,22,0.6)] ${
                      isActive ? "text-orange-500" : "text-muted-foreground/30"
                    }`}
                  />
                  {isActive && (
                    <motion.div
                      className="absolute -top-2 -right-2 text-3xl"
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {getStreakEmoji(currentStreak)}
                    </motion.div>
                  )}
                </motion.div>

                {/* Streak Count */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className={`text-8xl md:text-9xl font-black leading-none tracking-tighter mb-2 ${
                    isActive ? "text-orange-500" : "text-muted-foreground"
                  }`}>
                    {currentStreak}
                  </div>
                  <div className={`text-xl font-bold uppercase tracking-[0.2em] ${
                    isActive ? "text-orange-500/80" : "text-muted-foreground"
                  }`}>
                    Day Streak
                  </div>
                </motion.div>

                {/* Main Message */}
                <motion.div
                  className="mt-8 max-w-lg mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {currentStreak > 0 
                      ? `You've been studying for ${currentStreak} day${currentStreak > 1 ? 's' : ''} straight!`
                      : "Ready to start your streak?"
                    }
                  </h1>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    <p className="text-lg text-foreground font-medium">{motivational.message}</p>
                    <Sparkles className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-muted-foreground">{motivational.subtext}</p>
                </motion.div>
              </motion.div>

              {/* Stats Cards */}
              <motion.div 
                className="grid grid-cols-3 gap-4 mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="text-center">
                  <CardContent className="p-5">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-3">
                        <FontAwesomeIcon icon={faFire} className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="text-3xl font-bold text-foreground">{currentStreak}</div>
                      <div className="text-sm text-muted-foreground">Current Streak</div>
                    </motion.div>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-5">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-3xl font-bold text-foreground">{longestStreak}</div>
                      <div className="text-sm text-muted-foreground">Longest Streak</div>
                    </motion.div>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-5">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                        <Calendar className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="text-3xl font-bold text-foreground">{totalActiveDays}</div>
                      <div className="text-sm text-muted-foreground">Total Active Days</div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Calendar Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Activity Calendar</h2>
                    </div>
                    <FullCalendar streakDates={streakHistory ?? []} />
                    
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-400" />
                        <span className="text-sm text-muted-foreground">Active Day</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background" />
                        <span className="text-sm text-muted-foreground">Today</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tips Section */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="bg-gradient-to-br from-orange-500/5 via-transparent to-transparent border-orange-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">How Streaks Work</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Complete at least one quiz with more than 8 questions each day to maintain your streak. 
                          Your streak resets if you miss a day. Consistent daily practice is proven to improve 
                          retention and mastery of your study materials.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* CTA */}
              <motion.div
                className="text-center mt-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Button
                  size="lg"
                  onClick={() => setLocation("/")}
                  className="gap-2"
                  data-testid="button-take-quiz"
                >
                  <Flame className="w-5 h-5" />
                  {isActive ? "Keep the Fire Burning" : "Start Your Streak Today"}
                </Button>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
