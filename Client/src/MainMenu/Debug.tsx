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
import { SupaBase } from "../SupaBase/SupaBase";

export interface DebugProps {
  supabase: SupaBase;
}

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
}
