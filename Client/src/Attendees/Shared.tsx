export enum SortColumns {
  NAME = "name",
  SURNAME = "surname",
  STATUS = "status",
  BY = "by",
  ON = "on",
  TP = "tp",

  // Always included, cannot be sorted on since it's already sorted...
  INDEX = "index",
}

export enum SortColumnSize {
  NORMAL = 3,
  COMPACT = 2,
  COMPACTER = 1,
}

export type SortColumnsMap = Partial<{
  [key in SortColumns]: SortColumnSize
}>;