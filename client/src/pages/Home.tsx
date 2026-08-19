import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { Link } from "wouter";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { Button } from "@/components/ui/button";
import emailjs from "@emailjs/browser";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FlaskConical,
  Leaf,
  Mail,
  MousePointerClick,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { EMAIL_CONFIG } from "@/data/emailConfig";
import {
  buildQuestions,
  DEFAULT_MODES,
  shuffle,
  formatScore,
  MODE_META,
  type Mode,
  type Question,
  selectBalancedQuestions,
} from "@/lib/quiz";

type Screen = "start" | "quiz" | "result";
type Stat = { correct: number; total: number; label: string };
type Stats = Record<string, Stat>;
type MatchSelection = { side: "left" | "right"; index: number } | null;
type ReviewRecord = { answer: string | null; isCorrect: boolean };

const HERO_IMAGE = "/manus-storage/doctor-farmer-hero_f547dfc1.jpg";
const LAB_IMAGE = "/manus-storage/doctor-farmer-lab_b5f6314f.jpg";
const RESULT_IMAGE = "/manus-storage/doctor-farmer-result_aa3b4871.jpg";
const LOGO_IMAGE = "/manus-storage/doctor-farmer-mark_1fd4bf89.png";
const PATTERN_IMAGE = "/manus-storage/doctor-farmer-pattern_4d62f1f2.jpg";

const modeOrder: Mode[] = ["dv", "prep", "cult", "group", "norma", "situation"];

function addStat(stats: Stats, type: string, label: string, correct: boolean): Stats {
  const next: Stats = { ...stats };
  const current = next[type] ?? { correct: 0, total: 0, label };
  next[type] = {
    correct: current.correct + (correct ? 1 : 0),
    total: current.total + 1,
    label,
  };
  return next;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} сек`;
  if (secs === 0) return `${mins} мин`;
  return `${mins} мин ${secs} сек`;
}

function getTimeLimitSeconds(questionCountNumber: number, selectedModesCount: number): number {
  if (questionCountNumber <= 20) return 420; // 7 минут для 20 вопросов
  if (questionCountNumber <= 30) return 600; // 10 минут для 30 вопросов
  if (questionCountNumber <= 50) return 1020; // 17 минут для 50 вопросов
  if (questionCountNumber <= 100) return 2040; // 34 минуты для 100 вопросов
  return questionCountNumber * 20;
}

function ButtonArrow({ children, onClick, disabled = false }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={`action-button action-primary ${disabled ? "is-disabled" : ""}`} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      <ArrowRight size={17} />
    </button>
  );
}

function getCorrectAnswer(question: Question): string {
  if (question.kind === "choice") return question.correct;
  return question.items.map(item => `${item.name} — ${item.dv}`).join("; ");
}

function getMatchAnswer(question: Question): string {
  if (question.kind === "choice") return "";
  return question.items.map(item => `${item.name} / ${item.dv}`).join(", ");
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("start");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [selectedModes, setSelectedModes] = useState<Mode[]>([...modeOrder]);
  const [questionCount, setQuestionCount] = useState<string>("30");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState<Stats>({});
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const scoreRef = useRef(0);
  const statsRef = useRef<Stats>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [matchSelection, setMatchSelection] = useState<MatchSelection>(null);
  const [matchedLeft, setMatchedLeft] = useState<number[]>([]);
  const [matchedRight, setMatchedRight] = useState<number[]>([]);
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const [answerRecords, setAnswerRecords] = useState<Record<string, ReviewRecord>>({});
  const answerRecordsRef = useRef<Record<string, ReviewRecord>>({});

  const currentQuestion = questions[currentIndex];
  const percent = questions.length ? Math.round((currentIndex / questions.length) * 100) : 0;
  const currentMeta = currentQuestion ? MODE_META[currentQuestion.type] : MODE_META.dv;
  const currentMatchRight = useMemo(() => {
    if (!currentQuestion || currentQuestion.kind !== "match") return [];
    return currentQuestion.items.map((item, index) => ({ ...item, originalIndex: index })).sort(() => Math.random() - 0.5);
  }, [currentQuestion]);
  const currentOptions = useMemo(() => {
    if (!currentQuestion || currentQuestion.kind !== "choice") return [];
    return [currentQuestion.correct, ...currentQuestion.wrong].sort(() => Math.random() - 0.5);
  }, [currentQuestion]);

  useEffect(() => {
    if (screen !== "quiz" || !timeLimitSeconds || timeExpired) return;
    setTimerLeft(timeLimitSeconds);
    const interval = window.setInterval(() => {
      setTimerLeft((remaining) => {
        if (remaining <= 1) {
          window.clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [screen, timeLimitSeconds, timeExpired]);

  function toggleMode(mode: Mode) {
    setSelectedModes((previous) => {
      if (previous.includes(mode)) return previous.length > 1 ? previous.filter((item) => item !== mode) : previous;
      return [...previous, mode];
    });
  }

  function startQuiz() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    const generated = buildQuestions(selectedModes);
    const count = Number(questionCount);
    const selected = selectBalancedQuestions(generated, selectedModes, count);
    const limit = getTimeLimitSeconds(selected.length, selectedModes.length);
    setQuestions(selected);
    setCurrentIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setStats({});
    statsRef.current = {};
    setStreak(0);
    setAnswered(false);
    setSelectedOption(null);
    setMatchSelection(null);
    setMatchedLeft([]);
    setMatchedRight([]);
    setWrongPair(null);
    setTimeLimitSeconds(limit);
    setTimerLeft(limit);
    setTimeExpired(false);
    setEmailStatus("idle");
    setEmailMessage("");
    setAnswerRecords({});
    answerRecordsRef.current = {};
    setScreen("quiz");
  }

  function goStart() {
    setScreen("start");
  }

  function playSchoolBell() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      const frequencies = [587.33, 880, 1174.66, 880, 587.33, 880];
      frequencies.forEach((freq, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, context.currentTime + index * 0.22);
        gain.gain.setValueAtTime(0.001, context.currentTime + index * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.28, context.currentTime + index * 0.22 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.22 + 0.35);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + index * 0.22);
        oscillator.stop(context.currentTime + index * 0.22 + 0.4);
      });
      window.setTimeout(() => void context.close(), 2500);
    } catch {
      // Audio autoplay restrictions may apply
    }
  }

  function playTimeoutTone() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      [300, 200, 150].forEach((freq, start) => {
        const oscillator = context.createOscillator();
        const overtone = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sawtooth";
        overtone.type = "square";
        oscillator.frequency.setValueAtTime(freq, context.currentTime + start * 0.18);
        overtone.frequency.setValueAtTime(freq * 1.5, context.currentTime + start * 0.18);
        gain.gain.setValueAtTime(0.001, context.currentTime + start * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + start * 0.18 + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start * 0.18 + 0.35);
        oscillator.connect(gain);
        overtone.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + start * 0.18);
        overtone.start(context.currentTime + start * 0.18);
        oscillator.stop(context.currentTime + start * 0.18 + 0.4);
        overtone.stop(context.currentTime + start * 0.18 + 0.4);
      });
      window.setTimeout(() => void context.close(), 2200);
    } catch {
      // Audio autoplay restrictions may apply
    }
  }

  function handleTimeout() {
    if (timeExpired || screen !== "quiz") return;
    setTimeExpired(true);
    setTimerLeft(0);
    setAnswered(true);
    setSelectedOption(null);
    setMatchSelection(null);
    playTimeoutTone();
    window.setTimeout(() => finishQuiz(scoreRef.current, statsRef.current), 850);
  }

  function handleMatchClick(side: "left" | "right", index: number) {
    if (answered || !currentQuestion || currentQuestion.kind !== "match") return;
    const isAlreadyMatched = side === "left" ? matchedLeft.includes(index) : matchedRight.includes(index);
    if (isAlreadyMatched) return;
    if (!matchSelection) {
      setMatchSelection({ side, index });
      return;
    }
    if (matchSelection.side === side) {
      setMatchSelection({ side, index });
      return;
    }

    const leftIndex = side === "left" ? index : matchSelection.index;
    const rightIndex = side === "right" ? index : matchSelection.index;
    const leftItem = currentQuestion.items[leftIndex];
    const rightItem = currentQuestion.items[rightIndex];
    const isCorrect = leftItem.name === rightItem.name && leftItem.dv === rightItem.dv;
    setMatchSelection(null);
    if (isCorrect) {
      const nextLeft = [...matchedLeft, leftIndex];
      const nextRight = [...matchedRight, rightIndex];
      setMatchedLeft(nextLeft);
      setMatchedRight(nextRight);
      if (nextLeft.length === currentQuestion.items.length) registerAnswer(true, currentQuestion, getMatchAnswer(currentQuestion));
    } else {
      setWrongPair([leftIndex, rightIndex]);
      window.setTimeout(() => setWrongPair(null), 650);
    }
  }

  function goNext() {
    if (currentIndex >= questions.length - 1) return;
    setCurrentIndex((value) => value + 1);
    setAnswered(false);
    setSelectedOption(null);
    setMatchSelection(null);
    setMatchedLeft([]);
    setMatchedRight([]);
    setWrongPair(null);
  }

  function restartQuiz() {
    startQuiz();
  }

  function registerAnswer(correct: boolean, question: Question, givenAnswer: string) {
    if (answered) return;
    setAnswered(true);
    const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore);
    scoreRef.current = nextScore;
    const nextStats = addStat(stats, question.type, question.typeLabel, correct);
    setStats(nextStats);
    statsRef.current = nextStats;
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);

    const record: ReviewRecord = { answer: givenAnswer, isCorrect: correct };
    const nextRecords = { ...answerRecordsRef.current, [question.id]: record };
    answerRecordsRef.current = nextRecords;
    setAnswerRecords(nextRecords);

    if (currentIndex === questions.length - 1) {
      playSchoolBell();
      window.setTimeout(() => finishQuiz(nextScore, nextStats), 900);
    }
  }

  function handleChoice(option: string) {
    if (answered || !currentQuestion || currentQuestion.kind !== "choice") return;
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correct;
    registerAnswer(isCorrect, currentQuestion, option);
  }

  function finishQuiz(finalScore: number, finalStats: Stats) {
    playSchoolBell();
    setScreen("result");
    setEmailStatus("sending");

    const percentage = formatScore(finalScore, questions.length);
    const resultMessage = percentage >= 90 ? "Мастер продуктовой карты" : percentage >= 75 ? "Сильный результат" : percentage >= 55 ? "Хороший старт" : "Время для практики";
    
    const details = Object.entries(finalStats).map(([key, item]) => {
      const rate = Math.round((item.correct / item.total) * 100);
      return `${item.label}: ${item.correct}/${item.total} (${rate}%)`;
    }).join("\n");

    const recipients = `${EMAIL_CONFIG.recipient}, afanasev_mv@doctorfarmer.ru`;

    emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, {
        to_email: recipients,
        employee_name: name,
        score: finalScore,
        total: questions.length,
        percent: percentage,
        details,
        rank: resultMessage,
        modes: selectedModes.map((mode) => MODE_META[mode].label).join(", "),
      }, EMAIL_CONFIG.publicKey)
      .then(() => {
        setEmailStatus("ok");
        setEmailMessage(`Результат успешно отправлен руководителям (${recipients})`);
      })
      .catch(() => {
        setEmailStatus("fail");
        setEmailMessage("Не удалось отправить письмо. Результат доступен на этой странице.");
      });
  }

  if (screen === "start") {
    return (
      <main className="site-shell start-shell">
        <header className="site-header flex items-center justify-between gap-2 py-1 mb-4">
          <div className="flex items-center">
            <Link href="/">
              <DoctorFarmerLogo className="h-7 sm:h-11 w-auto cursor-pointer" />
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/">
              <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-[10px] h-7 px-2">
                Главная
              </Button>
            </Link>
            <Link href="/agro-helper">
              <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-[10px] h-7 px-2">
                АгроПомощник
              </Button>
            </Link>
          </div>
        </header>

        <section className="start-layout-single">
          <div className="start-main">
            <div className="hero-panel" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
              <div className="hero-overlay" />
              <div className="hero-copy">
                <div className="eyebrow light"><span className="eyebrow-dot" /> price knowledge / field edition</div>
                <h1>Знания, которые<br /><em>работают на поле.</em></h1>
                <p>Проверка знаний и продуктовой линейки ДФ.</p>
              </div>
            </div>

            <section className="setup-card">
              <div className="rules-strip">
                <div className="rule-item"><strong>01</strong> Выберите темы и количество вопросов.</div>
                <div className="rule-item"><strong>02</strong> На весь тест отводится фиксированное время.</div>
                <div className="rule-item"><strong>03</strong> Результат автоматически уйдёт руководителю на почту.</div>
              </div>

              <div className="name-input-wrap"><label htmlFor="employee-name">Фамилия Имя (обязательно)</label><div className={`field-with-icon ${nameError ? "has-error" : ""}`}><Target size={17} /><input id="employee-name" value={name} onChange={(event) => { setName(event.target.value); if (event.target.value.trim()) setNameError(false); }} placeholder="Например, Иванов Иван" /></div>{nameError && <div className="error-hint">Пожалуйста, укажите Фамилию и Имя перед началом теста.</div>}</div>
              <div className="mode-section-heading"><span>Темы теста</span><span className="selected-counter">{selectedModes.length} из {modeOrder.length} тем</span></div>
              <div className="mode-grid">
                {modeOrder.map((mode) => {
                  const meta = MODE_META[mode];
                  const active = selectedModes.includes(mode);
                  return <button key={mode} type="button" className={`mode-tile ${active ? "is-active" : ""}`} onClick={() => toggleMode(mode)} style={{ "--mode-color": meta.color, "--mode-tint": meta.tint } as React.CSSProperties}><span className="mode-icon">{meta.icon}</span><span className="mode-name">{meta.short}</span><span className="mode-check">{active && <Check size={13} />}</span></button>;
                })}
              </div>
              <div className="settings-line"><label>Вопросов <select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)}><option value="20">20</option><option value="30">30</option><option value="50">50</option><option value="100">100</option><option value="999">Все доступные</option></select></label><div className="timer-fixed"><Clock3 size={16} /><span>Фиксированное время: {questionCount === "999" ? "20 сек/вопрос" : formatDuration(getTimeLimitSeconds(Number(questionCount), Number(questionCount)))}</span></div><ButtonArrow onClick={startQuiz}>Начать тестирование</ButtonArrow></div>
              <div className="setup-footnote"><MousePointerClick size={14} /> Откройте ссылку на любом устройстве — тест работает в браузере.</div>
            </section>
          </div>
        </section>
        <footer className="site-footer"><span>DOCTOR FARMER / internal learning tool</span><span>Сделано для команды, которая знает культуру.</span></footer>
      </main>
    );
  }

  if (screen === "quiz" && currentQuestion) {
    const options = currentOptions;
    const matchItems = currentQuestion.kind === "match" ? currentQuestion.items : [];
    return (
      <main className="site-shell quiz-shell">
        <header className="quiz-topbar flex items-center justify-between gap-2 py-1 mb-4">
          <div className="flex items-center gap-2">
            <button type="button" className="back-link text-[11px] flex items-center gap-1 text-[#194f38]" onClick={goStart}><ArrowLeft size={13} /> К настройкам</button>
            <Link href="/">
              <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-[10px] h-7 px-2">
                Главная
              </Button>
            </Link>
          </div>
          <div className="quiz-brand flex items-center gap-1">
            <Link href="/">
              <DoctorFarmerLogo className="h-6 sm:h-9 w-auto cursor-pointer" />
            </Link>
          </div>
          <div className="quiz-score"><span>Счёт</span><strong>{score}</strong></div>
        </header>
        <div className="progress-meta"><span>Вопрос <strong>{currentIndex + 1}</strong> из {questions.length}</span><span>{percent}% пройдено</span></div><div className="progress-track"><div className="progress-value" style={{ width: `${Math.max(percent, 3)}%` }} /></div>
        <section className="quiz-layout">
          <div className={`question-panel ${answered ? "is-answered" : ""}`}>
            <div className="question-meta"><span className="question-tag" style={{ color: currentMeta.color, background: currentMeta.tint }}><span>{currentMeta.icon}</span>{currentQuestion.typeLabel}</span>{streak >= 3 && <span className="streak"><Sparkles size={14} /> серия {streak}</span>}</div>
            <h1 className="question-title">{currentQuestion.prompt}</h1>
            {currentQuestion.kind === "choice" && <div className="answer-options">{options.map((option, index) => { const isCorrect = option === currentQuestion.correct; const isWrong = answered && selectedOption === option && !isCorrect; return <button type="button" key={`${option}-${index}`} disabled={answered || timeExpired} className={`answer-option ${answered && isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`} onClick={() => handleChoice(option)}><span className="option-index">{String.fromCharCode(65 + index)}</span><span>{option}</span>{answered && isCorrect && <CheckCircle2 size={18} />}{isWrong && <X size={18} />}</button>; })}</div>}
            {currentQuestion.kind === "match" && <div className="match-area"><div className="match-instruction">Выберите препарат слева, затем соответствующее действующее вещество справа.</div><div className="match-columns"><div><div className="match-label">Препарат</div>{matchItems.map((item, index) => <button key={item.name} type="button" className={`match-option ${matchedLeft.includes(index) ? "matched" : ""} ${matchSelection?.side === "left" && matchSelection.index === index ? "selected" : ""} ${wrongPair?.[0] === index ? "wrong" : ""}`} onClick={() => handleMatchClick("left", index)} disabled={answered || timeExpired || matchedLeft.includes(index)}><span>{item.name}</span>{matchedLeft.includes(index) && <Check size={16} />}</button>)}</div><div><div className="match-label">Действующее вещество</div>{currentMatchRight.map((item) => <button key={`${item.dv}-${item.originalIndex}`} type="button" className={`match-option ${matchedRight.includes(item.originalIndex) ? "matched" : ""} ${matchSelection?.side === "right" && matchSelection.index === item.originalIndex ? "selected" : ""} ${wrongPair?.[1] === item.originalIndex ? "wrong" : ""}`} onClick={() => handleMatchClick("right", item.originalIndex)} disabled={answered || timeExpired || matchedRight.includes(item.originalIndex)}><span>{item.dv}</span>{matchedRight.includes(item.originalIndex) && <Check size={16} />}</button>)}</div></div><div className="match-progress-line"><span>Сопоставлено</span><strong>{matchedLeft.length} / {matchItems.length}</strong></div></div>}
            <div className={`answer-feedback ${answered ? "visible" : ""}`}>{answered ? <><CheckCircle2 size={17} /><span>{currentQuestion.kind === "match" ? "Все пары сопоставлены." : selectedOption === (currentQuestion.kind === "choice" ? currentQuestion.correct : "") ? "Верно. Отличный ориентир." : `Правильный ответ: ${currentQuestion.kind === "choice" ? currentQuestion.correct : "см. пояснение"}`}</span></> : <><FlaskConical size={17} /><span>Выберите один вариант ответа.</span></>}</div>
            {answered && <div className="explanation"><span>пояснение</span><p>{currentQuestion.explanation}</p></div>}
            {answered && currentIndex < questions.length - 1 && <ButtonArrow onClick={goNext} disabled={timeExpired}>{timeExpired ? "Время истекло" : "Следующий вопрос"}</ButtonArrow>}
            {answered && currentIndex === questions.length - 1 && <ButtonArrow onClick={() => finishQuiz(score, stats)} disabled={timeExpired}>{timeExpired ? "Время истекло" : "К результатам"}</ButtonArrow>}
          </div>
          <aside className="quiz-rail"><div className="rail-number">{String(currentIndex + 1).padStart(2, "0")}</div><div className="rail-line" /><div className="rail-copy"><span>сейчас проверяем</span><strong>{currentQuestion.typeLabel}</strong><p>Не спешите: точность важнее скорости.</p></div><div className={`timer-card ${timerLeft <= 60 ? "critical" : timerLeft <= 180 ? "warning" : ""}`} role="status" aria-live="polite"><Clock3 size={17} /><div><span>{timerLeft <= 60 ? "последняя минута" : "время на тест"}</span><strong>{formatDuration(timerLeft)}</strong></div></div><div className="rail-quote">«Сильная экспертиза — это когда правильное решение приходит вовремя.»</div></aside>
        </section>
      </main>
    );
  }

  const percentage = formatScore(score, questions.length);
  const resultMessage = percentage >= 90 ? "Мастер продуктовой карты" : percentage >= 75 ? "Сильный результат" : percentage >= 55 ? "Хороший старт" : "Время для практики";
  const resultSub = percentage >= 75 ? "Вы уверенно ориентируетесь в ключевых характеристиках препаратов." : "Повторите темы с наименьшим результатом и пройдите сессию ещё раз.";
  return (
    <main className="site-shell result-shell">
      <header className="quiz-topbar flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 flex-wrap">
          <button type="button" className="back-link text-xs flex items-center gap-1 text-[#194f38]" onClick={goStart}><ArrowLeft size={14} /> К настройкам</button>
          <div className="flex items-center gap-1.5">
            <Link href="/">
              <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-[10px] h-7 px-2">
                На главную
              </Button>
            </Link>
            <Link href="/agro-helper">
              <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-[10px] h-7 px-2">
                АгроПомощник
              </Button>
            </Link>
          </div>
        </div>
        <div className="quiz-brand flex items-center gap-2">
          <Link href="/">
            <DoctorFarmerLogo className="h-7 sm:h-9 w-auto cursor-pointer" />
          </Link>
        </div>
        <div className="quiz-score"><span>Сотрудник</span><strong className="score-name">{name}</strong></div>
      </header>
      <section className="result-hero" style={{ backgroundImage: `url(${RESULT_IMAGE})` }}><div className="result-overlay" /><div className="result-content"><div className="eyebrow light"><span className="eyebrow-dot" /> session complete</div><div className="result-scoreline"><strong>{score}</strong><span>/ {questions.length}<small>правильных ответов</small></span></div><h1>{resultMessage}</h1><p>{resultSub}</p><div className={`email-state ${emailStatus}`}><Mail size={16} />{emailStatus === "sending" ? "Отправляем итог руководителю…" : emailMessage}</div></div><div className="result-badge"><Trophy size={20} /><span>{percentage}%<small>точность</small></span></div></section>
      <section className="result-body"><div className="result-section-heading"><div><div className="section-kicker">02 / your field report</div><h2>Разбор по темам</h2></div><span>{questions.length} вопросов · {selectedModes.length} тем</span></div><div className="result-grid"><div className="stats-list">{Object.entries(stats).map(([key, item]) => { const rate = Math.round((item.correct / item.total) * 100); const meta = MODE_META[key as Mode] ?? MODE_META.dv; return <div className="stat-row" key={key}><div className="stat-title"><span className="stat-icon" style={{ color: meta.color, background: meta.tint }}>{meta.icon}</span><span>{item.label}</span><strong>{item.correct}/{item.total}</strong></div><div className="stat-track"><div style={{ width: `${rate}%`, background: meta.color }} /></div></div>; })}</div><aside className="result-next"><div className="section-kicker">следующий шаг</div><h3>Закрепите результат<br /><em>в следующем поле.</em></h3><p>Повторите только те разделы, где точность ниже 75%.</p><div className="result-actions"><button type="button" className="action-button action-primary" onClick={restartQuiz}><span>Пройти ещё раз</span><RotateCcw size={17} /></button><button type="button" className="action-button action-outline" onClick={goStart}><span>Изменить темы</span><ChevronRight size={17} /></button></div></aside></div></section>
      <section className="review-section"><div className="result-section-heading review-heading"><div><div className="section-kicker">03 / learn from the field</div><h2>Правильные ответы и пояснения</h2></div><span>Проверьте каждый вопрос и закрепите материал</span></div><div className="review-list">{questions.map((question, index) => { const record = answerRecords[question.id]; const isCorrect = record?.isCorrect ?? false; const userAnswer = record?.answer ?? "Ответ не выбран — время истекло."; const correctAnswer = getCorrectAnswer(question); const meta = MODE_META[question.type]; return <article className={`review-card ${isCorrect ? "is-correct" : "is-missed"}`} key={question.id}><div className="review-card-top"><span className="review-index">{String(index + 1).padStart(2, "0")}</span><span className="question-tag" style={{ color: meta.color, background: meta.tint }}><span>{meta.icon}</span>{question.typeLabel}</span><span className={`review-result ${isCorrect ? "is-correct" : "is-missed"}`}>{isCorrect ? "Верно" : "Повторить"}</span></div><h3>{question.prompt}</h3><div className="review-answer-grid"><div className={`review-answer ${isCorrect ? "is-positive" : "is-negative"}`}><span className="review-label">Ваш ответ</span><p>{userAnswer}</p></div><div className="review-answer is-positive"><span className="review-label">Правильный ответ</span><p>{correctAnswer}</p></div></div><div className="review-explanation"><span>Агрономическое пояснение</span><p>{question.explanation}</p></div></article>; })}</div></section>
      <footer className="site-footer"><span>DOCTOR FARMER / internal learning tool</span><span><Send size={13} /> результаты направлены в рабочую почту</span></footer>
    </main>
  );
}
