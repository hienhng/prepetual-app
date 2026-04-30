import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import {
  ArrowRight,
  ArrowUp,
  ArrowLeft,
  CheckCircle2,
  Upload,
  Brain,
  Zap,
  BookOpen,
  Share2,
  RotateCcw,
  Sparkles,
  Play,
  Eye,
  Target,
  Users,
  Star,
  ChevronRight,
  ChevronLeft,
  Layers,
  GraduationCap,
  Trophy,
  MousePointer2,
  Check,
  MessageCircle,
  FileText,
  File,
  Image,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  ArrowDown,
  CheckCheck,
  Import,
  ClipboardCheck,
  CircleDot,
  Shield,
  ListCheck,
  Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import { useQuiz } from "@/lib/quiz-context";
import { useAuth } from "@/hooks/useAuth";
import { useAuthDialog } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImage from "@assets/image_1765894870887.png";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import { Footer } from "@/components/footer";

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function Doodle({
  d,
  color,
  className,
  delay = 0,
  width,
  height,
  viewBox = "0 0 100 100",
  strokeW = 2.5,
  fill = false,
  animate: shouldAnimate = true,
}: {
  d: string;
  color: string;
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  viewBox?: string;
  strokeW?: number;
  fill?: boolean;
  animate?: boolean;
}) {
  return (
    <motion.svg
      {...(width ? { width, height: height || width } : {})}
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="none"
      className={cn("pointer-events-none", color, className)}
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 200 }}
    >
      {shouldAnimate ? (
        <motion.path
          d={d}
          stroke="currentColor"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={fill ? "currentColor" : "none"}
          fillOpacity={fill ? 0.12 : 0}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay, duration: 0.8, ease: "easeOut" }}
        />
      ) : (
        <path
          d={d}
          stroke="currentColor"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={fill ? "currentColor" : "none"}
          fillOpacity={fill ? 0.12 : 0}
        />
      )}
    </motion.svg>
  );
}

const D = {
  wavyUnderline: "M3 9C20 5 40 11 60 7C80 3 100 12 120 6C140 2 160 10 197 5",
  loopUnderline:
    "M5 12C15 4 25 4 30 12C35 20 45 4 55 4C65 4 70 16 80 12C90 8 95 4 100 8C110 12 120 4 130 8C140 12 155 4 165 8C175 12 185 6 195 8",
  doubleUnderline:
    "M5 6C40 3 80 9 120 4C150 0 180 7 195 5 M5 14C30 10 70 16 110 11C150 7 180 14 195 12",
  zigzagUnderline:
    "M5 10L15 4L25 10L35 4L45 10L55 4L65 10L75 4L85 10L95 4L105 10L115 4L125 10L135 4L145 10L155 4L165 10L175 4L185 10L195 4",
  star: "M20 4L23 15L34 15L25 22L28 33L20 27L12 33L15 22L6 15L17 15Z",
  sparkle4: "M15 3L17 12L26 15L17 18L15 27L13 18L4 15L13 12Z",
  sparkle6:
    "M20 2L22 14L32 8L24 17L34 22L22 21L20 33L18 21L6 22L16 17L8 8L18 14Z",
  heart:
    "M20 14C20 8 28 4 28 12C28 18 20 26 20 26C20 26 12 18 12 12C12 4 20 8 20 14Z",
  lightning: "M18 4L12 18H20L14 34L28 16H20L26 4Z",
  arrow: "M5 20C15 18 25 10 35 12C45 14 50 8 55 6M48 3L55 6L52 13",
  curlyArrow: "M8 28C8 14 18 6 28 8C38 10 40 22 32 26M25 22L32 26L28 32",
  circle:
    "M20 6C32 4 38 14 38 22C38 30 30 38 20 38C10 38 2 28 2 20C2 12 10 6 20 6Z",
  spiral:
    "M22 22C22 18 26 18 26 22C26 28 16 28 16 20C16 12 28 12 28 24C28 32 14 32 14 18",
  book: "M20 8L20 34 M20 8C16 7 8 5 4 8L4 33C8 30 16 31 20 34 M20 8C24 7 32 5 36 8L36 33C32 30 24 31 20 34",
  pencil:
    "M8 34L26 14L30 18L12 38L6 36Z M26 14L28 10C29 9 31 9 32 10L34 12C35 13 35 15 34 16L30 18",
  lightbulb:
    "M16 30L24 30 M17 33L23 33 M20 33L20 36 M14 24C14 18 16 10 20 10C24 10 26 18 26 24C26 27 24 29 22 30L18 30C16 29 14 27 14 24",
  rocket:
    "M20 6C16 14 14 22 16 30L20 33L24 30C26 22 24 14 20 6 M16 26L10 30 M24 26L30 30",
  trophy:
    "M10 10L30 10L28 22C27 26 24 28 20 30C16 28 13 26 12 22L10 10 M8 10L6 16 M32 10L34 16 M16 30L16 34L24 34L24 30 M14 34L26 34",
  music:
    "M22 8L22 28C22 31 18 31 18 28C18 25 22 25 22 28 M22 8L30 6L30 24C30 27 26 27 26 24C26 21 30 21 30 24",
  flower:
    "M20 20C20 14 26 14 26 20 M20 20C26 20 26 26 20 26 M20 20C20 26 14 26 14 20 M20 20C14 20 14 14 20 14 M20 26L20 36",
  sun: "M20 12C24 12 28 16 28 20C28 24 24 28 20 28C16 28 12 24 12 20C12 16 16 12 20 12 M20 4L20 8 M20 32L20 36 M4 20L8 20 M32 20L36 20 M8 8L11 11 M29 29L32 32 M32 8L29 11 M11 29L8 32",
  cloud:
    "M12 24C6 24 4 18 8 16C6 12 10 8 16 10C18 6 26 6 28 10C34 8 36 14 32 18C36 20 34 24 30 24Z",
  crown: "M6 28L10 12L16 20L20 8L24 20L30 12L34 28Z",
  diamond: "M20 4L36 20L20 36L4 20Z",
  check: "M8 20L16 28L32 10",
  paperPlane: "M4 20L36 6L24 34L20 22L4 20 M20 22L36 6",
  swirl: "M28 20C28 12 20 8 14 14C8 20 14 28 20 28C28 28 32 20 28 14",
  dots3:
    "M10 20 M10 18C11 18 12 19 12 20C12 21 11 22 10 22C9 22 8 21 8 20C8 19 9 18 10 18 M20 18C21 18 22 19 22 20C22 21 21 22 20 22C19 22 18 21 18 20C18 19 19 18 20 18 M30 18C31 18 32 19 32 20C32 21 31 22 30 22C29 22 28 21 28 20C28 19 29 18 30 18",
  wave: "M4 20C8 12 14 12 18 20C22 28 28 28 32 20C36 12 40 12 44 20",
};

function HandwrittenPaper() {
  return (
    <div
      className="w-full h-full bg-[#fdf6e3] relative overflow-hidden select-none"
      style={{ fontFamily: "'Indie Flower', cursive" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(transparent, transparent 24px, #c4daf422 24px, #c4daf422 25px)",
        }}
      />
      <div
        className="absolute left-[48px] md:left-[64px] lg:left-[80px] top-0 bottom-0 w-[1px] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, #e8a0a0aa 10%, #e8a0a0aa 90%, transparent)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 pl-[56px] pr-4 pt-4 pb-4 md:pl-[72px] md:pr-6 md:pt-6 md:pb-6 lg:pl-[88px] lg:pr-8 lg:pt-7 lg:pb-7">
        <div className="mb-1 md:mb-2">
          <span
            className="text-[13px] md:text-[16px] lg:text-[18px] font-bold text-gray-800"
            style={{ transform: "rotate(-0.5deg)", display: "inline-block" }}
          >
            Cell Biology - Ch. 5 Notes
          </span>
          <svg
            className="w-[140px] md:w-[180px] lg:w-[210px] h-[4px] block mt-[-1px]"
            viewBox="0 0 140 4"
            fill="none"
          >
            <path
              d="M2 2.5 Q 30 0.5, 70 2.2 Q 100 3.5, 138 1.5"
              stroke="#374151"
              strokeWidth="0.8"
              opacity="0.5"
              fill="none"
            />
          </svg>
        </div>

        <div
          className="mt-3 mb-2.5 md:mt-4 md:mb-3"
          style={{ transform: "rotate(0.3deg)" }}
        >
          <p
            className="text-[11px] md:text-[13px] lg:text-[14px] text-gray-700 leading-[22px] md:leading-[28px] lg:leading-[30px] tracking-[-0.01em]"
            style={{ transform: "rotate(-0.2deg)" }}
          >
            <span className="font-bold text-gray-800">Mitochondria</span> =
            "powerhouse of the cell"
          </p>
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-600 leading-[22px] md:leading-[28px] lg:leading-[30px] ml-2 md:ml-3 mt-0.5"
            style={{ transform: "rotate(0.4deg)" }}
          >
            - produces ATP (energy!)
          </p>
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-600 leading-[22px] md:leading-[28px] lg:leading-[30px] ml-2 md:ml-3"
            style={{ transform: "rotate(-0.3deg)" }}
          >
            - through cellular respiration
          </p>
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-600 leading-[22px] md:leading-[28px] lg:leading-[30px] ml-2 md:ml-3"
            style={{ transform: "rotate(0.2deg)" }}
          >
            - has double membrane
          </p>
        </div>

        <svg
          className="w-full h-[34px] md:h-[42px] lg:h-[48px] my-1 md:my-1.5"
          viewBox="0 0 220 34"
          fill="none"
        >
          <ellipse
            cx="110"
            cy="17"
            rx="30"
            ry="12"
            stroke="#6b7280"
            strokeWidth="0.7"
            fill="#fef9c3"
            fillOpacity="0.3"
            transform="rotate(-2 110 17)"
          />
          <ellipse
            cx="110"
            cy="17"
            rx="22"
            ry="8"
            stroke="#6b7280"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2 1.5"
            transform="rotate(1 110 17)"
          />
          <path
            d="M87 11 Q 95 8, 110 9 Q 125 10, 133 13"
            stroke="#6b7280"
            strokeWidth="0.4"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M85 20 Q 98 22, 110 21 Q 120 20, 135 22"
            stroke="#6b7280"
            strokeWidth="0.4"
            fill="none"
            opacity="0.6"
          />
          <text
            x="155"
            y="13"
            fill="#6b7280"
            fontSize="5.5"
            fontFamily="'Indie Flower', cursive"
            opacity="0.7"
            transform="rotate(-1 155 13)"
          >
            outer
          </text>
          <line
            x1="145"
            y1="12"
            x2="136"
            y2="14"
            stroke="#6b7280"
            strokeWidth="0.4"
            opacity="0.5"
          />
          <text
            x="155"
            y="23"
            fill="#6b7280"
            fontSize="5.5"
            fontFamily="'Indie Flower', cursive"
            opacity="0.7"
            transform="rotate(0.5 155 23)"
          >
            inner
          </text>
          <line
            x1="145"
            y1="22"
            x2="132"
            y2="20"
            stroke="#6b7280"
            strokeWidth="0.4"
            opacity="0.5"
          />
          <text
            x="42"
            y="20"
            fill="#9ca3af"
            fontSize="5"
            fontFamily="'Indie Flower', cursive"
            opacity="0.6"
            transform="rotate(-1 42 20)"
          >
            cristae folds ^
          </text>
          <path
            d="M66 18 Q 75 14, 88 15"
            stroke="#9ca3af"
            strokeWidth="0.35"
            fill="none"
            opacity="0.5"
            markerEnd=""
          />
        </svg>

        <div
          className="mt-1 mb-2 md:mt-2 md:mb-2.5"
          style={{ transform: "rotate(-0.2deg)" }}
        >
          <p
            className="text-[11px] md:text-[13px] lg:text-[14px] text-gray-700 leading-[22px] md:leading-[28px] lg:leading-[30px]"
            style={{ transform: "rotate(0.3deg)" }}
          >
            <span className="font-bold text-gray-800">Key process:</span>{" "}
            glucose + O₂ → ATP
          </p>
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-500 leading-[22px] md:leading-[28px] lg:leading-[30px] ml-2 md:ml-3 italic"
            style={{ transform: "rotate(-0.4deg)" }}
          >
            (36-38 ATP per glucose molecule)
          </p>
        </div>

        <div
          className="mt-2 relative md:mt-3"
          style={{ transform: "rotate(0.4deg)" }}
        >
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-600 leading-[22px] md:leading-[28px] lg:leading-[30px]"
            style={{ transform: "rotate(-0.3deg)" }}
          >
            Q: primary function of mitochondria?
          </p>
          <div className="ml-3 md:ml-4 mt-0.5 relative inline-block">
            <span
              className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-700 font-semibold"
              style={{ transform: "rotate(0.2deg)", display: "inline-block" }}
            >
              → Energy production (ATP)
            </span>
            <svg
              className="absolute -left-1 top-1/2 -translate-y-1/2 w-[calc(100%+8px)] h-[16px] md:h-[20px] pointer-events-none"
              viewBox="0 0 160 16"
              preserveAspectRatio="none"
            >
              <ellipse
                cx="80"
                cy="8"
                rx="76"
                ry="6.5"
                fill="none"
                stroke="#4a8fe2"
                strokeWidth="0.9"
                opacity="0.35"
                transform="rotate(-0.8 80 8)"
              />
            </svg>
          </div>
        </div>

        <svg
          className="w-[80%] h-[2px] my-2.5 md:my-3 ml-1"
          viewBox="0 0 180 2"
          fill="none"
        >
          <path
            d="M0 1 Q 40 0, 90 1.2 Q 140 2, 180 0.8"
            stroke="#d1d5db"
            strokeWidth="0.5"
            opacity="0.6"
            fill="none"
          />
        </svg>

        <div
          className="mt-1 mb-2 md:mt-2 md:mb-2.5"
          style={{ transform: "rotate(-0.3deg)" }}
        >
          <p
            className="text-[11px] md:text-[13px] lg:text-[14px] text-gray-800 font-bold leading-[22px] md:leading-[28px] lg:leading-[30px]"
            style={{ transform: "rotate(0.2deg)" }}
          >
            Other organelles:
          </p>
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-600 leading-[22px] md:leading-[28px] lg:leading-[30px] ml-2 md:ml-3"
            style={{ transform: "rotate(0.3deg)" }}
          >
            - Ribosomes → protein synthesis
          </p>
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-600 leading-[22px] md:leading-[28px] lg:leading-[30px] ml-2 md:ml-3"
            style={{ transform: "rotate(-0.2deg)" }}
          >
            - ER (rough = ribosomes, smooth = lipids)
          </p>
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-600 leading-[22px] md:leading-[28px] lg:leading-[30px] ml-2 md:ml-3 relative"
            style={{ transform: "rotate(0.4deg)" }}
          >
            <span className="line-through decoration-red-400/40">
              - Lysosomes break down food
            </span>
            <span className="text-[9px] md:text-[10.5px] text-red-400/50 ml-1 italic">
              *waste, not food
            </span>
          </p>
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-600 leading-[22px] md:leading-[28px] lg:leading-[30px] ml-2 md:ml-3"
            style={{ transform: "rotate(-0.1deg)" }}
          >
            - Golgi body → packages proteins
          </p>
        </div>

        <div
          className="mt-2 mb-1 md:mt-2.5 md:mb-1.5"
          style={{ transform: "rotate(0.2deg)" }}
        >
          <p
            className="text-[10px] md:text-[12px] lg:text-[13px] text-gray-500 leading-[20px] md:leading-[26px] lg:leading-[28px] italic"
            style={{ transform: "rotate(-0.3deg)" }}
          >
            remember: "cells are like tiny factories"
          </p>
          <p
            className="text-[10px] md:text-[12px] lg:text-[13px] text-gray-500 leading-[20px] md:leading-[26px] lg:leading-[28px] ml-2 md:ml-3"
            style={{ transform: "rotate(0.5deg)" }}
          >
            each organelle = different department
          </p>
        </div>

        <div
          className="mt-2.5 relative md:mt-3"
          style={{ transform: "rotate(-0.4deg)" }}
        >
          <p
            className="text-[10.5px] md:text-[12.5px] lg:text-[13.5px] text-gray-700 leading-[22px] md:leading-[28px] lg:leading-[30px]"
            style={{ transform: "rotate(0.2deg)" }}
          >
            <span className="font-bold">Test review:</span>
          </p>
          <p
            className="text-[10px] md:text-[12px] lg:text-[13px] text-gray-500 leading-[20px] md:leading-[26px] lg:leading-[28px] ml-2 md:ml-3"
            style={{ transform: "rotate(-0.2deg)" }}
          >
            ☐ memorize organelle functions
          </p>
          <p
            className="text-[10px] md:text-[12px] lg:text-[13px] text-gray-500 leading-[20px] md:leading-[26px] lg:leading-[28px] ml-2 md:ml-3"
            style={{ transform: "rotate(0.3deg)" }}
          >
            ☐ draw + label cell diagram
          </p>
          <p
            className="text-[10px] md:text-[12px] lg:text-[13px] text-gray-500 leading-[20px] md:leading-[26px] lg:leading-[28px] ml-2 md:ml-3"
            style={{ transform: "rotate(-0.1deg)" }}
          >
            ☑ ATP production steps
          </p>
        </div>

        <svg
          className="absolute bottom-[70px] md:bottom-[90px] right-[12px] md:right-[20px] w-[45px] md:w-[60px] lg:w-[70px] h-[45px] md:h-[60px] lg:h-[70px] pointer-events-none"
          viewBox="0 0 45 45"
          fill="none"
        >
          <circle
            cx="22"
            cy="22"
            r="16"
            stroke="#d1d5db"
            strokeWidth="0.5"
            fill="none"
            opacity="0.3"
            transform="rotate(3 22 22)"
          />
          <circle
            cx="22"
            cy="22"
            r="5"
            stroke="#d1d5db"
            strokeWidth="0.4"
            fill="#fef9c3"
            fillOpacity="0.2"
            opacity="0.3"
          />
          <line
            x1="22"
            y1="6"
            x2="22"
            y2="14"
            stroke="#d1d5db"
            strokeWidth="0.35"
            opacity="0.25"
          />
          <line
            x1="22"
            y1="30"
            x2="22"
            y2="38"
            stroke="#d1d5db"
            strokeWidth="0.35"
            opacity="0.25"
          />
          <line
            x1="6"
            y1="22"
            x2="14"
            y2="22"
            stroke="#d1d5db"
            strokeWidth="0.35"
            opacity="0.25"
          />
          <line
            x1="30"
            y1="22"
            x2="38"
            y2="22"
            stroke="#d1d5db"
            strokeWidth="0.35"
            opacity="0.25"
          />
          <text
            x="22"
            y="24"
            fill="#9ca3af"
            fontSize="4"
            textAnchor="middle"
            fontFamily="'Indie Flower', cursive"
            opacity="0.4"
          >
            cell
          </text>
        </svg>

        <div className="absolute top-4 right-3 md:top-6 md:right-5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            className="md:w-[28px] md:h-[28px] lg:w-[32px] lg:h-[32px]"
          >
            <path
              d="M6 2 L16 2 Q20 2 20 6 L20 16 Q20 20 16 20 L6 20 Q2 20 2 16 L2 6 Q2 2 6 2Z"
              stroke="#d1d5db"
              strokeWidth="0.6"
              fill="none"
              opacity="0.5"
              transform="rotate(2 11 11)"
            />
            <path
              d="M6 8 L16 8 M6 12 L14 12 M6 16 L10 16"
              stroke="#d1d5db"
              strokeWidth="0.5"
              opacity="0.35"
            />
          </svg>
        </div>

        <div
          className="absolute bottom-3 right-4 md:bottom-4 md:right-6 text-[8px] md:text-[10px] text-gray-400/50 italic"
          style={{ transform: "rotate(-1deg)" }}
        >
          pg. 47-48
        </div>

        <svg
          className="absolute top-[60px] md:top-[76px] right-[10px] md:right-[16px] w-[14px] md:w-[18px] h-[40px] md:h-[50px] pointer-events-none"
          viewBox="0 0 14 40"
          fill="none"
        >
          <path
            d="M7 2 L7 32 M3 28 L7 34 L11 28"
            stroke="#d97706"
            strokeWidth="0.7"
            opacity="0.3"
          />
        </svg>

        <div
          className="absolute top-[54px] md:top-[68px] right-[28px] md:right-[38px] text-[7px] md:text-[9px] text-amber-600/30 italic"
          style={{ transform: "rotate(-2deg)" }}
        >
          imp!
        </div>
      </div>
    </div>
  );
}

function PrepetualQuizPlayer() {
  const q = {
    num: 1,
    total: 3,
    q: "What is the primary function of mitochondria in a cell?",
    options: [
      { label: "A", text: "Energy production", correct: true, selected: true },
      {
        label: "B",
        text: "Protein synthesis",
        correct: false,
        selected: false,
      },
      { label: "C", text: "Cell division", correct: false, selected: false },
      { label: "D", text: "Waste removal", correct: false, selected: false },
    ],
  };

  const progress = (q.num / q.total) * 100;

  return (
    <div className="w-full h-full bg-background flex flex-col overflow-hidden">
      <div className="px-5 pt-4 pb-2.5 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-brand text-[13px] font-bold text-primary tracking-tight">
            prepetual
          </span>
        </div>
        <div className="h-1 bg-muted/80 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground font-medium">
            Question {q.num} of {q.total}
          </span>
          <span className="text-[9px] text-muted-foreground/70">
            Multiple Choice
          </span>
        </div>
      </div>

      <div className="flex-1 px-5 py-4 overflow-hidden">
        <div className="px-3 py-2.5 rounded-lg bg-muted/40 border border-border/30 mb-3.5">
          <p className="text-[11.5px] font-medium text-foreground leading-relaxed">
            {q.q}
          </p>
        </div>

        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.6 + i * 0.08,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`px-3 py-2 rounded-lg border text-[10.5px] font-medium flex items-center gap-2.5 transition-colors ${opt.correct && opt.selected
                ? "border-green-500/40 bg-green-500/8 text-green-700 dark:text-green-400"
                : "border-border/60 bg-card/50 text-foreground"
                }`}
            >
              <div
                className={`w-[18px] h-[18px] rounded-md flex items-center justify-center text-[8px] font-bold shrink-0 ${opt.correct && opt.selected
                  ? "bg-green-500 text-white"
                  : "bg-muted/80 text-muted-foreground border border-border/40"
                  }`}
              >
                {opt.correct && opt.selected ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  opt.label
                )}
              </div>
              <span>{opt.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 px-3 py-2.5 rounded-lg bg-green-500/5 border border-green-500/15"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-[9px] font-semibold text-green-700 dark:text-green-400">
              Correct!
            </span>
          </div>
          <p className="text-[8.5px] text-green-700/70 dark:text-green-400/70 leading-relaxed">
            Mitochondria are known as the powerhouse of the cell, producing ATP
            through cellular respiration.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function AIQuizzesChar({ char, index }: { char: string; index: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isAnimating = useRef(false);

  const triggerBounce = () => {
    if (isAnimating.current || !ref.current) return;
    isAnimating.current = true;
    animate(
      ref.current,
      {
        y: [0, -6, 0],
        filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
      },
      {
        delay: index * 0.04,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
        onComplete: () => {
          isAnimating.current = false;
        },
      },
    );
  };

  return (
    <motion.span
      ref={ref}
      className="inline-block bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent bg-[length:200%_100%]"
      initial={{ opacity: 0, y: 30, rotateX: -90 }}
      animate={{
        opacity: 1,
        y: 0,
        rotateX: 0,
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        opacity: {
          delay: 0.45 + index * 0.04,
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        },
        y: {
          delay: 0.45 + index * 0.04,
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        },
        rotateX: {
          delay: 0.45 + index * 0.04,
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        },
        backgroundPosition: {
          delay: 1.2,
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      onMouseEnter={triggerBounce}
      style={{ cursor: "default" }}
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}

function AIQuizzesText() {
  const chars = "talk back".split("");
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const waveRunning = useRef(false);

  const triggerWave = () => {
    if (waveRunning.current) return;
    waveRunning.current = true;
    chars.forEach((_, i) => {
      const el = charRefs.current[i];
      if (!el) return;
      animate(
        el,
        {
          y: [0, -6, 0],
          filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
        },
        {
          delay: i * 0.04,
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
          onComplete: () => {
            if (i === chars.length - 1) waveRunning.current = false;
          },
        },
      );
    });
  };

  return (
    <span className="relative inline-block">
      <span className="relative cursor-default" onMouseEnter={triggerWave}>
        {chars.map((char, i) => (
          <motion.span
            key={i}
            ref={(el) => {
              charRefs.current[i] = el;
            }}
            className="inline-block bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent bg-[length:200%_100%] custom-highlight"
            style={{ fontFamily: "'Zen Dots', cursive" }}
            initial={{ opacity: 0, y: 30, rotateX: -90 }}
            animate={{
              opacity: 1,
              y: 0,
              rotateX: 0,
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              opacity: {
                delay: 0.45 + i * 0.04,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              },
              y: {
                delay: 0.45 + i * 0.04,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              },
              rotateX: {
                delay: 0.45 + i * 0.04,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              },
              backgroundPosition: {
                delay: 1.2,
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
        <motion.span
          className="absolute -inset-x-8 -inset-y-4 blur-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0.3, 0.4] }}
          transition={{ delay: 0.9, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(48 96% 53% / 0.18) 0%, transparent 70%)",
          }}
        />
        <motion.span
          className="absolute -inset-x-10 -inset-y-6 blur-3xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{
            delay: 1.2,
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(48 96% 53% / 0.12) 0%, transparent 70%)",
          }}
        />
      </span>
      <Doodle
        d={D.loopUnderline}
        color="text-primary/40"
        className="absolute -bottom-2 left-0 w-full h-3"
        viewBox="0 0 200 20"
        delay={1}
      />
    </span>
  );
}

function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [circleSize, setCircleSize] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useMotionValue(0);
  const smoothY = useMotionValue(0);
  const targetSize = useRef(0);
  const currentSize = useRef(0);
  const rafRef = useRef<number>(0);
  const hasInteracted = useRef(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const hintTimer = setTimeout(() => {
      if (!hasInteracted.current) setShowHint(true);
    }, 2000);
    return () => clearTimeout(hintTimer);
  }, []);

  useEffect(() => {
    let active = true;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      if (!active) return;
      smoothX.set(lerp(smoothX.get(), mouseX.get(), 0.12));
      smoothY.set(lerp(smoothY.get(), mouseY.get(), 0.12));
      currentSize.current = lerp(currentSize.current, targetSize.current, 0.1);
      setCircleSize(currentSize.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const getRelativePos = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    hasInteracted.current = true;
    setShowHint(false);
    setIsRevealing(true);
    getRelativePos(e);
    smoothX.set(
      e.clientX - (containerRef.current?.getBoundingClientRect().left || 0),
    );
    smoothY.set(
      e.clientY - (containerRef.current?.getBoundingClientRect().top || 0),
    );
    targetSize.current = 280;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    getRelativePos(e);
    if (isRevealing) {
      targetSize.current = Math.min(400, targetSize.current + 0.5);
    }
  };

  const handlePointerUp = () => {
    setIsRevealing(false);
    targetSize.current = 0;
  };

  const clipPath =
    isRevealing || circleSize > 1
      ? `circle(${circleSize}px at ${smoothX.get()}px ${smoothY.get()}px)`
      : "circle(0px at 50% 50%)";

  return (
    <div className="relative w-full">
      <motion.div
        className="relative w-full h-[340px] sm:h-[400px] md:h-[440px] lg:h-[480px] overflow-hidden select-none touch-none"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ cursor: isRevealing ? "none" : "pointer" }}
        data-testid="slider-container"
      >
        <div className="absolute inset-0">
          <HandwrittenPaper />
        </div>

        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ clipPath }}
        >
          <div className="absolute inset-0">
            <PrepetualQuizPlayer />
          </div>
        </div>

        {(isRevealing || circleSize > 1) && (
          <svg
            className="absolute inset-0 z-20 pointer-events-none w-full h-full"
            style={{ overflow: "hidden" }}
          >
            <defs>
              <filter
                id="glowFilter"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="6"
                  result="blur1"
                />
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="14"
                  result="blur2"
                />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx={smoothX.get()}
              cy={smoothY.get()}
              r={circleSize}
              fill="none"
              stroke="rgba(250,204,21,0.6)"
              strokeWidth="2.5"
              filter="url(#glowFilter)"
            />
            <circle
              cx={smoothX.get()}
              cy={smoothY.get()}
              r={circleSize}
              fill="none"
              stroke="rgba(250,204,21,0.15)"
              strokeWidth="8"
              filter="url(#glowFilter)"
            />
          </svg>
        )}

        <AnimatePresence>
          {showHint && !isRevealing && circleSize < 1 && (
            <motion.div
              className="absolute z-20 left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="w-14 h-14 rounded-full bg-white/90 dark:bg-white/95 shadow-lg border border-gray-200/80 flex items-center justify-center"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <MousePointer2 className="w-5 h-5 text-gray-600" />
              </motion.div>
              <span className="text-[11px] font-medium text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full tracking-wide">
                Click & hold to reveal
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="absolute bottom-0 left-0 right-0 h-[55%] pointer-events-none z-30"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.15) 15%, hsl(var(--background) / 0.5) 35%, hsl(var(--background) / 0.8) 55%, hsl(var(--background)) 75%)",
          }}
        />
      </motion.div>
    </div>
  );
}

function HowItWorksGallery() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const stages = [
    {
      id: 0,
      icon: Upload,
      title: "Step 1: Upload",
      label: "Upload",
      desc: "Drop your study materials — PDFs, images, Word docs, or PowerPoint files. We handle the rest.",
      gradient: "from-amber-400 to-yellow-500",
      glowColor: "rgba(251, 191, 36, 0.25)",
      bg: "bg-amber-400/5",
      accent: "text-amber-500",
      content: (
        <div className="space-y-4 w-full max-w-sm mx-auto">
          <motion.div
            className="relative w-full aspect-square rounded-3xl border-3 border-dashed border-amber-400/30 bg-amber-400/5 flex flex-col items-center justify-center gap-4 group/upload"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.1)_0%,transparent_70%)]" />
            <motion.div
              className="w-20 h-20 rounded-2xl bg-amber-400/20 flex items-center justify-center shadow-lg shadow-amber-400/10"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Upload className="w-10 h-10 text-amber-500" />
            </motion.div>
            <div className="text-center space-y-1 z-10">
              <p className="text-sm font-bold text-foreground">Click to upload</p>
              <p className="text-xs text-muted-foreground">or drag & drop files</p>
            </div>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "PDF", icon: FileText },
              { label: "Images", icon: Image },
              { label: "Word", icon: File },
              { label: "PPT", icon: Layers },
            ].map((f) => (
              <Badge key={f.label} variant="secondary" className="text-[11px] px-3 py-1.5 gap-2 border-amber-400/10 bg-amber-400/5 text-amber-600 dark:text-amber-400">
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </Badge>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 1,
      icon: Eye,
      title: "Step 2: Extract",
      label: "Extract",
      desc: "Our AI reads and understands your content with high precision — text, diagrams, and tables included.",
      gradient: "from-cyan-400 to-blue-500",
      glowColor: "rgba(34, 211, 238, 0.2)",
      bg: "bg-cyan-400/5",
      accent: "text-cyan-500",
      content: (
        <div className="w-full max-w-sm mx-auto space-y-6">
          <div className="space-y-4">
            {[
              { w: "100%", label: "Parsing document...", delay: 0 },
              { w: "85%", label: "Extracting key concepts...", delay: 0.3 },
              { w: "65%", label: "Identifying relationships...", delay: 0.6 },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.w} complete</span>
                </div>
                <div className="h-2.5 bg-cyan-400/10 rounded-full overflow-hidden border border-cyan-400/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: item.w }}
                    transition={{ duration: 1.5, delay: item.delay, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
          <motion.div
            className="flex items-center gap-4 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20"
            animate={{ boxShadow: ["0 0 0px rgba(34,211,238,0)", "0 0 15px rgba(34,211,238,0.2)", "0 0 0px rgba(34,211,238,0)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Advanced Extraction</p>
              <p className="text-[11px] text-muted-foreground">Omission-free high-fidelity parsing</p>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 2,
      icon: Brain,
      title: "Step 3: Generate",
      label: "Generate",
      desc: "Smart AI creates diverse, personalized quiz questions from your material — instantly.",
      gradient: "from-violet-400 to-purple-500",
      glowColor: "rgba(167, 139, 250, 0.2)",
      bg: "bg-violet-400/5",
      accent: "text-violet-500",
      content: (
        <div className="w-full max-w-sm mx-auto space-y-4">
          {[
            { type: "Multiple Choice", q: "What is the primary function of mitochondria?", color: "violet" },
            { type: "True / False", q: "DNA replication occurs in the G1 phase.", color: "purple" },
            { type: "Short Answer", q: "Define the term 'Osmosis' in your own words.", color: "indigo" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="p-4 rounded-2xl bg-violet-400/5 border border-violet-400/15 group/q relative overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="absolute top-0 right-0 p-2 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              </div>
              <Badge className="mb-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-none px-2 py-0.5 text-[10px]">
                {item.type}
              </Badge>
              <p className="text-sm font-medium text-foreground leading-relaxed">{item.q}</p>
            </motion.div>
          ))}
          <div className="flex items-center justify-center gap-3 py-2 text-violet-500/60 animate-pulse">
            <Brain className="w-4 h-4" />
            <span className="text-[11px] font-bold tracking-widest uppercase">AI Architecting...</span>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      icon: Trophy,
      title: "Step 4: Learn",
      label: "Learn",
      desc: "Master every topic with interactive quizzes, flashcards, and spaced repetition.",
      gradient: "from-emerald-400 to-green-500",
      glowColor: "rgba(52, 211, 153, 0.2)",
      bg: "bg-emerald-400/5",
      accent: "text-emerald-500",
      content: (
        <div className="w-full max-w-sm mx-auto space-y-6">
          <motion.div
            className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/15 relative overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">85%</p>
                  <p className="text-xs text-muted-foreground">Expert Proficiency</p>
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-muted/30"}`} />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold px-1">
                <p>Mastery Progress</p>
                <p className="text-emerald-500">Fast tracking</p>
              </div>
              <div className="h-3 bg-emerald-500/10 rounded-full overflow-hidden border border-emerald-500/10">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
          <div className="grid grid-cols-2 gap-3">
            <Button className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12">
              <Play className="w-4 h-4 mr-2" /> Start Quiz
            </Button>
            <Button variant="outline" className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 h-12" onClick={() => window.location.href = '#study'}>
              <BookOpen className="w-4 h-4 mr-2" /> Study
            </Button>
          </div>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % stages.length);
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, stages.length]);

  const orbitRadius = 280;
  const rotationAngle = activeStep * (360 / stages.length);

  return (
    <div className="w-full relative py-20 overflow-hidden">
      {/* ── Desktop: Orbit Animation ── */}
      <div className="hidden lg:flex flex-col items-center justify-center min-h-[700px] relative">
        
        {/* Central Display Area */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="relative w-full max-w-7xl flex items-center justify-between px-20">
            {/* Left side: Text Content */}
            <div className="w-[400px] pointer-events-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className={cn(
                      "inline-flex items-center gap-3 px-5 py-2 rounded-2xl text-xs font-bold tracking-widest uppercase border border-current/30 bg-white/5",
                      stages[activeStep].accent
                    )}>
                      {React.createElement(stages[activeStep].icon, { className: "w-4 h-4" })}
                      {stages[activeStep].title}
                    </div>
                    <h3 className="text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
                      {stages[activeStep].label}
                    </h3>
                  </div>
                  <p className="text-2xl text-muted-foreground leading-relaxed font-medium">
                    {stages[activeStep].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right side: Illustration Frame */}
            <div className="w-[500px] aspect-square pointer-events-auto">
              <div className="relative w-full h-full rounded-[60px] border border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex items-center justify-center p-12"
                  >
                    {stages[activeStep].content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Orbit System */}
        <div className="absolute left-[63%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none opacity-40">
           {/* Static orbital rings */}
           <div className="absolute inset-x-[15%] inset-y-[15%] border border-white/5 rounded-full" />
           <div className="absolute inset-x-[0%] inset-y-[0%] border border-white/5 rounded-full" />
           
           {/* Rotating Container */}
           <motion.div 
             className="absolute inset-0"
             animate={{ rotate: rotationAngle }}
             transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
           >
             {stages.map((stage, i) => {
               const angle = (i * -360) / stages.length;
               const radian = (angle * Math.PI) / 180;
               const x = Math.cos(radian) * orbitRadius;
               const y = Math.sin(radian) * orbitRadius;
               
               return (
                 <motion.button
                   key={stage.id}
                   className="absolute pointer-events-auto"
                   style={{
                     left: `calc(50% + ${x}px)`,
                     top: `calc(50% + ${y}px)`,
                     x: "-50%",
                     y: "-50%",
                   }}
                   onClick={() => {
                     setActiveStep(i);
                     setIsAutoPlaying(false);
                   }}
                 >
                   {/* Satellite Icon Container */}
                   <motion.div
                     className={cn(
                       "w-24 h-24 rounded-3xl backdrop-blur-2xl flex items-center justify-center border-2 transition-all duration-700",
                       activeStep === i 
                         ? "bg-white/10 border-white/20 scale-110 shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]" 
                         : "bg-white/5 border-white/10 grayscale hover:grayscale-0 hover:bg-white/10"
                     )}
                     animate={{ rotate: -rotationAngle }}
                     transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                   >
                     <stage.icon className={cn(
                       "w-10 h-10 transition-colors duration-500",
                       activeStep === i ? stage.accent : "text-white/40"
                     )} />
                     
                     {/* Active Indicator Glow */}
                     {activeStep === i && (
                       <motion.div
                         layoutId="active-orbit-glow"
                         className={cn("absolute inset-0 rounded-3xl blur-xl opacity-20", stage.accent.replace('text-', 'bg-'))}
                       />
                     )}
                     
                     {/* Label on outer ring */}
                     <span className={cn(
                       "absolute -bottom-10 whitespace-nowrap text-xs font-bold tracking-widest uppercase transition-opacity duration-700",
                       activeStep === i ? "opacity-100 text-primary" : "opacity-0"
                     )}>
                       {stage.label}
                     </span>
                   </motion.div>
                 </motion.button>
               );
             })}
           </motion.div>
        </div>

        {/* Manual Navigation Controls */}
        <div className="absolute bottom-10 flex items-center gap-8 z-20">
          <div className="flex gap-3">
            {stages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveStep(i);
                  setIsAutoPlaying(false);
                }}
                className={cn(
                  "h-1.5 transition-all duration-700 rounded-full",
                  activeStep === i ? "w-12 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
                )}
              />
            ))}
          </div>
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="text-white/40 hover:text-white transition-colors"
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Mobile/Tablet: Simplified Sequential Reveal ── */}
      <div className="lg:hidden space-y-16 py-12 px-6">
        {stages.map((stage, i) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div className="space-y-5 text-center">
              <div className={cn(
                "w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto shadow-2xl",
                "bg-gradient-to-br",
                stage.gradient
              )}>
                <stage.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold tracking-tight">{stage.label}</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">{stage.desc}</p>
            </div>
            <div className="p-10 rounded-[48px] border border-border/60 bg-card/60 backdrop-blur-sm shadow-2xl overflow-hidden flex items-center justify-center">
              {stage.content}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


function FeatureIllustration({
  feature,
  color,
}: {
  feature: string;
  color: string;
}) {
  const colorClasses: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-500",
      border: "border-blue-500/30",
    },
    purple: {
      bg: "bg-purple-500",
      text: "text-purple-500",
      border: "border-purple-500/30",
    },
    orange: {
      bg: "bg-orange-500",
      text: "text-orange-500",
      border: "border-orange-500/30",
    },
    rose: {
      bg: "bg-rose-500",
      text: "text-rose-500",
      border: "border-rose-500/30",
    },
    emerald: {
      bg: "bg-emerald-500",
      text: "text-emerald-500",
      border: "border-emerald-500/30",
    },
    amber: {
      bg: "bg-amber-500",
      text: "text-amber-500",
      border: "border-amber-500/30",
    },
    cyan: {
      bg: "bg-cyan-500",
      text: "text-cyan-500",
      border: "border-cyan-500/30",
    },
    indigo: {
      bg: "bg-indigo-500",
      text: "text-indigo-500",
      border: "border-indigo-500/30",
    },
  };
  const c = colorClasses[color] || colorClasses.blue;

  if (feature === "Multi-Format Upload") {
    return (
      <div className="w-full h-full flex items-center justify-center p-2 pointer-events-none">
        <div className="w-full max-w-[240px] transform scale-[0.85]">
          <Card className="border-2 border-dashed border-border/50 bg-card/50">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className={`w-5 h-5 ${c.text}`} />
              </div>
              <p className="text-[10px] font-medium text-foreground text-center">
                Upload your study material
              </p>
              <p className="text-[8px] text-muted-foreground text-center">
                Drag and drop or click
              </p>
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                <Badge variant="secondary" className="text-[7px] px-1.5 py-0">
                  PDF
                </Badge>
                <Badge variant="secondary" className="text-[7px] px-1.5 py-0">
                  DOCX
                </Badge>
                <Badge variant="secondary" className="text-[7px] px-1.5 py-0">
                  PPTX
                </Badge>
                <Badge variant="secondary" className="text-[7px] px-1.5 py-0">
                  Images
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (feature === "AI Quiz Generation") {
    return (
      <div className="w-full h-full flex items-center justify-center p-2 pointer-events-none">
        <div className="w-full max-w-[240px] transform scale-[0.85]">
          <Card className="border bg-card">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={`${c.bg} text-white text-[8px] px-1.5`}>
                  Q3 / 10
                </Badge>
                <Badge variant="secondary" className="text-[7px] px-1.5">
                  Multiple Choice
                </Badge>
              </div>
              <div className="bg-muted/30 rounded-md p-2">
                <div className="h-1.5 bg-foreground/15 rounded w-3/4 mb-1" />
                <div className="h-1.5 bg-foreground/10 rounded w-1/2" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-1.5 rounded-md border border-border/50">
                  <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[7px] font-medium text-muted-foreground">
                    A
                  </div>
                  <div className="h-1.5 bg-foreground/10 rounded flex-1" />
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded-md border-2 border-green-500 bg-green-500/10">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[7px] font-medium text-white">
                    B
                  </div>
                  <div className="h-1.5 bg-green-500/30 rounded flex-1" />
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (feature === "Study Mode") {
    return (
      <div className="w-full h-full flex items-center justify-center p-2 pointer-events-none">
        <div className="relative w-full max-w-[200px] transform scale-[0.85]">
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 opacity-70">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeft className="w-3 h-3 text-muted-foreground" />
            </div>
            <span className="text-[6px] text-muted-foreground font-medium">
              Still
            </span>
            <span className="text-[6px] text-muted-foreground font-medium">
              Learning
            </span>
          </div>
          <Card className="border bg-card shadow-lg rotate-1">
            <CardContent className="p-3 flex flex-col items-center">
              <span
                className={`text-[7px] uppercase tracking-widest ${c.text} font-bold mb-2`}
              >
                Question
              </span>
              <div className="w-full space-y-1 mb-2">
                <div className="h-1.5 bg-foreground/12 rounded w-full" />
                <div className="h-1.5 bg-foreground/8 rounded w-3/4 mx-auto" />
              </div>
              <div className="w-full h-px bg-border my-2" />
              <span className="text-[8px] text-muted-foreground">
                tap to flip
              </span>
            </CardContent>
          </Card>
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 opacity-70">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[6px] text-primary font-medium">Know</span>
            <span className="text-[6px] text-primary font-medium">This</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1">
            <div className="h-1 bg-muted rounded-full w-16">
              <div className={`h-1 ${c.bg} rounded-full w-3/5`} />
            </div>
            <span className="text-[7px] text-muted-foreground">3/5</span>
          </div>
        </div>
      </div>
    );
  }

  if (feature === "Spaced Repetition") {
    return (
      <div className="w-full h-full flex items-center justify-center p-2 pointer-events-none">
        <div className="w-full max-w-[240px] transform scale-[0.85]">
          <Card className="border bg-card">
            <CardContent className="p-3 space-y-2">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${c.bg} rounded-full w-2/3`} />
              </div>
              <p className="text-[8px] text-muted-foreground text-center">
                Revision Round 2 of 3
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-md border-2 border-green-500/30 bg-green-500/5 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-500">4</p>
                    <p className="text-[7px] text-green-600">correct</p>
                  </div>
                </div>
                <div
                  className={`p-2 rounded-md border-2 ${c.border} ${c.bg}/5 flex items-center gap-2`}
                >
                  <div
                    className={`w-5 h-5 rounded-full ${c.bg} flex items-center justify-center`}
                  >
                    <X className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${c.text}`}>2</p>
                    <p className={`text-[7px] ${c.text}`}>to retry</p>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className={`w-full ${c.bg} hover:${c.bg}/90 text-white text-[9px] h-7 border-0`}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry Missed Questions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (feature === "Community Sharing") {
    return (
      <div className="w-full h-full flex items-center justify-center p-2 pointer-events-none">
        <div className="w-full max-w-[240px] transform scale-[0.85]">
          <Card className="border bg-card">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-semibold">Biology Quiz</h4>
                <Badge variant="secondary" className="text-[7px] px-1.5">
                  10 questions
                </Badge>
              </div>
              <div className="bg-muted/30 rounded-md p-2 space-y-1">
                <div className="h-1 bg-foreground/10 rounded w-full" />
                <div className="h-1 bg-foreground/8 rounded w-3/4" />
                <div className="h-1 bg-foreground/6 rounded w-1/2" />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className={`flex-1 ${c.bg} hover:${c.bg}/90 text-white text-[9px] h-7 border-0`}
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`flex-1 text-[9px] h-7 ${c.border} ${c.text}`}
                >
                  Copy link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (feature === "Pip AI Assistant") {
    return (
      <div className="w-full h-full flex items-center justify-center p-2 pointer-events-none">
        <div className="w-full max-w-[260px] transform scale-[0.8]">
          <Card className="border bg-card">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900 dark:to-cyan-800 flex items-center justify-center shrink-0">
                  <span className="text-lg">🐧</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div
                    className={`p-2 rounded-lg ${c.bg}/10 border ${c.border}`}
                  >
                    <div className="space-y-1">
                      <div className={`h-1.5 ${c.bg}/40 rounded w-full`} />
                      <div className={`h-1.5 ${c.bg}/30 rounded w-4/5`} />
                      <div className={`h-1.5 ${c.bg}/20 rounded w-3/5`} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant="outline"
                      className={`text-[7px] px-1.5 ${c.border} ${c.text}`}
                    >
                      Explain this
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[7px] px-1.5 ${c.border} ${c.text}`}
                    >
                      Give a hint
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className={`w-full mt-2 ${c.bg} hover:${c.bg}/90 text-white text-[9px] h-7 border-0`}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Ask Pip
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (feature === "Progress Tracking") {
    return (
      <div className="w-full h-full flex items-center justify-center p-2 pointer-events-none">
        <div className="w-full max-w-[260px] transform scale-[0.8]">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              <Card className="bg-primary border-0">
                <CardContent className="p-2 text-center">
                  <p className="text-[7px] text-primary-foreground/80">
                    Quizzes
                  </p>
                  <p className="text-sm font-bold text-primary-foreground">
                    12
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-primary/80 border-0">
                <CardContent className="p-2 text-center">
                  <p className="text-[7px] text-primary-foreground/80">
                    Score
                  </p>
                  <p className="text-sm font-bold text-primary-foreground">92%</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/60 border-0">
                <CardContent className="p-2 text-center">
                  <p className="text-[7px] text-primary-foreground/80">
                    Accuracy
                  </p>
                  <p className="text-sm font-bold text-primary-foreground">
                    85%
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card className="border bg-card">
              <CardContent className="p-2">
                <p className="text-[8px] font-medium text-muted-foreground mb-2">
                  Weekly Progress
                </p>
                <div className="flex items-end justify-between gap-1 h-10">
                  {[35, 48, 32, 58, 42, 52, 30].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 ${c.bg} rounded-t`}
                      style={{ height: `${h}%`, opacity: 0.5 + i * 0.07 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <span
                      key={i}
                      className="text-[6px] text-muted-foreground flex-1 text-center"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function FeatureShowcase() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const features = [
    {
      icon: Upload,
      title: "Multi-Format Upload",
      description: "PDFs, images, Word, Excel supported.",
      color: "blue",
      details:
        "Upload any document format and our intelligent parser extracts the text content. For images and scanned documents, our OCR (Optical Character Recognition) technology accurately reads text from photos of textbooks, handwritten notes, and more.",
    },
    {
      icon: Brain,
      title: "AI Quiz Generation",
      description: "AI creates meaningful questions.",
      color: "purple",
      details:
        "Our AI analyzes your content to generate diverse question types: multiple choice, true/false, and short answer. Questions are designed to test comprehension, not just memorization, with adjustable difficulty levels.",
    },
    {
      icon: BookOpen,
      title: "Study Mode",
      description: "Flashcards with progress tracking.",
      color: "orange",
      details:
        "Flip through questions as flashcards. Mark each card as 'known' or 'still learning' to track your progress. Cards you're still learning will appear more frequently until you master them.",
    },
    {
      icon: RotateCcw,
      title: "Spaced Repetition",
      description: "Retry missed questions until mastered.",
      color: "rose",
      details:
        "Questions you answer incorrectly automatically appear in retry rounds. This spaced repetition approach ensures you keep practicing difficult concepts until they stick, maximizing long-term retention.",
    },
    {
      icon: Share2,
      title: "Community Sharing",
      description: "Share and discover public quizzes.",
      color: "emerald",
      details:
        "Share your quizzes with friends or make them public for others to use. Discover quizzes created by the community, sorted by subject and popularity. Collaborate and learn together.",
    },
    {
      icon: MessageCircle,
      title: "Pip AI Assistant",
      description: "Your personal study companion.",
      color: "cyan",
      details:
        "Meet Pip, your friendly arctic study buddy! Pip understands your quiz context and helps explain difficult concepts, provides hints when you're stuck, and supports math formulas. Pip guides you to the answer without giving it away.",
    },
    {
      icon: Target,
      title: "Progress Tracking",
      description: "Monitor your exam readiness.",
      color: "indigo",
      details:
        "Track your accuracy and quiz history all in one dashboard. See which topics need more practice and watch your scores improve over time as you prepare for your exams.",
    },
  ];

  const colorClasses: Record<
    string,
    { text: string; border: string; bg: string; glow: string; solidBg: string }
  > = {
    blue: {
      text: "text-blue-500",
      border: "border-blue-500/20",
      bg: "bg-blue-500/10",
      glow: "group-hover:shadow-blue-500/20",
      solidBg: "bg-blue-500",
    },
    purple: {
      text: "text-purple-500",
      border: "border-purple-500/20",
      bg: "bg-purple-500/10",
      glow: "group-hover:shadow-purple-500/20",
      solidBg: "bg-purple-500",
    },
    orange: {
      text: "text-orange-500",
      border: "border-orange-500/20",
      bg: "bg-orange-500/10",
      glow: "group-hover:shadow-orange-500/20",
      solidBg: "bg-orange-500",
    },
    rose: {
      text: "text-rose-500",
      border: "border-rose-500/20",
      bg: "bg-rose-500/10",
      glow: "group-hover:shadow-rose-500/20",
      solidBg: "bg-rose-500",
    },
    emerald: {
      text: "text-emerald-500",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
      glow: "group-hover:shadow-emerald-500/20",
      solidBg: "bg-emerald-500",
    },
    amber: {
      text: "text-amber-500",
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
      glow: "group-hover:shadow-amber-500/20",
      solidBg: "bg-amber-500",
    },
    cyan: {
      text: "text-cyan-500",
      border: "border-cyan-500/20",
      bg: "bg-cyan-500/10",
      glow: "group-hover:shadow-cyan-500/20",
      solidBg: "bg-cyan-500",
    },
    indigo: {
      text: "text-indigo-500",
      border: "border-indigo-500/20",
      bg: "bg-indigo-500/10",
      glow: "group-hover:shadow-indigo-500/20",
      solidBg: "bg-indigo-500",
    },
  };

  return (
    <motion.div className="relative" layout>
      <AnimatePresence mode="wait">
        {expandedIndex === null ? (
          <motion.div
            key="grid"
            className="grid gap-4 sm:gap-5"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            layout
          >
            {features.map((feature, index) => {
              const colors = colorClasses[feature.color];
              const entrances = [
                {
                  initial: { opacity: 0, y: 30, filter: "blur(6px)" },
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                },
                {
                  initial: { opacity: 0, scale: 0.85, filter: "blur(4px)" },
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                },
                {
                  initial: { opacity: 0, x: -25, filter: "blur(4px)" },
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                },
                {
                  initial: { opacity: 0, y: 25, rotateX: -10 },
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                },
                {
                  initial: { opacity: 0, x: 25, filter: "blur(4px)" },
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                },
                {
                  initial: { opacity: 0, scale: 0.8, rotate: -3 },
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                },
                {
                  initial: { opacity: 0, y: -20, filter: "blur(6px)" },
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                },
                {
                  initial: { opacity: 0, scale: 0.9, filter: "blur(8px)" },
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                },
              ];
              const entrance = entrances[index % entrances.length];
              return (
                <motion.div
                  key={feature.title}
                  initial={entrance.initial}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    x: 0,
                    scale: 1,
                    rotate: 0,
                    rotateX: 0,
                    filter: "blur(0px)",
                  }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.06, ...entrance.transition }}
                  onClick={() => setExpandedIndex(index)}
                  className="flex"
                >
                  <Card
                    className={`w-full group cursor-pointer transition-all duration-300 border ${colors.border} bg-card hover:shadow-xl ${colors.glow} hover:-translate-y-1 relative overflow-visible`}
                  >
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center border ${colors.border} shrink-0`}
                        >
                          <feature.icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-full"
          >
            {(() => {
              const feature = features[expandedIndex];
              const colors = colorClasses[feature.color];
              return (
                <Card
                  className={`w-full border-2 ${colors.border} bg-card shadow-2xl relative overflow-visible`}
                >
                  <CardContent className="p-8 relative overflow-hidden">
                    <div
                      className={`absolute -top-20 -right-20 w-64 h-64 rounded-full ${colors.bg} blur-3xl opacity-50`}
                    />
                    <div
                      className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full ${colors.bg} blur-3xl opacity-30`}
                    />

                    <div className="relative grid md:grid-cols-2 gap-8 items-center">
                      <div className="order-2 md:order-1">
                        <motion.div
                          className={`inline-flex w-16 h-16 rounded-2xl ${colors.bg} items-center justify-center mb-6 border ${colors.border}`}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            delay: 0.1,
                          }}
                        >
                          <feature.icon className={`w-8 h-8 ${colors.text}`} />
                        </motion.div>

                        <motion.h3
                          className="text-2xl md:text-3xl font-bold text-foreground mb-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          {feature.title}
                        </motion.h3>

                        <motion.p
                          className="text-base text-muted-foreground leading-relaxed mb-6"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {feature.details}
                        </motion.p>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                        >
                          <Button
                            variant="outline"
                            onClick={() => setExpandedIndex(null)}
                            className="gap-2"
                            data-testid="button-feature-back"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Back to all features
                          </Button>
                        </motion.div>
                      </div>

                      <motion.div
                        className="order-1 md:order-2 flex items-center justify-center"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          delay: 0.1,
                        }}
                      >
                        <div
                          className={`w-full max-w-[320px] aspect-[4/3] rounded-2xl ${colors.bg} border ${colors.border} p-4 flex items-center justify-center`}
                        >
                          <FeatureIllustration
                            feature={feature.title}
                            color={feature.color}
                          />
                        </div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ParsingShowcase() {
  const originalQuestions = [
    { num: "1", question: "What is the powerhouse of the cell?", options: ["A) Nucleus", "B) Mitochondria", "C) Ribosome", "D) Golgi apparatus"] },
    { num: "2", question: "DNA replication occurs during which phase?", options: ["A) G1 phase", "B) S phase", "C) G2 phase", "D) M phase"] },
    { num: "3", question: "Photosynthesis takes place in the chloroplast.", options: ["True", "False"] },
  ];

  const convertedQuestions = [
    { num: "1", question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"], correct: 1, type: "multiple_choice" as const, explanation: "Mitochondria generate most of the cell's ATP." },
    { num: "2", question: "DNA replication occurs during which phase?", options: ["G1 phase", "S phase", "G2 phase", "M phase"], correct: 1, type: "multiple_choice" as const, explanation: "DNA is replicated during S phase." },
    { num: "3", question: "Photosynthesis takes place in the chloroplast.", options: ["True", "False"], correct: 0, type: "true_false" as const, explanation: "Chloroplasts are the site of photosynthesis." },
  ];

  const [phase, setPhase] = useState<"source" | "converting" | "result">("source");
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const sequence = async () => {
      setPhase("source");
      setActiveQuestion(0);
      setShowExplanation(false);

      await new Promise(r => setTimeout(r, 2500));
      setPhase("converting");

      await new Promise(r => setTimeout(r, 2000));
      setPhase("result");
      setShowExplanation(true);

      for (let i = 0; i < 3; i++) {
        setActiveQuestion(i);
        await new Promise(r => setTimeout(r, 1500));
      }
    };
    sequence();
    const timer = setInterval(sequence, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="container relative mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center mb-16">
          <motion.p
            className="text-xs font-bold text-primary uppercase mb-4"
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Import your own questions
          </motion.p>
          <div className="overflow-hidden">
            <motion.h2
              className="text-3xl md:text-5xl font-bold mb-6"
              initial={{ y: "110%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.05,
              }}
            >
              Your context, <span className="text-primary italic custom-highlight">exactly</span> as it is.
            </motion.h2>
          </div>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto text-lg text-pretty"
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.15,
            }}
          >
            Upload any exam or worksheet. We intelligently extract every question, word-for-word.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-2 mb-4">
              <FileText className="w-3 h-3" /> Original Document
            </div>
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8 space-y-6 relative overflow-hidden text-pretty">
                {originalQuestions.map((q, i) => (
                  <div key={i} className="space-y-2 opacity-40 grayscale">
                    <p className="text-sm font-serif italic">{q.num}. {q.question}</p>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {q.options.map((opt, oi) => <span key={oi} className="text-[10px] font-serif">{opt}</span>)}
                    </div>
                  </div>
                ))}
                <AnimatePresence>
                  {phase === "converting" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Converting...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4 mr-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                <Zap className="w-3 h-3" /> Interactive Quiz
              </div>
              {phase === "result" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-bold text-primary uppercase"
                >
                  Ready
                </motion.div>
              )}
            </div>
            <Card className={`transition-all duration-700 ${phase === "result" ? "border-primary/30 shadow-2xl shadow-primary/5" : "opacity-30 grayscale border-border/40"}`}>
              <CardContent className="p-8 space-y-6 text-pretty">
                {convertedQuestions.map((q, i) => {
                  const active = phase === "result" && i === activeQuestion;
                  return (
                    <div key={i} className={`p-4 rounded-xl border transition-all duration-300 ${active ? "bg-primary/5 border-primary/20" : "border-transparent"}`}>
                      <p className="text-sm font-bold mb-3">{q.question}</p>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => {
                          const correct = active && showExplanation && oi === q.correct;
                          return (
                            <div key={oi} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border ${correct ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-muted/30 border-transparent text-muted-foreground"}`}>
                              <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${correct ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30"}`}>
                                {correct && <Check className="w-2 h-2" />}
                              </div>
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AnimatedCounter({
  value,
  duration = 2,
}: {
  value: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    if (value === "∞" || value === "100%") {
      setDisplayValue(value);
      return;
    }

    const numericValue = parseInt(value.replace(/[^0-9]/g, ""));
    const suffix = value.replace(/[0-9]/g, "");

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(numericValue * easeOutQuart);
      setDisplayValue(current + suffix);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <div ref={ref}>{displayValue}</div>;
}

function StatsSection() {
  const stats = [
    { value: "100%", label: "Free Forever", icon: Star },
    { value: "5+", label: "File Formats", icon: FileText },
    { value: "∞", label: "Unlimited Quizzes", icon: Layers },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-12 md:gap-20 max-w-3xl mx-auto">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{
            delay: index * 0.12,
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              whileInView={{ rotate: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.1 + index * 0.12,
                type: "spring",
                stiffness: 200,
                damping: 12,
              }}
            >
              <stat.icon className="w-5 h-5 text-primary" />
            </motion.div>
            <span className="text-3xl md:text-4xl font-bold text-foreground">
              <AnimatedCounter value={stat.value} />
            </span>
          </div>
          <motion.div
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.2 + index * 0.12,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {stat.label}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { extractedText, setExtractedText } = useQuiz();
  const { isAuthenticated, isLoading } = useAuth();
  const { openLoginDialog, openSignUpDialog } = useAuthDialog();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    setExtractedText("");
  }, []);

  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTextExtracted = (
    text: string,
    isOfficeWithImages?: boolean,
    documentImages?: string[],
  ) => {
    setExtractedText(text);
  };

  const handleContinueToGenerate = () => {
    if (isAuthenticated) {
      setLocation("/generate");
    } else {
      openLoginDialog();
    }
  };

  const handleGetStarted = () => {
    openSignUpDialog();
  };

  return (
    <div className="min-h-screen">
      <section ref={heroRef} className="relative pb-8 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 -left-40 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              backgroundPositionY: ["0px", "-80px"]
            }}
            transition={{
              opacity: { duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
              backgroundPositionY: { duration: 8, repeat: Infinity, ease: "linear" }
            }}
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(48 96% 53% / 0.07) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(48 96% 53% / 0.07) 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 35%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 35%, black 100%)",
            }}
          />
        </div>

        <div className="w-full relative z-0">
          <BeforeAfterSlider />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="flex flex-col items-center">
            <div className="text-center max-w-4xl mx-auto -mt-24 sm:-mt-28 md:-mt-34 lg:-mt-40 relative z-10">
              <motion.div
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 1.5 }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(48_96%_53%/0.08)_0%,transparent_70%)]" />
              </motion.div>

              {[
                { x: "15%", y: "10%", size: 4, delay: 0.5, dur: 6 },
                { x: "80%", y: "20%", size: 3, delay: 1.2, dur: 8 },
                { x: "25%", y: "75%", size: 3, delay: 0.8, dur: 7 },
                { x: "70%", y: "65%", size: 5, delay: 1.5, dur: 9 },
                { x: "50%", y: "5%", size: 3, delay: 2.0, dur: 7 },
                { x: "90%", y: "50%", size: 4, delay: 0.3, dur: 8 },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: p.x,
                    top: p.y,
                    width: p.size,
                    height: p.size,
                    background: "hsl(48 96% 53% / 0.5)",
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 0.8, 0.3, 0.8, 0],
                    scale: [0.5, 1.2, 0.8, 1.2, 0.5],
                    y: [0, -12, -6, -14, 0],
                  }}
                  transition={{
                    delay: p.delay,
                    duration: p.dur,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6 overflow-hidden"
                initial={{ opacity: 0, scale: 0.6, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              > */}
              {/* <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(90deg, transparent 0%, hsl(48 96% 53% / 0.15) 50%, transparent 100%)", width: "200%", left: "-100%" }}
                  animate={{ left: ["−100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                />
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div> */}

              <h1
                className="font-bold text-foreground mb-5 leading-[1.1] tracking-tight relative text-center w-full"
                style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)" }}
              >
                <span className="overflow-hidden inline-flex justify-center flex-wrap w-full">
                  {["Make", "your", "materials"].map((word, i) => (
                    <motion.span
                      key={word}
                      className="inline-block"
                      initial={{ y: "110%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: 0.15 + i * 0.07,
                        duration: 0.7,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {word}
                      {"\u00A0"}
                    </motion.span>
                  ))}
                </span>
                <AIQuizzesText />
              </h1>

              <motion.p
                className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-7 leading-relaxed"
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: 0.55,
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                Let every definition respond to you.
                <br />
                Stay connected to what you learn.
              </motion.p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5 relative">
                <motion.div
                  className="relative"
                  initial={{ y: "120%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.6,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <motion.div
                    className="absolute -inset-2 rounded-xl bg-gradient-to-r from-primary/60 via-yellow-400/40 to-primary/60 blur-xl pointer-events-none"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="relative group/btn">
                    <motion.div
                      className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-primary rounded-lg blur opacity-0 group-hover/btn:opacity-100 transition duration-500 pointer-events-none"
                      initial={false}
                    />
                    <Button
                      size="lg"
                      onClick={handleGetStarted}
                      className="gap-2.5 px-8 text-base h-13 w-full sm:w-auto shadow-lg shadow-primary/20 font-semibold relative overflow-hidden transition-shadow duration-300 group-hover/btn:shadow-primary/40"
                      data-testid="button-hero-get-started"
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                      <span className="relative z-10 flex items-center gap-2.5">
                        Get Started
                        <span className="font-light">
                          —it's free
                        </span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </span>
                    </Button>
                    <span
                      className="absolute inset-0 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        boxShadow:
                          "inset 0 1px 0 0 rgba(255,255,255,0.15), inset 0 -1px 0 0 rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                </motion.div>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: 0.75,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative group"
                >
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() =>
                      document
                        .getElementById("how-it-works")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="gap-2 w-full sm:w-auto h-13 text-base font-medium text-muted-foreground hover:text-foreground transition-all duration-300 group-hover:bg-primary/5"
                    data-testid="button-hero-learn-more"
                  >
                    <ArrowDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
                    How It Works
                  </Button>
                </motion.div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {[
                  { icon: CheckCircle2, text: "Free forever" },
                  { icon: CheckCircle2, text: "No credit card" },
                  { icon: CheckCircle2, text: "PDF, Word, Images" },
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                    initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      delay: 0.85 + i * 0.1,
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.95 + i * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                    >
                      <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    </motion.div>
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-20 border-y border-border/50">
        <div className="container mx-auto px-4 sm:px-6">
          <StatsSection />
        </div>
      </section>

      <section id="how-it-works" className="py-20 md:py-28 relative overflow-visible">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 -right-40 w-80 h-80 rounded-full bg-violet-400/5 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, delay: 4 }}
          />
        </div>

        <div className="text-center mb-16">
          <motion.p
            className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3"
            initial={{ opacity: 0, letterSpacing: "0em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            Simple Process
          </motion.p>
          <div className="overflow-hidden">
            <motion.h2
              className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight"
              initial={{ y: "110%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.05,
              }}
            >
              How It Works
            </motion.h2>
          </div>
          <motion.p
            className="text-muted-foreground max-w-lg mx-auto text-base md:text-lg"
            initial={{ opacity: 0, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.15,
            }}
          >
            From notes to quizzes in just a few clicks
          </motion.p>
        </div>
        
        <HowItWorksGallery />
      </section>

      <ParsingShowcase />

      <section className="py-24 md:py-32 relative overflow-hidden bg-muted/30">
        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <motion.p
              className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              Everything You Need
            </motion.p>
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              Power your potential with AI
            </motion.h2>
            <motion.p
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              From raw notes to interactive study sessions in seconds.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {/* Box 1: The Big One - File Upload (Try It Now) */}
            <motion.div
              className="md:col-span-2 md:row-span-2 flex"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="w-full relative shadow-2xl border-primary/20 overflow-hidden bg-card/95 backdrop-blur-sm group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10 pointer-events-none group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-8 relative h-full flex flex-col">
                  <div className="mb-6">
                    <Badge className="mb-3 bg-primary/20 text-primary border-primary/20 hover:bg-primary/30 transition-colors">Start Here</Badge>
                    <h3 className="text-2xl font-bold mb-2">Create Your First Quiz</h3>
                    <p className="text-muted-foreground text-sm">Drop your notes or a textbook page to begin.</p>
                  </div>
                  <div className="flex-1">
                    <FileUpload onTextExtracted={handleTextExtracted} />
                  </div>
                  {extractedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Button
                        size="lg"
                        onClick={handleContinueToGenerate}
                        className="w-full gap-2 h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-all hover:scale-[1.02]"
                        data-testid="button-continue-generate"
                      >
                        Continue to Generate
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 2: AI Generation (Featured Highlight) */}
            <motion.div
              className="md:col-span-2 md:row-span-1 flex"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="w-full group cursor-pointer transition-all duration-500 border-purple-500/20 bg-card hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
                <CardContent className="p-6 h-full flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 order-2 md:order-1">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-4">
                      <Brain className="w-5 h-5 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">AI Quiz Generation</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Our AI analyzes your content to generate diverse question types that test comprehension.
                    </p>
                  </div>
                  <div className="w-full md:w-32 h-32 flex-shrink-0 order-1 md:order-2">
                    <FeatureIllustration feature="AI Quiz Generation" color="purple" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 3: Multi-Format (Normal Size) */}
            <motion.div
              className="md:col-span-1 md:row-span-1 flex"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="w-full group cursor-pointer transition-all duration-500 border-blue-500/20 bg-card hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 relative overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-3">
                    <Upload className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">Multi-Format Support</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    PDFs, textbook photos, docs, and images.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 4: Progress Tracking (Normal Size) - Matches row 2, col 4 */}
            <motion.div
              className="md:col-span-1 md:row-span-1 flex"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="w-full group cursor-pointer transition-all duration-500 border-indigo-500/20 bg-card hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-3">
                    <Target className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">Progress Tracking</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Visual insights into your learning journey.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Row 3 - Four boxes or mixed span */}
            {/* Box 5: Study Mode (Horizontal Span?) */}
            <motion.div
              className="md:col-span-1 md:row-span-1 flex"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="w-full group cursor-pointer transition-all duration-500 border-orange-500/20 bg-card hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 relative overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-3">
                    <BookOpen className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">Smart Study Mode</h3>
                  <p className="text-xs text-muted-foreground">
                    Interactive flashcards that adapt to you.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 6: Pip Assistant (Wide) */}
            <motion.div
              className="md:col-span-2 md:row-span-1 flex"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="w-full group cursor-pointer transition-all duration-500 border-cyan-500/20 bg-card hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 relative overflow-hidden">
                <CardContent className="p-5 h-full flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
                    <span className="text-3xl group-hover:scale-125 transition-transform duration-500">🐧</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">Meet Pip, Your AI Buddy</h3>
                    <p className="text-sm text-muted-foreground">
                      Pip provides hints and explains concepts when you're stuck on a question.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 7: Spaced Repetition (Normal) */}
            <motion.div
              className="md:col-span-1 md:row-span-1 flex"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="w-full group cursor-pointer transition-all duration-500 border-rose-500/20 bg-card hover:shadow-2xl hover:shadow-rose-500/10 hover:-translate-y-1 relative overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-3">
                    <RotateCcw className="w-5 h-5 text-rose-500" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">Spaced Repetition</h3>
                  <p className="text-xs text-muted-foreground">
                    Retry missed questions until you master them.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
      <section className="py-12 md:py-24 relative overflow-hidden bg-background">
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <motion.div
            className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[140px] rounded-full"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-x-0 flex items-center justify-center opacity-[0.025] select-none whitespace-nowrap overflow-hidden">
            <span className="text-[25vw] font-black tracking-tighter uppercase leading-none transform translate-y-1/2">PREPETUAL</span>
          </div>
        </div>

        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <motion.p
              className="text-xs font-bold text-primary uppercase mb-4"
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Start your journey today
            </motion.p>
            <motion.h2
              className="font-bold tracking-tight text-foreground leading-[1.05] mb-8"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            >
              Master your materials. <br className="hidden md:block" />
              <span className="text-primary custom-highlight"><em>Elevate</em></span> your performance.
            </motion.h2>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-14 text-pretty"
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            >
              Join thousands of students who have transformed how they study with AI-powered personalized practice.
            </motion.p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="gap-2 px-10 h-14 w-full sm:w-auto text-base font-bold shadow-[0_20px_40px_-15px_rgba(var(--primary),0.3)] bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-300"
                  data-testid="button-cta-get-started-final"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>

              <Link href="/about">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="ghost"
                    className="gap-2 px-10 h-14 w-full sm:w-auto text-base font-medium text-muted-foreground hover:text-foreground rounded-full border border-border/50 hover:border-foreground/20 hover:bg-foreground/5 transition-all duration-300"
                    data-testid="button-learn-more-final"
                  >
                    Learn More
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-transform"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ y: -2 }}
            data-testid="button-scroll-to-top"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
