/**
 * A practice session.
 *
 * One question, filling the screen, with three large answers under it. No
 * clock, no score, no way to lose. A wrong answer shows the right one in the
 * warm wash and then asks the same question again, so the last thing that
 * happens on every card is that the person gets it right.
 *
 * The session can be left at any point: everything answered up to then has
 * already been written down.
 */
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../components/practice/screen";
import { ChunkyButton } from "../components/practice/chunky-button";
import { OptionButton, type OptionState } from "../components/practice/option-button";
import { ProgressDots } from "../components/practice/progress-dots";
import { MemoryPhoto } from "../components/practice/memory-photo";
import { AppText, Title } from "../components/practice/text";
import { RekallaAvatar } from "../components/rekalla-avatar";
import { radius, space } from "../lib/design/tokens";
import { useReduceMotion } from "../lib/design/motion";
import { feltRight, feltTap } from "../lib/design/feedback";
import { DEFAULT_DAILY_GOAL, usePractice } from "../lib/practice/context";
import { localDayKey } from "../lib/practice/scheduler";
import {
  advance,
  answerQuestion,
  assembleSession,
  buildQueue,
  currentQuestion,
  sessionProgress,
  startSession,
  type SessionState,
} from "../lib/practice/session";
import type { PracticeQuestion } from "../lib/practice/card-generator";
import { useTheme } from "../lib/design/theme";

/** The first outing after setup is shorter, and about one person. */
const INTRO_SHOWINGS = 3;

export default function Practice() {
  const colors = useTheme();
  const params = useLocalSearchParams<{
    mode?: string;
    itemId?: string;
    after?: string;
  }>();
  const isIntro = params.mode === "intro";
  const backToSetup = (params.after ?? (isIntro ? "setup" : "home")) === "setup";
  const { ready, data, user, settle, daysPractised, backUpQuietly } = usePractice();
  const reduceMotion = useReduceMotion();

  const [state, setState] = useState<SessionState | null>(null);
  const [practisedCount, setPractisedCount] = useState(0);

  // Built once, from the state as it stood when the session opened. A session
  // that reshuffled itself underneath somebody mid-question would be unusable.
  useEffect(() => {
    if (!ready || state) return;

    const now = new Date();
    const goal = user?.dailyGoalCards ?? DEFAULT_DAILY_GOAL;
    let queue: PracticeQuestion[] = [];

    if (isIntro && params.itemId) {
      const card = data.cards.find((candidate) => candidate.memoryItemId === params.itemId);
      if (card) {
        queue = buildQueue({
          plan: { reviews: [], introductions: [card], padding: [] },
          items: data.items,
          random: Math.random,
          showings: INTRO_SHOWINGS,
        });
      }
    } else {
      const practisedToday =
        data.practisedToday.day === localDayKey(now) ? data.practisedToday.cardIds : [];
      const plan = assembleSession(data.cards, now, goal, practisedToday);
      queue = buildQueue({ plan, items: data.items, random: Math.random });
    }

    setState(startSession(queue));
  }, [ready, state, isIntro, params.itemId, data, user]);

  // The end of a session is the natural moment to send a copy up: the phone
  // is awake, somebody has just finished, and nothing is waiting on it.
  const finished = state?.phase === "finished";
  useEffect(() => {
    if (finished) void backUpQuietly();
  }, [finished, backUpQuietly]);

  function leave() {
    router.replace(backToSetup ? "/setup/more" : "/home");
  }

  function choose(option: string) {
    if (!state) return;
    const outcome = answerQuestion(state, option);

    // The neutral tap acknowledges the choice; the celebratory one only ever
    // follows a correct answer. A miss is deliberately silent — see
    // lib/design/feedback.ts.
    const haptics = user?.hapticsOn ?? true;
    void feltTap(haptics);
    if (outcome.wasCorrect) void feltRight(haptics);

    setState(outcome.state);
    if (outcome.settle) {
      setPractisedCount((count) => count + 1);
      void settle(outcome.settle.cardId, outcome.settle.wasCorrect);
    }
  }

  if (!state) {
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  }

  if (state.phase === "finished") {
    return (
      <Finished
        count={practisedCount}
        daysPractised={daysPractised}
        isIntro={isIntro}
        onDone={leave}
      />
    );
  }

  const question = currentQuestion(state);
  if (!question) return <View style={{ flex: 1, backgroundColor: colors.paper }} />;

  const progress = sessionProgress(state);
  const answered = state.phase === "correct" || state.phase === "reveal";

  const stateFor = (option: string): OptionState => {
    if (!answered) return "idle";
    if (state.phase === "correct") {
      return option === state.chosen ? "chosen-correct" : "settled";
    }
    if (option === question.answer) return "shown-answer";
    if (option === state.chosen) return "chosen-other";
    return "settled";
  };

  return (
    <Screen
      onBack={leave}
      backLabel="Finish for now"
      footer={
        answered ? (
          <ChunkyButton
            label="Continue"
            hint={
              state.phase === "reveal"
                ? "Shows the same question again"
                : "Goes to the next question"
            }
            onPress={() => setState(advance(state))}
          />
        ) : undefined
      }
    >
      <ProgressDots total={progress.total} done={progress.done} />

      <Title center>{question.prompt}</Title>

      <MemoryPhoto photoKey={question.photoKey} />

      <View style={{ gap: space(4) }}>
        {question.options.map((option) => (
          <OptionButton
            key={option}
            label={option}
            state={stateFor(option)}
            disabled={answered}
            onPress={() => choose(option)}
          />
        ))}
      </View>

      {state.phase === "correct" || state.phase === "reveal" ? (
        <Feedback
          phase={state.phase}
          answer={question.answer}
          detail={question.detail}
          reduceMotion={reduceMotion}
        />
      ) : null}
    </Screen>
  );
}

/**
 * What is said after an answer. On a miss this is the whole of the response:
 * the answer, warmly, and the fact that it is coming round again. There is no
 * word for what just happened, because naming it would make it a failure.
 */
function Feedback({
  phase,
  answer,
  detail,
  reduceMotion,
}: {
  phase: "correct" | "reveal";
  answer: string;
  detail: string | null;
  reduceMotion: boolean;
}) {
  const colors = useTheme();
  const correct = phase === "correct";
  const scale = useRef(new Animated.Value(reduceMotion ? 1 : 0.96)).current;

  const headline = correct ? "That's right." : `This one is ${answer}.`;

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    scale.setValue(0.96);
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [phase, reduceMotion, scale]);

  // VoiceOver does not read something that simply appears, and this is the
  // part of the screen that has to reach everybody: on a miss it is the whole
  // of the response. Said out loud as soon as it is shown.
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      correct && detail ? `${headline} ${detail}` : headline,
    );
  }, [correct, detail, headline]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: correct ? colors.success : colors.reveal,
        borderColor: correct ? colors.successEdge : colors.revealEdge,
        borderWidth: 2,
        borderRadius: radius.card,
        padding: space(5),
        gap: space(2),
        transform: [{ scale }],
      }}
    >
      <AppText
        size="bodyLarge"
        weight="bold"
        color={correct ? colors.successInk : colors.revealInk}
      >
        {headline}
      </AppText>
      {correct && detail ? (
        <AppText color={colors.successInk}>{detail}</AppText>
      ) : null}
      {!correct ? (
        <AppText color={colors.revealInk}>
          Have a look, and we will come to it again in a moment.
        </AppText>
      ) : null}
    </Animated.View>
  );
}

function Finished({
  count,
  daysPractised,
  isIntro,
  onDone,
}: {
  count: number;
  daysPractised: number;
  isIntro: boolean;
  onDone: () => void;
}) {
  const colors = useTheme();

  return (
    <Screen
      footer={<ChunkyButton label={isIntro ? "Continue" : "Done"} onPress={onDone} />}
      contentStyle={{ paddingTop: space(8) }}
    >
      <View style={{ alignItems: "center", gap: space(6) }}>
        <RekallaAvatar size={140} />
        <Title center>{isIntro ? "There you go." : "That's today done."}</Title>
        <AppText size="bodyLarge" color={colors.inkSoft} center>
          {count === 1
            ? "You practised one thing."
            : `You practised ${count} things.`}
        </AppText>
        {!isIntro && daysPractised > 0 ? (
          <AppText size="bodyLarge" color={colors.inkSoft} center>
            {daysPractised === 1
              ? "That is your first day."
              : `That is ${daysPractised} days of practice.`}
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}
