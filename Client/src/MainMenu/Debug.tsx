import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faAsterisk,
  faBusSimple,
  faCar,
  faCheckSquare,
  faMinusSquare,
  faUser,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { AttendeeStatus } from "../Attendees/Attendee";
import { SortColumnSize } from "../Attendees/Shared";
import { StatusChip } from "../Attendees/StatusChip";
import {
  createSummaryPillSelection,
  SummaryPill,
  SummaryPillId,
  SummaryPillSelection,
} from "../Attendees/SummaryPill";
import { TransportChip } from "../Attendees/TransportChip";
import { Heading } from "../Components/Heading";
import { EmailInput } from "../Components/Inputs/EmailInput";
import { LabelDateInput } from "../Components/Inputs/label/LabelDateInput";
import { LabelTextInput } from "../Components/Inputs/label/LabelTextInput";
import { PasswordInput } from "../Components/Inputs/PasswordInput";
import { Label } from "../Components/Label";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import {
  RollCallCardActivityState,
  RollCallCardList,
  RollCallEmptyStateCard,
  RollCallSessionCard,
  RollCallSessionCardProps,
  RollCallStartCard,
} from "../RollCall/RollCallCardComponents";
import { SupaBase } from "../SupaBase/SupaBase";

export interface DebugProps {
  supabase: SupaBase;
}

interface RollCallDemoExample {
  emptyDescription?: string;
  emptyTitle?: string;
  id: string;
  sessions: RollCallSessionCardProps[];
  startDescription: string;
  startEnabled: boolean;
  title: string;
}

function onDemoAction(): void {
  // Visual demo only.
}

const ROLL_CALL_DEMO_EXAMPLES: RollCallDemoExample[] = [
  {
    emptyDescription:
      "When you start a session it will appear here so you can monitor it and conclude it when needed.",
    emptyTitle: "No Rollcalls Yet",
    id: "no_rollcalls",
    sessions: [],
    startDescription:
      "Click anywhere on this card to start a new rollcall for an assigned event that does not already have an active session.",
    startEnabled: true,
    title: "No Rollcall Events Exist For The User",
  },
  {
    id: "two_closed",
    sessions: [
      {
        absentCount: 1,
        activityState: RollCallCardActivityState.CLOSED,
        participantCount: 12,
        presentCount: 9,
        sessionLabel: "#2 Morning Registration",
        title: "Leadership Summit",
        unscannedCount: 2,
      },
      {
        absentCount: 0,
        activityState: RollCallCardActivityState.CLOSED,
        participantCount: 8,
        presentCount: 8,
        sessionLabel: "#5 Debrief Attendance",
        title: "Ops Debrief",
        unscannedCount: 0,
      },
    ],
    startDescription:
      "Click anywhere on this card to start a new rollcall for an assigned event that does not already have an active session.",
    startEnabled: true,
    title: "No Active Rollcalls But Two Inactive",
  },
  {
    id: "two_active",
    sessions: [
      {
        absentCount: 1,
        activityState: RollCallCardActivityState.ACTIVE,
        onEndRollCall: onDemoAction,
        participantCount: 14,
        presentCount: 10,
        sessionLabel: "#0 Doors Open",
        title: "Final Test Event",
        unscannedCount: 3,
      },
      {
        absentCount: 0,
        activityState: RollCallCardActivityState.ACTIVE,
        onEndRollCall: onDemoAction,
        participantCount: 6,
        presentCount: 4,
        sessionLabel: "#1 Evening Check-In",
        title: "Training Night",
        unscannedCount: 2,
      },
    ],
    startDescription:
      "Every proctored event already has an active rollcall. Conclude one below before starting another for that same event.",
    startEnabled: false,
    title: "No Inactive Rollcalls But Two Active",
  },
  {
    id: "mixed",
    sessions: [
      {
        absentCount: 2,
        activityState: RollCallCardActivityState.ACTIVE,
        onEndRollCall: onDemoAction,
        participantCount: 10,
        presentCount: 6,
        sessionLabel: "#3 Session One",
        title: "Leadership Check-In",
        unscannedCount: 2,
      },
      {
        absentCount: 1,
        activityState: RollCallCardActivityState.CLOSED,
        participantCount: 9,
        presentCount: 7,
        sessionLabel: "#4 Session Zero",
        title: "Field Briefing",
        unscannedCount: 1,
      },
    ],
    startDescription:
      "Click anywhere on this card to start a new rollcall for an assigned event that does not already have an active session.",
    startEnabled: true,
    title: "One Active And One Inactive Rollcall",
  },
];

export const Debug: React.FC = () => {
  useOutletContext<DebugProps>();
  const theme = useTheme();
  const [demoText, setDemoText] = React.useState("Weekly Leadership Sync");
  const [demoSchedule, setDemoSchedule] = React.useState("2026-03-08T13:51");
  const [demoEmail, setDemoEmail] = React.useState("organiser@gla.com");
  const [demoPassword, setDemoPassword] = React.useState("secret-pass");
  const [selectedPills, setSelectedPills] =
    React.useState<SummaryPillSelection>(() =>
      createSummaryPillSelection(true),
    );

  const onToggleSummaryPill = React.useCallback((pillId: SummaryPillId) => {
    setSelectedPills((prev) => ({
      ...prev,
      [pillId]: !prev[pillId],
    }));
  }, []);

  return (
    <S.Container>
      <S.Panel>
        <Heading>Debug</Heading>
        <S.PanelDescription>
          Shared component playground for visual checks.
        </S.PanelDescription>
      </S.Panel>

      <S.Panel>
        <SubHeading>Input Playground</SubHeading>
        <S.PanelDescription>
          Shared BaseInput styling across text, datetime, icon, and disabled
          states.
        </S.PanelDescription>
        <S.InputGrid>
          <LabelTextInput
            label={"Text Input"}
            value={demoText}
            placeholder={"Weekly leadership meeting"}
            onChange={(ev) => setDemoText(ev.target.value)}
          />
          <LabelDateInput
            label={"Datetime Input"}
            type={"datetime-local"}
            value={demoSchedule}
            onChange={(ev) => setDemoSchedule(ev.target.value)}
          />
          <S.InputExample>
            <Label>Email Input</Label>
            <EmailInput
              aria-label={"Demo email input"}
              icon={faUser}
              value={demoEmail}
              placeholder={"organiser@gla.com"}
              onChange={(ev) => setDemoEmail(ev.target.value)}
            />
          </S.InputExample>
          <S.InputExample>
            <Label>Password Input</Label>
            <PasswordInput
              aria-label={"Demo password input"}
              icon={faAsterisk}
              value={demoPassword}
              placeholder={"Enter password"}
              onChange={(ev) => setDemoPassword(ev.target.value)}
            />
          </S.InputExample>
          <LabelTextInput
            label={"Disabled State"}
            value={"This input is disabled"}
            disabled={true}
            onChange={() => null}
          />
        </S.InputGrid>
      </S.Panel>

      <S.Panel>
        <SubHeading>Status Pills</SubHeading>
        <S.Row>
          <StatusChip status={AttendeeStatus.PRESENT} />
          <StatusChip status={AttendeeStatus.ABSENT} />
          <StatusChip status={AttendeeStatus.NOT_SCANNED} />
        </S.Row>
        <S.Row>
          <StatusChip status={AttendeeStatus.PRESENT} compact={true} />
          <StatusChip status={AttendeeStatus.ABSENT} compact={true} />
          <StatusChip status={AttendeeStatus.NOT_SCANNED} compact={true} />
        </S.Row>
      </S.Panel>

      <S.Panel>
        <SubHeading>Transport Pills</SubHeading>
        <S.Row>
          <TransportChip
            usingOwnTransport={false}
            size={SortColumnSize.NORMAL}
          />
          <TransportChip
            usingOwnTransport={true}
            size={SortColumnSize.NORMAL}
          />
        </S.Row>
        <S.Row>
          <TransportChip
            usingOwnTransport={false}
            size={SortColumnSize.COMPACT}
          />
          <TransportChip
            usingOwnTransport={true}
            size={SortColumnSize.COMPACT}
          />
        </S.Row>
        <S.Row>
          <TransportChip
            usingOwnTransport={false}
            size={SortColumnSize.COMPACTER}
          />
          <TransportChip
            usingOwnTransport={true}
            size={SortColumnSize.COMPACTER}
          />
        </S.Row>
      </S.Panel>

      <S.Panel>
        <SubHeading>Summary Pills</SubHeading>
        <S.Row>
          <SummaryPill
            id={SummaryPillId.PRESENT}
            icon={faCheckSquare}
            label={"Present"}
            value={8}
            color={theme.colors.accent.success}
            selected={selectedPills[SummaryPillId.PRESENT]}
            onToggle={onToggleSummaryPill}
          />
          <SummaryPill
            id={SummaryPillId.ABSENT}
            icon={faXmarkSquare}
            label={"Absent"}
            value={2}
            color={theme.colors.accent.danger}
            selected={selectedPills[SummaryPillId.ABSENT]}
            onToggle={onToggleSummaryPill}
          />
          <SummaryPill
            id={SummaryPillId.NOT_SCANNED}
            icon={faMinusSquare}
            label={"No Scan"}
            value={3}
            color={theme.colors.state.disabled}
            selected={selectedPills[SummaryPillId.NOT_SCANNED]}
            onToggle={onToggleSummaryPill}
          />
          <SummaryPill
            id={SummaryPillId.BUS}
            icon={faBusSimple}
            label={"Bus"}
            value={7}
            color={theme.colors.accent.transportBus}
            selected={selectedPills[SummaryPillId.BUS]}
            onToggle={onToggleSummaryPill}
          />
          <SummaryPill
            id={SummaryPillId.CAR}
            icon={faCar}
            label={"Car"}
            value={6}
            color={theme.colors.accent.transportCar}
            selected={selectedPills[SummaryPillId.CAR]}
            onToggle={onToggleSummaryPill}
          />
        </S.Row>
      </S.Panel>

      <S.Panel>
        <SubHeading>Rollcall Page Examples</SubHeading>
        <S.PanelDescription>
          Example states for the rollcalls page using the same card components
          as the live route.
        </S.PanelDescription>
        <S.RollCallExampleGrid>
          {ROLL_CALL_DEMO_EXAMPLES.map((example) => (
            <S.RollCallExamplePanel key={example.id}>
              <S.RollCallExampleTitle>{example.title}</S.RollCallExampleTitle>
              <RollCallCardList>
                <RollCallStartCard
                  canStart={example.startEnabled}
                  description={example.startDescription}
                  onStart={onDemoAction}
                />
                {example.sessions.length === 0 ? (
                  <RollCallEmptyStateCard
                    description={example.emptyDescription ?? ""}
                    title={example.emptyTitle ?? "No Rollcalls Yet"}
                  />
                ) : (
                  example.sessions.map((session, index) => (
                    <RollCallSessionCard
                      absentCount={session.absentCount}
                      activityState={session.activityState}
                      key={`${example.id}_${index}`}
                      onEndRollCall={session.onEndRollCall}
                      participantCount={session.participantCount}
                      presentCount={session.presentCount}
                      sessionLabel={session.sessionLabel}
                      title={session.title}
                      unscannedCount={session.unscannedCount}
                    />
                  ))
                )}
              </RollCallCardList>
            </S.RollCallExamplePanel>
          ))}
        </S.RollCallExampleGrid>
      </S.Panel>
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
    label: DebugContainer;
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin-top: 15px;
    gap: 10px;

    @media (min-width: 700px) {
      padding-left: 10vw;
      padding-right: 10vw;
    }
  `;

  export const Panel = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  `;

  export const PanelDescription = styled(SubHeading)`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 16px;
  `;

  export const Row = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `;

  export const InputGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  `;

  export const InputExample = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  export const RollCallExampleGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  export const RollCallExamplePanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  export const RollCallExampleTitle = styled.div`
    font-size: 15px;
    font-weight: 700;
    color: ${(p) => p.theme.colors.text};
  `;
}
