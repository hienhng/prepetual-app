import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, Sparkles } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/hooks/useAuth";

const motivationalMessages = [
  { streak: 1, message: "Great start! Every journey begins with a single step.", subtext: "Come back tomorrow to keep the fire burning!" },
  { streak: 2, message: "Two days strong! You're building momentum.", subtext: "Consistency is key to mastery." },
  { streak: 3, message: "Three days in a row! You're on fire!", subtext: "Your dedication is inspiring." },
  { streak: 5, message: "Five days! That's a whole school week!", subtext: "You're forming a powerful habit." },
  { streak: 7, message: "A full week! Incredible commitment!", subtext: "You're in the top 10% of learners." },
  { streak: 14, message: "Two weeks of learning! Unstoppable!", subtext: "Your brain is thanking you." },
  { streak: 21, message: "21 days! They say habits form in 21 days.", subtext: "Learning is now part of who you are." },
  { streak: 30, message: "A whole month! You're a legend!", subtext: "Your future self is proud of you." },
  { streak: 50, message: "50 days! Half a century of dedication!", subtext: "You're achieving greatness." },
  { streak: 100, message: "100 DAYS! You're absolutely phenomenal!", subtext: "True mastery in action." },
];

function getMotivationalMessage(streak: number) {
  const sorted = [...motivationalMessages].sort((a, b) => b.streak - a.streak);
  for (const msg of sorted) {
    if (streak >= msg.streak) {
      return msg;
    }
  }
  return motivationalMessages[0];
}

function WeekCalendar({ streakDays }: { streakDays: string[] }) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push(date);
  }
  
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  
  return (
    <div className="flex justify-center gap-2">
      {weekDays.map((date, index) => {
        const dateStr = date.toISOString().split('T')[0];
        const isStreak = streakDays.includes(dateStr);
        const isToday = date.toDateString() === today.toDateString();
        const day = date.getDate();
        
        const prevDate = new Date(date);
        prevDate.setDate(date.getDate() - 1);
        const prevDateStr = prevDate.toISOString().split('T')[0];
        const hasPrevStreak = streakDays.includes(prevDateStr);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        const hasNextStreak = streakDays.includes(nextDateStr);
        
        const isStreakStart = isStreak && !hasPrevStreak;
        const isStreakEnd = isStreak && !hasNextStreak;
        const isSingleStreak = isStreakStart && isStreakEnd;
        
        const isStartOfRow = index === 0;
        const isEndOfRow = index === 6;
        const wrapAtRowStart = isStreak && hasPrevStreak && isStartOfRow;
        const wrapAtRowEnd = isStreak && hasNextStreak && isEndOfRow;
        
        const streakIndex = isStreak ? streakDays.indexOf(dateStr) : 0;
        const animationDelay = 0.1 * streakIndex;
        
        return (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{dayNames[index]}</span>
            <div className="relative w-12 h-12 flex items-center justify-center overflow-visible">
              {isStreak && !isSingleStreak && (
                <motion.div 
                  className="absolute top-0 h-12 bg-orange-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
                  style={{
                    left: (isStreakStart || wrapAtRowStart) ? 'calc(50% - 24px)' : '-4px',
                    right: (isStreakEnd || wrapAtRowEnd) ? 'calc(50% - 24px)' : '-4px',
                    borderRadius: `${(isStreakStart || wrapAtRowStart) ? '9999px' : '0'} ${(isStreakEnd || wrapAtRowEnd) ? '9999px' : '0'} ${(isStreakEnd || wrapAtRowEnd) ? '9999px' : '0'} ${(isStreakStart || wrapAtRowStart) ? '9999px' : '0'}`,
                  }}
                />
              )}
              <div className="relative w-10 h-10 z-10">
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-full text-sm font-bold
                    ${!isStreak && isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                    ${!isStreak ? "text-muted-foreground bg-muted/30" : "bg-muted/30 text-muted-foreground"}
                  `}
                >
                  {day}
                </div>
                {isStreak && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center rounded-full text-sm font-bold bg-orange-500 text-white"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: animationDelay + 0.2, duration: 0.4, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {day}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StreakComplete() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<{ currentStreak: number; streakDays: string[] } | null>(null);
  const [revealProgress, setRevealProgress] = useState(0);
  
  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }
    
    Promise.all([
      fetch("/api/user/streak").then(res => res.json()),
      fetch("/api/user/streak-history").then(res => res.json())
    ])
      .then(([streakInfo, streakHistory]) => {
        setStreakData({
          currentStreak: streakInfo.currentStreak || 1,
          streakDays: streakHistory || []
        });
        setTimeout(() => setRevealProgress(1), 500);
      })
      .catch(() => {
        setStreakData({ currentStreak: 1, streakDays: [] });
        setTimeout(() => setRevealProgress(1), 500);
      });
  }, [user, setLocation]);
  
  if (!streakData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  const motivational = getMotivationalMessage(streakData.currentStreak);
  
  const goHome = () => {
    setLocation(user ? "/dashboard" : "/");
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="relative flex flex-col items-center max-w-md w-full"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 w-64 h-64 bg-quiz-orange blur-[100px] rounded-full -z-10"
        />
        
        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
          <FontAwesomeIcon 
            icon={faFire}
            className="w-full h-full text-muted-foreground/10 absolute" 
            style={{ filter: "grayscale(100%)" }}
          />
          
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ clipPath: "circle(0% at 50% 50%)" }}
            animate={{ clipPath: revealProgress ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)" }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            <motion.div
              className="w-full h-full"
              animate={revealProgress ? {
                scale: [1, 1.05, 1],
                y: [0, -5, 0],
              } : {}}
              transition={{
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <FontAwesomeIcon icon={faFire} className="w-full h-full text-quiz-orange drop-shadow-[0_0_30px_rgba(249,115,22,0.8)]" />
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={revealProgress ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="text-8xl font-black text-quiz-orange leading-none tracking-tighter drop-shadow-xl mb-2">
            {streakData.currentStreak}
          </div>
          <div className="text-sm font-bold text-quiz-orange/80 uppercase tracking-[0.3em]">
            Day Streak
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={revealProgress ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-quiz-orange" fill="currentColor" />
            <h2 className="text-xl font-bold text-foreground">{motivational.message}</h2>
            <Sparkles className="h-5 w-5 text-quiz-orange" fill="currentColor" />
          </div>
          <p className="text-muted-foreground">{motivational.subtext}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={revealProgress ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="w-full mb-10"
        >
          <WeekCalendar streakDays={streakData.streakDays} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={revealProgress ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Button
            onClick={goHome}
            size="lg"
            className="gap-2 px-8"
            data-testid="button-continue-home"
          >
            <Home className="h-5 w-5" />
            Continue
          </Button>
        </motion.div>
        
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
              x: (Math.random() - 0.5) * 400,
              y: (Math.random() - 0.5) * 400,
            }}
            transition={{ 
              duration: Math.random() * 3 + 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute top-1/4 w-2 h-2 bg-gradient-to-t from-quiz-orange to-yellow-400 rounded-full blur-[1px] -z-10"
          />
        ))}
      </motion.div>
    </div>
  );
}
