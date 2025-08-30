import styled from "@emotion/styled";
import * as React from "react";
import { useEffect } from "react";
import {
  CategoryEntry,
  SupaBase,
  TransactionType,
} from "../../SupaBase/SupaBase";
import { Backdrop } from "../Backdrop/Backdrop";
import { Button, ButtonContainer } from "../Button/Button";
import { LabelNumberInput } from "../Inputs/label/LabelNumberInput";
import { LabelTextInput } from "../Inputs/label/LabelTextInput";
import { LayerItem } from "../Layer/Layer";
import { SubHeading } from "../SubHeading";
import { Tile } from "../Tile";

export interface AddCategoryProps {
  supabase: SupaBase;
  layerItem: LayerItem;
}

export const AddCategory: React.FC<AddCategoryProps> = (
  props: AddCategoryProps
) => {
  const { supabase, layerItem } = props;

  const nameRef = React.useRef<HTMLInputElement>(null);
  const capRef = React.useRef<HTMLInputElement>(null);
  const incRef = React.useRef<HTMLInputElement>(null);
  const initRef = React.useRef<HTMLInputElement>(null);

  const createCategory = React.useCallback(async () => {
    if (
      !nameRef.current ||
      !capRef.current ||
      !incRef.current ||
      !initRef.current
    ) {
      return;
    }

    const name = nameRef.current.value;
    const cap = parseInt(capRef.current.value);
    const monthlyIncrease = parseFloat(incRef.current.value);
    const initialAmount = parseFloat(initRef.current.value);

    const category: CategoryEntry | null = await supabase.createCategory({
      name,
      cap,
      monthlyIncrease,
    });

    if (!category) {
      throw "Failed to create new category";
    }

    // Add initial amount to the category

    const res = await supabase.createTransaction({
      category: category,
      desc: "Initial Amount",
      amount: initialAmount,
      type: TransactionType.OVERRIDE,
    });

    if (!res) {
      throw `Failed to create initial transaction for new category [${category.name}]`;
    }

    props.layerItem.close();
  }, []);

  useEffect(() => {
    // Focus on the first field on mount
    if (nameRef.current) {
      nameRef.current.focus();
    }
  }, []);

  return (
    <S.StyledBackdrop onClose={layerItem.close}>
      <S.AddCategoryEl>
        <SubHeading text="Add New Category" />
        <S.Content>
          <LabelTextInput label={"Name"} forwardRef={nameRef} />
          <LabelNumberInput label={"Cap (R)"} forwardRef={capRef} />
          <LabelNumberInput
            label={"Monthly Increase (R)"}
            forwardRef={incRef}
          />
          <LabelNumberInput label={"Initial Amount (R)"} forwardRef={initRef} />
        </S.Content>
        <ButtonContainer>
          <S.StlyedButton onClick={createCategory}>Create</S.StlyedButton>
        </ButtonContainer>
      </S.AddCategoryEl>
    </S.StyledBackdrop>
  );
};

namespace S {
  export const AddCategoryEl = styled(Tile)`
    color: whitesmoke;
    margin: 0;
    pointer-events: all;
  `;

  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const Content = styled("div")`
    display: flex;
    flex-direction: column;
    gap: 5px;
  `;

  export const StlyedButton = styled(Button)`
    margin-top: 10px;
  `;
}
