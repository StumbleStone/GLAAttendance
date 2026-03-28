import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faAsterisk,
  faCheckSquare,
  faMinusSquare,
  faUser,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { AttendeeStatus } from "../Attendees/Attendee";
import {
  AttendeeRecordsItem,
  AttendeesRecordsPanel,
} from "../Attendees/AttendeesPage";
import { StatusChip } from "../Attendees/StatusChip";
import {
  createSummaryPillSelection,
  SummaryPill,
  SummaryPillId,
  SummaryPillSelection,
} from "../Attendees/SummaryPill";
import { CollapsiblePanel } from "../Components/CollapsiblePanel";
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

interface AttendeeDemoExample {
  attendees: AttendeeRecordsItem[];
  id: string;
  initialQuery?: string;
  title: string;
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

const ATTENDEE_DEMO_ITEMS: AttendeeRecordsItem[] = [
  {
    allergies: ["Peanuts"],
    emergencyContacts: ["073 555 0101"],
    fullName: "Anastasia Patel",
    id: "attendee_demo_1",
    name: "Anastasia",
    surname: "Patel",
  },
  {
    allergies: [],
    emergencyContacts: ["071 999 2200"],
    fullName: "Joshua Abrahams",
    id: "attendee_demo_2",
    name: "Joshua",
    surname: "Abrahams",
  },
  {
    allergies: ["Shellfish", "Dairy"],
    emergencyContacts: [],
    fullName: "Amila Minya",
    id: "attendee_demo_3",
    name: "Amila",
    surname: "Minya",
  },
  {
    allergies: [],
    emergencyContacts: ["082 111 4321", "Mom"],
    fullName: "Andries de Jager",
    id: "attendee_demo_4",
    name: "Andries",
    surname: "de Jager",
  },
];

const ATTENDEE_DEMO_EXAMPLES: AttendeeDemoExample[] = [
  {
    attendees: [],
    id: "empty_attendees",
    title: "No Attendees Yet",
  },
  {
    attendees: ATTENDEE_DEMO_ITEMS,
    id: "populated_attendees",
    title: "Populated Attendee Records",
  },
  {
    attendees: ATTENDEE_DEMO_ITEMS,
    id: "filtered_attendees",
    initialQuery: "patel peanuts",
    title: "Filtered Search Results",
  },
  {
    attendees: ATTENDEE_DEMO_ITEMS,
    id: "no_match_attendees",
    initialQuery: "zebra",
    title: "No Matching Attendees",
  },
];

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

const AttendeeDebugExample: React.FC<{ example: AttendeeDemoExample }> = ({
  example,
}: {
  example: AttendeeDemoExample;
}) => {
  const [query, setQuery] = React.useState(example.initialQuery ?? "");

  return (
    <S.ExamplePanel>
      <S.ExampleTitle>{example.title}</S.ExampleTitle>
      <AttendeesRecordsPanel
        attendees={example.attendees}
        onQueryChange={setQuery}
        query={query}
      />
    </S.ExamplePanel>
  );
};

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

      <CollapsiblePanel
        defaultExpanded={false}
        description={
          "Shared BaseInput styling across text, datetime, icon, and disabled states."
        }
        heading={"Input Playground"}
      >
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
      </CollapsiblePanel>

      <CollapsiblePanel
        defaultExpanded={false}
        description={"Compact and regular attendee status states."}
        heading={"Status Pills"}
      >
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
      </CollapsiblePanel>

      <CollapsiblePanel
        defaultExpanded={false}
        description={"Interactive summary pill states and color treatments."}
        heading={"Summary Pills"}
      >
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
        </S.Row>
      </CollapsiblePanel>

      <CollapsiblePanel
        defaultExpanded={false}
        description={
          "Example attendee-management states using the same table panel as the live attendees route."
        }
        heading={"Attendee Page Examples"}
      >
        <S.ExampleGrid>
          {ATTENDEE_DEMO_EXAMPLES.map((example) => (
            <AttendeeDebugExample example={example} key={example.id} />
          ))}
        </S.ExampleGrid>
      </CollapsiblePanel>

      <CollapsiblePanel
        defaultExpanded={false}
        description={
          "Example states for the rollcalls page using the same card components as the live route."
        }
        heading={"Rollcall Page Examples"}
      >
        <S.ExampleGrid>
          {ROLL_CALL_DEMO_EXAMPLES.map((example) => (
            <S.ExamplePanel key={example.id}>
              <S.ExampleTitle>{example.title}</S.ExampleTitle>
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
            </S.ExamplePanel>
          ))}
        </S.ExampleGrid>
      </CollapsiblePanel>
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

  export const ExampleGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  export const ExamplePanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  export const ExampleTitle = styled.div`
    font-size: 15px;
    font-weight: 700;
    color: ${(p) => p.theme.colors.text};
  `;
}
