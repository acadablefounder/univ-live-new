import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Flag, ChevronLeft, ChevronRight, Save, Trash2, Maximize2, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimerChip } from "@/components/student/TimerChip";
import { CBTQuestionPalette } from "@/components/student/CBTQuestionPalette";
import { cn } from "@/lib/utils";
import { HtmlView } from "@/lib/safeHtml";

import { useAuth } from "@/contexts/AuthProvider";
import { useTenant } from "@/contexts/TenantProvider";
import { db } from "@/lib/firebase";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

type AttemptResponse = { answer: string | null; markedForReview: boolean; visited: boolean; answered: boolean };

type AttemptQuestion = {
  id: string;
  sectionId: string;
  type: "mcq" | "integer";
  stem: string;
  options?: { id: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  marks: { correct: number; incorrect: number };
  passage?: { title: string; content: string } | null;
};

type TestMeta = {
  id: string;
  title: string;
  subject?: string;
  durationMinutes: number;
  sections: { id: string; name: string }[];
};

type AttemptDoc = {
  studentId: string;
  educatorId: string;
  tenantSlug: string | null;
  testId: string;
  testTitle?: string;
  subject?: string;
  status: "in_progress" | "submitted";
  durationSec: number;
  startedAtMs?: number;
  currentIndex?: number;
  responses?: Record<string, AttemptResponse>;
  createdAt?: any;
  startedAt?: any;
  updatedAt?: any;
};

const LS_ATTEMPT_ID_PREFIX = "cbt_attempt_id__";

const safeNumber = (v: any, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const buildInitResponses = (qs: AttemptQuestion[]) => {
  const init: Record<string, AttemptResponse> = {};
  qs.forEach((q) => (init[q.id] = { answer: null, markedForReview: false, visited: false, answered: false }));
  return init;
};

const mapQuestion = (id: string, data: any): AttemptQuestion => {
  const opts: string[] = Array.isArray(data.options) ? data.options : [];
  const correctIndex = safeNumber(data.correctOption, 0);
  const positive = safeNumber(data.marks, 4);
  const negative = Math.abs(safeNumber(data.negativeMarks, 1));

  return {
    id,
    sectionId: data.sectionId || "main",
    type: "mcq",
    stem: data.question || "",   // ✅ FIXED
    options: opts.map((t, i) => ({ id: String(i), text: String(t) })),
    correctAnswer: String(correctIndex),
    explanation: data.explanation || "",
    marks: { correct: positive, incorrect: negative },
    passage: null,
  };
};


const computeRemainingSeconds = (startedAtMs: number | null, totalSec: number) => {
  if (!totalSec) return 0;
  if (!startedAtMs) return totalSec;
  const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
  return Math.max(0, totalSec - elapsed);
};

async function requestFullscreenSafe() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

async function exitFullscreenSafe() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    // ignore
  }
}

export default function StudentCBTAttempt() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const { tenant, tenantSlug, loading: tenantLoading } = useTenant();

  const educatorId = tenant?.educatorId || profile?.educatorId || null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [testMeta, setTestMeta] = useState<TestMeta | null>(null);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, AttemptResponse>>({});

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSectionId, setCurrentSectionId] = useState("main");

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptStartedAtMs, setAttemptStartedAtMs] = useState<number | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  const [isStarted, setIsStarted] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(true);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [instructionsChecked, setInstructionsChecked] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [timerStartSeconds, setTimerStartSeconds] = useState(0);

  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  const attemptIdStorageKey = useMemo(
    () => `${LS_ATTEMPT_ID_PREFIX}${tenantSlug || "main"}__${testId || ""}`,
    [tenantSlug, testId]
  );

  const attemptRef = useMemo(() => (attemptId ? doc(db, "attempts", attemptId) : null), [attemptId]);

  // Debounced Firestore updates (reduces write spam)
  const saveTimerRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<Record<string, any>>({});

  const queueAttemptUpdate = useCallback(
    (patch: Record<string, any>) => {
      if (!attemptRef) return;

      pendingUpdateRef.current = { ...pendingUpdateRef.current, ...patch };

      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(async () => {
        const payload = pendingUpdateRef.current;
        pendingUpdateRef.current = {};
        setSaving(true);
        try {
          await updateDoc(attemptRef, { ...payload, updatedAt: serverTimestamp() });
          setLastSavedAt(Date.now());
        } catch (e) {
          console.error(e);
          toast.error("Failed to save progress");
        } finally {
          setSaving(false);
        }
      }, 650);
    },
    [attemptRef]
  );

  const answeredCount = useMemo(() => Object.values(responses).filter((r) => !!r?.answer).length, [responses]);
  const unansweredVisitedCount = useMemo(
    () => Object.values(responses).filter((r) => r?.visited && !r?.answer).length,
    [responses]
  );

  const currentQuestion = questions[currentIndex] || null;

  // Load test + questions + existing attempt
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!testId) {
        setLoadError("Missing test id");
        setLoading(false);
        return;
      }
      if (authLoading || tenantLoading) return;
      if (!firebaseUser) {
        setLoadError("You must be logged in");
        setLoading(false);
        return;
      }
      if (!educatorId) {
        setLoadError("Tenant not found. Open this test from your coaching website.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const sources = [
          {
            testDoc: doc(db, "educators", educatorId, "my_tests", testId),
            qCol: collection(db, "educators", educatorId, "my_tests", testId, "questions"),
          },
          {
            testDoc: doc(db, "test_series", testId),
            qCol: collection(db, "test_series", testId, "questions"),
          },
        ];

        let meta: TestMeta | null = null;
        let qs: AttemptQuestion[] = [];

        for (const s of sources) {
          const tSnap = await getDoc(s.testDoc);
          if (!tSnap.exists()) continue;

          const d = tSnap.data() as any;
          const durationMinutes = safeNumber(d.durationMinutes, 60);
          const computedSections = [{ id: "main", name: d.subject || "General" }];

          meta = {
            id: tSnap.id,
            title: d.title || "Untitled Test",
            subject: d.subject,
            durationMinutes,
            sections: Array.isArray(d.sections) && d.sections.length ? d.sections : computedSections,
          };

          const qSnap = await getDocs(s.qCol);
          qs = qSnap.docs
            .filter((q) => q.data()?.isActive !== false)
            .map((q) => mapQuestion(q.id, q.data()));
          break;
        }

        if (!meta) throw new Error("Test not found");
        if (!qs.length) throw new Error("No questions found in this test");

        if (!mounted) return;

        setTestMeta(meta);
        setQuestions(qs);
        setDurationSec(meta.durationMinutes * 60);

        const init = buildInitResponses(qs);
        setResponses(init);
        setCurrentIndex(0);
        setCurrentSectionId(qs[0]?.sectionId || "main");

        // Attempt resume: localStorage -> doc -> query
        const loadAttemptById = async (id: string) => {
          const aSnap = await getDoc(doc(db, "attempts", id));
          if (!aSnap.exists()) return null;
          const a = aSnap.data() as AttemptDoc;
          if (a.studentId !== firebaseUser.uid) return null;
          if (a.testId !== testId) return null;
          if (a.status !== "in_progress") return null;
          if (a.educatorId !== educatorId) return null;
          return { id: aSnap.id, ...a } as any;
        };

        let foundAttempt: any = null;
        const cachedId = localStorage.getItem(attemptIdStorageKey);

        if (cachedId) {
          foundAttempt = await loadAttemptById(cachedId);
          if (!foundAttempt) localStorage.removeItem(attemptIdStorageKey);
        }

        if (!foundAttempt) {
          const qAttempt = query(
            collection(db, "attempts"),
            where("studentId", "==", firebaseUser.uid),
            where("testId", "==", testId),
            where("educatorId", "==", educatorId),
            where("status", "==", "in_progress"),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const aSnap = await getDocs(qAttempt);
          if (!aSnap.empty) {
            const d = aSnap.docs[0];
            foundAttempt = { id: d.id, ...(d.data() as AttemptDoc) };
            localStorage.setItem(attemptIdStorageKey, d.id);
          }
        }

        if (!mounted) return;

        if (foundAttempt) {
          setAttemptId(foundAttempt.id);

          const stored = (foundAttempt.responses || {}) as Record<string, AttemptResponse>;
          setResponses((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((qid) => {
              if (stored[qid]) next[qid] = stored[qid];
            });
            return next;
          });

          setCurrentIndex(safeNumber(foundAttempt.currentIndex, 0));

          const startedMs =
            foundAttempt.startedAtMs ||
            (foundAttempt.startedAt && typeof foundAttempt.startedAt.toMillis === "function"
              ? foundAttempt.startedAt.toMillis()
              : null);

          setAttemptStartedAtMs(startedMs ? safeNumber(startedMs, Date.now()) : null);
          setDurationSec(safeNumber(foundAttempt.durationSec, meta.durationMinutes * 60));

          setIsStarted(false);
          setStartDialogOpen(true);
        } else {
          setAttemptId(null);
          setAttemptStartedAtMs(null);
          setIsStarted(false);
          setStartDialogOpen(true);
        }
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setLoadError(e?.message || "Failed to load test");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [testId, authLoading, tenantLoading, firebaseUser, educatorId, attemptIdStorageKey]);

  
  // Always show instructions gate before starting / resuming
  useEffect(() => {
    if (loading || authLoading || tenantLoading) return;
    if (!isStarted) {
      setInstructionsOpen(true);
      setInstructionsChecked(false);
    }
  }, [loading, authLoading, tenantLoading, isStarted, testId]);

// Keep section in sync
  useEffect(() => {
    const q = questions[currentIndex];
    if (q?.sectionId) setCurrentSectionId(q.sectionId);
  }, [questions, currentIndex]);

  // Mark visited (only after started)
  useEffect(() => {
    if (!isStarted || !currentQuestion || !attemptId) return;
    const qId = currentQuestion.id;

    setResponses((prev) => {
      const cur = prev[qId];
      if (!cur || cur.visited) return prev;

      const next = { ...prev, [qId]: { ...cur, visited: true } };
      queueAttemptUpdate({ [`responses.${qId}.visited`]: true, currentIndex });
      return next;
    });
  }, [isStarted, currentQuestion, attemptId, queueAttemptUpdate, currentIndex]);

  // Heartbeat (optional, keeps updatedAt fresh)
  useEffect(() => {
    if (!isStarted || !attemptId) return;
    const i = window.setInterval(() => queueAttemptUpdate({ currentIndex }), 20000);
    return () => window.clearInterval(i);
  }, [isStarted, attemptId, queueAttemptUpdate, currentIndex]);

  // Leave fullscreen on unmount
  useEffect(() => {
    return () => {
      exitFullscreenSafe();
    };
  }, []);

  // Hide any app sidebars/scroll while attempting (CBT should feel like a dedicated screen)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);


  const goToIndex = (idx: number) => {
    const next = Math.max(0, Math.min(idx, questions.length - 1));
    setCurrentIndex(next);
    if (attemptId) queueAttemptUpdate({ currentIndex: next });
  };

  const handleStart = async () => {
    if (!firebaseUser || !testId || !educatorId || !testMeta) return;

    const fullscreenOk = await requestFullscreenSafe();
    if (!fullscreenOk) toast.message("Fullscreen was blocked by browser. Continuing in normal mode.");

    let id = attemptId;
    let startedAtMs = attemptStartedAtMs;

    try {
      const totalSec = durationSec || testMeta.durationMinutes * 60;

      // Resume expired attempt -> submit immediately
      if (id && startedAtMs && computeRemainingSeconds(startedAtMs, totalSec) <= 0) {
        toast.error("Time is already over. Submitting your test...");
        await handleSubmit(true);
        return;
      }

      if (!id) {
        startedAtMs = Date.now();
        const initialResponses = buildInitResponses(questions);

        const payload: AttemptDoc = {
          studentId: firebaseUser.uid,
          educatorId,
          tenantSlug: tenantSlug || null,
          testId,
          testTitle: testMeta.title,
          subject: testMeta.subject,
          status: "in_progress",
          durationSec: totalSec,
          startedAtMs,
          currentIndex,
          responses: initialResponses,
          createdAt: serverTimestamp(),
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const ref = await addDoc(collection(db, "attempts"), payload);
        id = ref.id;

        setAttemptId(id);
        localStorage.setItem(attemptIdStorageKey, id);

        setResponses((prev) => ({ ...initialResponses, ...prev }));
      } else if (!startedAtMs) {
        startedAtMs = Date.now();
        setAttemptStartedAtMs(startedAtMs);
        await updateDoc(doc(db, "attempts", id), { startedAtMs, updatedAt: serverTimestamp() });
      }

      const remaining = computeRemainingSeconds(startedAtMs!, totalSec);
      setAttemptStartedAtMs(startedAtMs!);
      setDurationSec(totalSec);
      setTimerStartSeconds(remaining);

      setIsStarted(true);
      setStartDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to start test");
    }
  };

  const handleAnswer = (answer: string) => {
    if (!currentQuestion || !attemptId) return;

    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], answer, answered: String(answer).length > 0 },
    }));

    queueAttemptUpdate({
      [`responses.${currentQuestion.id}.answer`]: answer,
      [`responses.${currentQuestion.id}.answered`]: String(answer).length > 0,
      currentIndex,
    });
  };

  const handleMarkForReview = () => {
    if (!currentQuestion || !attemptId) return;
    const nextVal = !responses[currentQuestion.id]?.markedForReview;

    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], markedForReview: nextVal },
    }));

    queueAttemptUpdate({ [`responses.${currentQuestion.id}.markedForReview`]: nextVal, currentIndex });
  };

  const handleClearResponse = () => {
    if (!currentQuestion || !attemptId) return;

    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], answer: null, answered: false },
    }));

    queueAttemptUpdate({
      [`responses.${currentQuestion.id}.answer`]: null,
      [`responses.${currentQuestion.id}.answered`]: false,
      currentIndex,
    });
  };

  const computeScore = () => {
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    for (const q of questions) {
      maxScore += safeNumber(q.marks.correct, 0);

      const ans = responses[q.id]?.answer;
      if (ans === null || ans === undefined || String(ans).trim() === "") {
        unansweredCount += 1;
        continue;
      }

      if (q.type === "integer") {
        if (String(ans).trim() === String(q.correctAnswer ?? "").trim()) {
          score += safeNumber(q.marks.correct, 0);
          correctCount += 1;
        } else {
          score -= Math.abs(safeNumber(q.marks.incorrect, 0));
          incorrectCount += 1;
        }
      } else {
        if (String(ans) === String(q.correctAnswer ?? "")) {
          score += safeNumber(q.marks.correct, 0);
          correctCount += 1;
        } else {
          score -= Math.abs(safeNumber(q.marks.incorrect, 0));
          incorrectCount += 1;
        }
      }
    }

    const attempted = correctCount + incorrectCount;
    const accuracy = attempted > 0 ? correctCount / attempted : 0;

    return { score, maxScore, correctCount, incorrectCount, unansweredCount, accuracy };
  };

  const flushPendingSaves = async () => {
    if (!attemptRef) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    const pending = pendingUpdateRef.current;
    pendingUpdateRef.current = {};
    if (Object.keys(pending).length > 0) await updateDoc(attemptRef, { ...pending, updatedAt: serverTimestamp() });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!attemptId || !firebaseUser || !testId || !educatorId || !testMeta) return;

    try {
      setSaving(true);
      await flushPendingSaves();

      const { score, maxScore, correctCount, incorrectCount, unansweredCount, accuracy } = computeScore();
      const totalSec = durationSec || testMeta.durationMinutes * 60;
      const startedAtMs = attemptStartedAtMs || Date.now();
      const remaining = computeRemainingSeconds(startedAtMs, totalSec);
      const timeTakenSec = Math.max(0, totalSec - remaining);

      await updateDoc(doc(db, "attempts", attemptId), {
        status: "submitted",
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        score,
        maxScore,
        correctCount,
        incorrectCount,
        unansweredCount,
        accuracy,
        timeTakenSec,
      });

      localStorage.removeItem(attemptIdStorageKey);
      await exitFullscreenSafe();

      navigate(`/student/results/${attemptId}?fromTest=true${isAutoSubmit ? "&auto=1" : ""}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit test");
    } finally {
      setSaving(false);
      setSubmitDialogOpen(false);
    }
  };

  const handleTimeUp = async () => {
    toast.error("Time's up! Submitting your test...");
    await handleSubmit(true);
  };

  // Warn on reload/close while started
  useEffect(() => {
    if (!isStarted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isStarted]);

  if (loading || authLoading || tenantLoading) return <div className="text-center py-12">Loading...</div>;
  if (loadError || !testMeta || !currentQuestion) return <div className="text-center py-12">{loadError || "Failed to load test"}</div>;

  const timerKey = isStarted ? `running_${attemptId || "new"}` : `paused_${attemptId || "new"}`;

  return (
    <div className="fixed inset-0 z-[99999] h-[100dvh] bg-background flex flex-col lg:flex-row gap-2 sm:gap-4 p-2 sm:p-4 overflow-hidden">
      {/* Instructions Gate (must proceed to start) */}
      {!isStarted && instructionsOpen && (
        <div className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CBT Instructions</p>
                <h2 className="text-lg font-semibold text-gray-900">{testMeta?.title || "Test"}</h2>
              </div>
              <div className="text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                Duration: {testMeta?.durationMinutes ?? 60} minutes
              </div>
            </div>

            <div className="p-6 space-y-4">
              <ul className="space-y-3 text-sm text-gray-800">
                <li className="flex gap-3">
                  <span className="mt-0.5 h-6 w-6 rounded-md bg-gray-200 border border-gray-400" />
                  <span>This is a computer-based test with a timer; it will auto-submit when time ends.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 h-0 w-0 border-t-[12px] border-b-[12px] border-l-[18px] border-t-transparent border-b-transparent border-l-orange-500" />
                  <span>The time duration for the test is {testMeta?.durationMinutes ?? 60} minutes.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 h-0 w-0 border-t-[12px] border-b-[12px] border-l-[18px] border-t-transparent border-b-transparent border-l-green-500" />
                  <span>Use <b>Save &amp; Next</b> to move forward and <b>Previous</b> to go back.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 h-6 w-6 rounded-full bg-purple-600" />
                  <span>You can change or clear your answer anytime before submission.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 h-6 w-6 rounded-full bg-purple-600 relative">
                    <span className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">✓</span>
                  </span>
                  <span>Use <b>Mark for Review &amp; Next</b> to revisit questions later.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 h-6 w-6 rounded-md bg-gray-100 border border-gray-400 flex items-center justify-center text-[11px] font-semibold">
                    1
                  </span>
                  <span>Check question status using the palette on the right.</span>
                </li>
              </ul>

              <div className="pt-3 border-t space-y-3">
                <label className="flex items-center gap-3 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={instructionsChecked}
                    onChange={(e) => setInstructionsChecked(e.target.checked)}
                  />
                  <span>I have read and understood the instructions</span>
                </label>

                <div className="flex justify-end">
                  <Button
                    className={cn("rounded-xl px-8", !instructionsChecked && "opacity-60")}
                    disabled={!instructionsChecked}
                    onClick={async () => {
                      try {
                        await handleStart();
                        setInstructionsOpen(false);
                      } catch {
                        // handleStart already toasts
                      }
                    }}
                  >
                    PROCEED
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0">
        {/* Header */}
        <div className="shrink-0 flex flex-col gap-3 p-3 sm:p-4 bg-card rounded-xl mb-3 sm:mb-4">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {isStarted ? (
                <TimerChip key={timerKey} initialSeconds={timerStartSeconds} onTimeUp={handleTimeUp} />
              ) : (
                <div className="px-3 py-1 rounded-full bg-muted text-xs font-semibold whitespace-nowrap">
                  {`Not started • ${testMeta.durationMinutes}m`}
                </div>
              )}

              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate">{testMeta.title}</p>
                <p className="text-xs text-muted-foreground">
                  Question {currentIndex + 1} of {questions.length}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="rounded-lg lg:hidden shrink-0"
              onClick={() => setMobilePaletteOpen(true)}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Palette
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("flex items-center gap-1 text-xs mr-auto", saving ? "text-yellow-600" : "text-green-600")}>
              <Save className="h-3 w-3" />
              {saving ? "Saving…" : lastSavedAt ? "Saved" : "Ready"}
            </div>

            {!isStarted && (
              <Button size="sm" className="rounded-lg gradient-bg w-full sm:w-auto" onClick={handleStart}>
                {attemptId ? "Resume" : "Start"}
              </Button>
            )}

            <Button
              variant="destructive"
              size="sm"
              className="rounded-lg w-full sm:w-auto"
              onClick={() => setSubmitDialogOpen(true)}
              disabled={!isStarted}
            >
              Submit
            </Button>
          </div>
        </div>

        {/* Section Tabs */}
        {testMeta.sections.length > 1 && (
          <Tabs value={currentSectionId} onValueChange={setCurrentSectionId} className="mb-4">
            <TabsList className="w-full justify-start overflow-x-auto rounded-xl">
              {testMeta.sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="rounded-lg">
                  {section.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Question Area */}
        <Card className="flex-1 min-h-0 card-soft border-0 overflow-auto">
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {!!currentQuestion.passage && (
              <div className="p-4 bg-pastel-cream rounded-xl">
                <p className="font-semibold mb-2">{currentQuestion.passage.title}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{currentQuestion.passage.content}</p>
              </div>
            )}

            <div>
              <div className="font-semibold text-base sm:text-lg flex gap-2">
                <span className="shrink-0">Q{currentIndex + 1}.</span>
                <HtmlView html={currentQuestion.stem} className="flex-1" />
              </div>
            </div>

            {currentQuestion.type === "mcq" && currentQuestion.options && (
              <RadioGroup
                value={responses[currentQuestion.id]?.answer || ""}
                onValueChange={handleAnswer}
                className="space-y-3"
                disabled={!isStarted}
              >
                {currentQuestion.options.map((option, i) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-xl border-2 transition-colors cursor-pointer",
                      responses[currentQuestion.id]?.answer === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      !isStarted && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <RadioGroupItem value={option.id} id={`${currentQuestion.id}_${option.id}`} />
                    <Label
                      htmlFor={`${currentQuestion.id}_${option.id}`}
                      className="flex-1 cursor-pointer flex gap-2 items-start"
                    >
                      <span className="font-medium shrink-0">{String.fromCharCode(65 + i)}.</span>
                      <HtmlView html={option.text} className="flex-1" />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === "integer" && (
              <Input
                type="number"
                placeholder="Enter your answer"
                value={responses[currentQuestion.id]?.answer || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full sm:max-w-xs rounded-xl text-base sm:text-lg"
                disabled={!isStarted}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="shrink-0 mt-3 sm:mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 sm:flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl w-full sm:w-auto"
              onClick={handleClearResponse}
              disabled={!isStarted}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>

            <Button
              variant={responses[currentQuestion.id]?.markedForReview ? "default" : "outline"}
              className={cn(
                "rounded-xl w-full sm:w-auto",
                responses[currentQuestion.id]?.markedForReview && "bg-purple-500 hover:bg-purple-600"
              )}
              onClick={handleMarkForReview}
              disabled={!isStarted}
            >
              <Flag className="h-4 w-4 mr-1" />
              Mark
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl w-full sm:w-auto"
              disabled={currentIndex === 0}
              onClick={() => goToIndex(currentIndex - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>

            <Button
              className="rounded-xl gradient-bg w-full sm:w-auto"
              disabled={currentIndex === questions.length - 1}
              onClick={() => goToIndex(currentIndex + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Question Palette (Desktop) */}
      <Card className="hidden lg:block w-72 card-soft border-0">
        <CardContent className="p-4">
          <p className="font-semibold mb-4">Question Palette</p>
          <CBTQuestionPalette
            questions={questions.map((q) => ({ id: q.id, sectionId: q.sectionId }))}
            responses={responses}
            currentQuestionIndex={currentIndex}
            onQuestionClick={(idx) => goToIndex(idx)}
            sections={testMeta.sections}
            currentSectionId={currentSectionId}
          />
        </CardContent>
      </Card>

      <Sheet open={mobilePaletteOpen} onOpenChange={setMobilePaletteOpen}>
        <SheetContent side="bottom" className="lg:hidden h-[78dvh] rounded-t-3xl px-0 pb-0">
          <SheetHeader className="px-4 pt-2 pb-4 border-b text-left">
            <SheetTitle className="text-base">Question Palette</SheetTitle>
          </SheetHeader>

          <div className="h-[calc(78dvh-64px)] overflow-y-auto px-4 py-4">
            <CBTQuestionPalette
              questions={questions.map((q) => ({ id: q.id, sectionId: q.sectionId }))}
              responses={responses}
              currentQuestionIndex={currentIndex}
              onQuestionClick={(idx) => {
                goToIndex(idx);
                setMobilePaletteOpen(false);
              }}
              sections={testMeta.sections}
              currentSectionId={currentSectionId}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Submit Dialog */}
  
      {/* Submit Confirmation Overlay (high z-index; not using portal) */}
      {submitDialogOpen && (
        <div className="fixed inset-0 z-[100001] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border shadow-2xl overflow-hidden">
            <div className="p-4 border-b flex items-start gap-3">
              <div className="mt-0.5">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">Submit Test?</p>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to submit? You won&apos;t be able to change your answers.
                </p>
              </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <p className="font-semibold text-green-700 dark:text-green-400">{answeredCount}</p>
                <p className="text-xs text-muted-foreground">Answered</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                <p className="font-semibold text-red-700 dark:text-red-400">{unansweredVisitedCount}</p>
                <p className="text-xs text-muted-foreground">Unanswered</p>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSubmitDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                className="rounded-xl gradient-bg"
                onClick={() => handleSubmit(false)}
                disabled={!isStarted || saving}
              >
                {saving ? "Submitting..." : "Submit Test"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
