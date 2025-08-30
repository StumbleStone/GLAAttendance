import styled from "@emotion/styled";
import * as React from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button, ButtonContainer } from "../Components/Button/Button";
import {
  DropdownInput,
  DropdownOption,
} from "../Components/Inputs/DropdownInput";
import { LabelNumberInput } from "../Components/Inputs/label/LabelNumberInput";
import { LabelTextInput } from "../Components/Inputs/label/LabelTextInput";
import { Label } from "../Components/Label";
import { LayerItem } from "../Components/Layer/Layer";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { CategoryEntry, SupaBase, TransactionType } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";

export interface AddTransactionProps {
  supabase: SupaBase;
  layerItem: LayerItem;
  category: CategoryEntry;
}

function getActionOptions(): DropdownOption[] {
  return [
    {
      key: TransactionType.WITHDRAW,
      label: SupaBase.toTypeTextLong(TransactionType.WITHDRAW),
    },
    {
      key: TransactionType.DEPOSIT,
      label: SupaBase.toTypeTextLong(TransactionType.DEPOSIT),
    },
    {
      key: TransactionType.OVERRIDE,
      label: SupaBase.toTypeTextLong(TransactionType.OVERRIDE),
    },
  ];
}

export const AddTransaction: React.FC<AddTransactionProps> = (
  props: AddTransactionProps
) => {
  const { supabase, layerItem, category } = props;

  const typeRef = React.useRef<HTMLSelectElement>(null);
  const amountRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLInputElement>(null);

  const createTransaction = React.useCallback(async () => {
    if (!typeRef.current || !amountRef.current || !descRef.current) {
      return;
    }

    const type: TransactionType = typeRef.current.value as TransactionType;
    const amount = parseFloat(amountRef.current.value);
    const desc = descRef.current.value;

    const result = await supabase.createTransaction({
      category,
      type,
      amount,
      desc,
    });

    if (result === true) {
      props.layerItem.close();
    }
  }, []);

  const [desc, setDesc] = React.useState(
    SupaBase.getTypeDescription(
      typeRef.current ? typeRef.current.value : TransactionType.WITHDRAW
    )
  );

  const onActionChange = React.useCallback(() => {
    if (!typeRef.current) {
      return;
    }

    setDesc(
      SupaBase.getTypeDescription(
        typeRef.current ? typeRef.current.value : null
      )
    );
  }, [typeRef]);

  return (
    <S.StyledBackdrop onClose={layerItem.close}>
      <S.AddTransactionEl>
        <SubHeading text="Add New Transaction" />
        <S.Content>
          <Label>Type</Label>
          <DropdownInput
            forwardRef={typeRef}
            options={getActionOptions()}
            onChange={onActionChange}
          />
          <S.ActionDescription>{desc}</S.ActionDescription>
          <LabelNumberInput label={"Amount (R)"} forwardRef={amountRef} />
          <LabelTextInput label={"Description"} forwardRef={descRef} />
        </S.Content>
        <ButtonContainer>
          <S.StlyedButton onClick={createTransaction}>Create</S.StlyedButton>
        </ButtonContainer>
      </S.AddTransactionEl>
    </S.StyledBackdrop>
  );
};

namespace S {
  export const AddTransactionEl = styled(Tile)`
    margin: 0;
    pointer-events: all;
    margin: 25px;
    width: 100%;
  `;

  export const ActionDescription = styled("span")`
    color: ${DefaultColors.OffWhite};
    font-size: 12px;
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
