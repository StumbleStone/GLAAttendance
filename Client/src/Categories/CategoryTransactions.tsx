import styled from "@emotion/styled";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  CategoryEntry,
  ProfileEntry,
  SupaBase,
  SupaBaseEvent,
  TransactionEntry,
  Transactions,
} from "../SupaBase/SupaBase";
import { DefaultColors, epochToDate, formatCurrency } from "../Tools/Toolbox";

export interface CategoryTransactionsProps {
  supabase: SupaBase;
  item: CategoryEntry;
}

export enum ScreenSize {
  SMALL = 0,
  MEDIUM = 1,
  LARGE = 2,
}

function calculateScreenSize(): ScreenSize {
  const width = window.innerWidth;

  if (width < 600) {
    return ScreenSize.SMALL;
  }

  if (width < 900) {
    return ScreenSize.MEDIUM;
  }
  return ScreenSize.LARGE;
}

enum Headings {
  DATE,
  TYPE,
  AMOUNT,
  DESCRIPTION,
  TOTAL,
  CREATED,
  UPDATED,
  USER,
}

const HeadingMap: Record<Headings, Record<ScreenSize, string>> = {
  [Headings.DATE]: {
    [ScreenSize.SMALL]: "Date",
    [ScreenSize.MEDIUM]: "Date",
    [ScreenSize.LARGE]: "Date",
  },
  [Headings.TYPE]: {
    [ScreenSize.SMALL]: "Type",
    [ScreenSize.MEDIUM]: "Type",
    [ScreenSize.LARGE]: "Type",
  },
  [Headings.AMOUNT]: {
    [ScreenSize.SMALL]: "Amt",
    [ScreenSize.MEDIUM]: "Amount",
    [ScreenSize.LARGE]: "Amount",
  },
  [Headings.DESCRIPTION]: {
    [ScreenSize.SMALL]: "Desc",
    [ScreenSize.MEDIUM]: "Desc",
    [ScreenSize.LARGE]: "Description",
  },
  [Headings.TOTAL]: {
    [ScreenSize.SMALL]: "TT",
    [ScreenSize.MEDIUM]: "Tot",
    [ScreenSize.LARGE]: "Total",
  },
  [Headings.CREATED]: {
    [ScreenSize.SMALL]: "Crt",
    [ScreenSize.MEDIUM]: "Created",
    [ScreenSize.LARGE]: "Created On",
  },
  [Headings.UPDATED]: {
    [ScreenSize.SMALL]: "Udt",
    [ScreenSize.MEDIUM]: "Updated",
    [ScreenSize.LARGE]: "Updated On",
  },
  [Headings.USER]: {
    [ScreenSize.SMALL]: "Usr",
    [ScreenSize.MEDIUM]: "User",
    [ScreenSize.LARGE]: "Created By",
  },
};

function getHeading(heading: Headings, size: ScreenSize): string {
  return HeadingMap[heading][size];
}

export const CategoryTransactions: React.FC<CategoryTransactionsProps> = (
  props: CategoryTransactionsProps
) => {
  const { supabase, item } = props;

  const [transactions, setTransactions] = React.useState<Transactions | null>(
    supabase.getTransactionsFromCache(item.id)
  );

  const [screenSize, setScreenSize] = useState<ScreenSize>(
    calculateScreenSize()
  );

  useEffect(() => {
    return addEventListener("resize", () => {
      setScreenSize(calculateScreenSize());
    });
  }, []);

  React.useEffect(() => {
    supabase.getTransactions(item.id);

    return supabase.addListener({
      [SupaBaseEvent.TRANSACTIONS_LOADED]: ({ categoryId, transactions }) => {
        if (categoryId !== item.id) {
          return;
        }

        setTransactions((t) => transactions);
      },
    });
  }, [item.id]);

  if (!transactions || transactions.length <= 0) {
    return (
      <S.Container>
        <S.Empty>No Transactions for this category...</S.Empty>
      </S.Container>
    );
  }

  return (
    <S.Container>
      <S.Table>
        <thead>
          <S.HeadingRow>
            <S.Heading>{getHeading(Headings.DATE, screenSize)}</S.Heading>
            <S.Heading>{getHeading(Headings.TYPE, screenSize)}</S.Heading>
            <S.Heading>{getHeading(Headings.AMOUNT, screenSize)}</S.Heading>
            <S.Heading>
              {getHeading(Headings.DESCRIPTION, screenSize)}
            </S.Heading>
            <S.Heading>{getHeading(Headings.TOTAL, screenSize)}</S.Heading>
            <S.Heading>{getHeading(Headings.CREATED, screenSize)}</S.Heading>
            <S.Heading>{getHeading(Headings.UPDATED, screenSize)}</S.Heading>
            <S.Heading>{getHeading(Headings.USER, screenSize)}</S.Heading>
          </S.HeadingRow>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <Transaction
              transaction={t}
              key={t.id}
              screenSize={screenSize}
              supabase={supabase}
            />
          ))}
        </tbody>
      </S.Table>
    </S.Container>
  );
};

export interface TransactionProps {
  transaction: TransactionEntry;
  screenSize: ScreenSize;
  supabase: SupaBase;
}

export const Transaction: React.FC<TransactionProps> = (
  props: TransactionProps
) => {
  const { transaction, screenSize, supabase } = props;

  const [_, forceUpdate] = useState<number>(0);

  useEffect(() => {
    return supabase.addListener({
      [SupaBaseEvent.PROFILE_LOADED]: (p: ProfileEntry) => {
        if (p.id !== transaction.user_id) {
          return;
        }

        forceUpdate((prev) => prev + 1);
      },
    });
  }, []);

  return (
    <S.Row color={SupaBase.toTypeColor(transaction.type)}>
      <S.DateCell>
        {epochToDate(new Date(transaction.date).getTime(), {
          includeMS: false,
          includeSeconds: screenSize >= ScreenSize.LARGE,
          includeTime: screenSize >= ScreenSize.MEDIUM,
        })}
      </S.DateCell>
      <S.TypeCell>
        {screenSize <= ScreenSize.SMALL
          ? SupaBase.toTypeTextShort(transaction.type)
          : SupaBase.toTypeTextLong(transaction.type)}
      </S.TypeCell>
      <S.AmountCell>
        {formatCurrency(transaction.amount, {
          includeCents: screenSize >= ScreenSize.MEDIUM,
        })}
      </S.AmountCell>
      <S.DescriptionCell>{transaction.description}</S.DescriptionCell>
      <S.AmountCell>
        {formatCurrency(transaction.total, {
          includeCents: screenSize >= ScreenSize.MEDIUM,
        })}
      </S.AmountCell>
      <S.DateCell>
        {epochToDate(new Date(transaction.created_at).getTime(), {
          includeMS: false,
          includeSeconds: screenSize >= ScreenSize.LARGE,
          includeTime: screenSize >= ScreenSize.MEDIUM,
        })}
      </S.DateCell>
      <S.DateCell>
        {epochToDate(new Date(transaction.updated_at).getTime(), {
          includeMS: false,
          includeSeconds: screenSize >= ScreenSize.LARGE,
          includeTime: screenSize >= ScreenSize.MEDIUM,
        })}
      </S.DateCell>
      <S.DescriptionCell>
        {supabase.getUserName(transaction.user_id)}
      </S.DescriptionCell>
    </S.Row>
  );
};

namespace S {
  export const Container = styled("div")`
    /* border: solid 1px ${DefaultColors.OffWhite}; */
  `;

  export const Table = styled("table")`
    width: 100%;
    border-collapse: collapse;
  `;

  export const Row = styled("tr")<{ color?: string }>`
    color: ${(p) => p.color};

    :nth-of-type(odd) {
      background-color: ${DefaultColors.Black}55;
    }

    :nth-of-type(even) {
      background-color: ${DefaultColors.Background}22;
    }

    :last-of-type td {
      padding-bottom: 30px;
      /* border-right: 1px solid ${DefaultColors.Background}; */
    }
  `;

  export const HeadingRow = styled(Row)`
    background-color: ${DefaultColors.TRANSPARENT};

    :nth-of-type(odd) {
      background-color: ${DefaultColors.TRANSPARENT};
    }

    :nth-of-type(even) {
    }
  `;

  export const Cell = styled("td")`
    font-size: 10px;
    padding: 2px 4px;
    vertical-align: top;

    /* border-top: 1px solid ${DefaultColors.Background}; */
    /* border-bottom: 1px solid ${DefaultColors.Background}; */

    :first-of-type {
      padding-left: 10px;
      /* border-left: 1px solid ${DefaultColors.Background}; */
    }

    :last-of-type {
      padding-right: 10px;
      /* border-right: 1px solid ${DefaultColors.Background}; */
    }
  `;

  export const DateCell = styled(Cell)`
    width: 0%;
    white-space: nowrap;
  `;

  export const TypeCell = styled(Cell)`
    width: 0%;
    text-align: center;
  `;

  export const AmountCell = styled(Cell)`
    width: 0%;
    text-align: right;
    white-space: pre;
    color: ${DefaultColors.OffWhite};
  `;

  export const DescriptionCell = styled(Cell)``;

  export const Empty = styled("div")`
    text-align: center;
    padding: 5px 10px;
    font-size: 12px;
  `;

  export const Heading = styled("th")`
    color: ${DefaultColors.OffWhite};
    font-size: 12px;
    padding: 2px 4px;
    text-align: left;
    white-space: nowrap;

    /* border-top: 1px solid ${DefaultColors.TRANSPARENT}; */
    /* border-bottom: 1px solid ${DefaultColors.Background}; */

    :first-of-type {
      padding-left: 10px;
      /* border-left: 1px solid ${DefaultColors.TRANSPARENT}; */
    }

    /* :last-of-type {
      border-right: 1px solid ${DefaultColors.TRANSPARENT};
    } */
  `;
}
