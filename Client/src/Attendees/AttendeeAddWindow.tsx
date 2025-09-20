import styled from "@emotion/styled";
import React, { ChangeEvent, useCallback, useMemo, useState } from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button } from "../Components/Button/Button";
import { LayerItem } from "../Components/Layer";
import { Table } from "../Components/Table/Table";
import { TableCell } from "../Components/Table/TableCell";
import { TableHeading } from "../Components/Table/TableHeading";
import { TableRow } from "../Components/Table/TableRow";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";

export interface AttendeeAddWindowProps {
  layerItem: LayerItem;
  supabase: SupaBase;
}

const placeholder = `Smith, John 
Doe, Jane 
Baggins, Bilbo 
Sanders, Colonel
...
`;

export const AttendeeAddWindow: React.FC<AttendeeAddWindowProps> = (
  props: AttendeeAddWindowProps
) => {
  const { layerItem, supabase } = props;

  const [text, setText] = useState<string>("");

  const [preview, setPreview] = useState<boolean>(false);
  const [flip, setFlip] = useState<boolean>(false);

  const bdClick = useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  const handleChange = useCallback((ev: ChangeEvent<HTMLTextAreaElement>) => {
    setText(ev.target.value);
  }, []);

  const handlePreviewClick = useCallback(() => {
    setPreview((prev) => !prev);
  }, []);

  const handleFLipClick = useCallback(() => {
    setFlip((prev) => !prev);
  }, []);

  const records = useMemo<{ name: string; surname: string }[]>(() => {
    if (!preview || text == "") {
      return [];
    }

    let outArr: { name: string; surname: string }[] = [];
    const dataRows = text.trim().split("\n");
    dataRows.forEach((row) => {
      const [a1, a2] = row.trim().split(",");

      const [b1, b2] = [(a1 || "").trim(), (a2 || "").trim()];

      outArr.push({
        surname: flip ? b2 : b1,
        name: flip ? b1 : b2,
      });
    });

    return outArr;
  }, [preview, flip]);

  const handleSaveClick = useCallback(() => {
    supabase.createNewAttendees(records);
    layerItem.close();
  }, [records, supabase, layerItem]);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.AttendeeAddWindowEl>
        <S.Heading>Add New Attendees</S.Heading>
        {!preview && (
          <S.StyledTextArea
            placeholder={placeholder}
            value={text}
            onChange={handleChange}
          />
        )}
        {preview && <PreviewTable newRecords={records} />}
        <S.ButtonContainer>
          <Button
            onClick={handlePreviewClick}
            label={preview ? "Edit" : "Preview"}
          />
          {preview && <Button onClick={handleSaveClick} label={"Save"} />}
          {preview && <Button onClick={handleFLipClick} label={"Flip"} />}
        </S.ButtonContainer>
      </S.AttendeeAddWindowEl>
    </S.StyledBackdrop>
  );
};

export interface PreviewTableProps {
  newRecords: { name: string; surname: string }[];
}

export const PreviewTable: React.FC<PreviewTableProps> = (
  props: PreviewTableProps
) => {
  const { newRecords } = props;
  return (
    <S.TableContainer>
      <S.StyledTable>
        <tbody>
          <S.StyledTableRow>
            <S.StyledTableHeading>Name</S.StyledTableHeading>
            <S.StyledTableHeading>Surname</S.StyledTableHeading>
          </S.StyledTableRow>
          {newRecords.map((rec, idx) => (
            <S.StyledTableRow key={idx}>
              <S.StyledTableCell>{rec.name}</S.StyledTableCell>
              <S.StyledTableCell>{rec.surname}</S.StyledTableCell>
            </S.StyledTableRow>
          ))}
        </tbody>
      </S.StyledTable>
    </S.TableContainer>
  );
};

namespace S {
  export const AttendeeAddWindowEl = styled(Tile)`
    max-width: min(500px, 80vw);
    max-height: min(500px, 80vh);
    min-width: min(500px, 80vw);
    min-height: min(500px, 80vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    justify-content: center;
    align-items: center;

    gap: 10px;
  `;

  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const Heading = styled.div`
    font-size: 24px;
    padding-top: 10px;
  `;

  export const ButtonContainer = styled.div`
    display: flex;
    padding-bottom: 10px;
    gap: 5px;
  `;

  export const StyledTextArea = styled.textarea`
    width: 80%;
    resize: none;
    flex: 1;
    background-color: grey;
    inset: unset;
    outline: none;
    padding: 10px;

    font-size: 18px;
    background-color: ${DefaultColors.OffWhite};

    color: ${DefaultColors.Container};

    border: 2px solid ${DefaultColors.Black};
    border-radius: 20px;

    :-webkit-autofill::first-line,
    :-webkit-autofill,
    :-webkit-autofill:hover,
    :-webkit-autofill:focus {
      font-size: 18px;
      background-color: ${DefaultColors.OffWhite} !important;
      -webkit-text-fill-color: ${DefaultColors.Container};
      -webkit-box-shadow: 0 0 0px 1000px ${DefaultColors.OffWhite} inset;
    }

    :focus {
      outline: 2px solid ${DefaultColors.BrightYellow};
    }
  `;

  export const StyledTable = styled(Table)`
    width: 100%;
  `;

  export const StyledTableHeading = styled(TableHeading)`
    border-top: none;
    border-left: none;
    border-right: none;
  `;

  export const StyledTableRow = styled(TableRow)`
    border-top: none;
    border-left: none;
    border-right: none;
  `;

  export const StyledTableCell = styled(TableCell)`
    :nth-of-type(1) {
      border-right: 1px solid ${DefaultColors.Black};
    }
  `;

  export const TableContainer = styled.div`
    width: 80%;
    flex: 1;
    overflow: auto;
    border: 1px solid ${DefaultColors.Black};
  `;
}
