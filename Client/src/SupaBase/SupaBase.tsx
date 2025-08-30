import {
  AuthChangeEvent,
  createClient,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { EventableClass } from "../Tools/EventableClass";
import { DefaultColors } from "../Tools/Toolbox";
import { Database } from "./supabase-types";

export enum SupaBaseEvent {
  USER_LOGIN = "user_login",
  INIT_DONE = "init_done",
  CATEGORIES_LOADED = "categories_loaded",
  CATEGORY_LOADED = "category_loaded",
  TRANSACTIONS_LOADED = "transactions_loaded",
  LATEST_TRANSACTIONS_LOADED = "latest_transactions_loaded",
  PROFILE_LOADED = "profile_loaded",
}

export enum Tables {
  CATEGORIES = "categories",
  TRANSACTION = "transactions",
  PROFILES = "profiles",
}

export type CategoryEntry =
  Database["public"]["Tables"][Tables.CATEGORIES]["Row"];
export type Categories = CategoryEntry[];

export type InsertCategory =
  Database["public"]["Tables"][Tables.CATEGORIES]["Insert"];

export type TransactionEntry = Omit<
  Database["public"]["Tables"][Tables.TRANSACTION]["Row"],
  "type"
> & { type: TransactionType };
export type Transactions = TransactionEntry[];
export type InsertTransaction =
  Database["public"]["Tables"][Tables.TRANSACTION]["Insert"];

export enum TransactionType {
  WITHDRAW = "withdraw",
  MONTHLY_DEPOSIT = "monthly_deposit",
  DEPOSIT = "deposit",
  OVERRIDE = "override",
}

export type ProfileEntry = Database["public"]["Tables"][Tables.PROFILES]["Row"];
export type Profiles = ProfileEntry[];

const ORDERED_COLORS: string[] = [
  DefaultColors.BrightPurple,
  DefaultColors.BrightCyan,
  DefaultColors.BrightGrey,
  DefaultColors.BrightGreen,
  DefaultColors.BrightYellow,
  DefaultColors.BrightBlue,
  DefaultColors.BrightOrange,
];

export class SupaBase extends EventableClass {
  client: SupabaseClient;
  _isLoggedIn: boolean;

  user_id: string | null;

  categories: Categories;
  transactions: { [key: number]: Transactions };
  profiles: { [key: string]: ProfileEntry };
  latestTransactions: { [key: number]: TransactionEntry };

  constructor() {
    super();
    const restEndpoint: string = "https://mxhjotwfrlpbqlizuzlo.supabase.co";

    // According to Supabase having this here is okay since RLS is enabled
    const key =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aGpvdHdmcmxwYnFsaXp1emxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NDMwNjgsImV4cCI6MjA1ODMxOTA2OH0.HZUWNR_7vyONCoFnG8GZnsz4W2RI72uP9kXlFY7HlX0";
    this.client = createClient<Database>(restEndpoint, key, {
      auth: {
        debug: false,
      },
    });

    this._isLoggedIn = false;
    this.transactions = {};
    this.latestTransactions = {};
    this.profiles = {};
  }

  async init() {
    let resolveInit: () => void;
    const waitForInitialSession = new Promise<void>((resolve) => {
      resolveInit = resolve;
    });

    this.client.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            // Don't await
            this.onLoggedIn(session.user);
          }
          resolveInit();
          return;
        }

        if (event === "SIGNED_OUT") {
          // Don't await
          this.onLoggedOut();

          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            // Don't await
            this.onLoggedIn(session.user);
          }
          return;
        }

        debugger;
        if (event == "PASSWORD_RECOVERY") {
        }
      }
    );

    await waitForInitialSession;
    this.fireUpdate(SupaBaseEvent.INIT_DONE, true);
  }

  async userSendOTP(email: string): Promise<boolean> {
    const { error } = await this.client.auth.signInWithOtp({
      email: email,
      options: {
        // set this to false if you do not want the user to be automatically signed up
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  async userSignInOtp(email: string, otp: string) {
    const { error } = await this.client.auth.verifyOtp({
      email: email,
      token: otp,
      type: "email",
    });

    if (error) {
      console.error("OTP Error:", error);
      return false;
    }

    return true;
  }

  async userSignIn(email: string, password: string) {
    const result = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (result.error) {
      throw result.error;
    }
  }

  async onLoggedIn(user: User) {
    this.user_id = user.id;
    if (this._isLoggedIn) {
      return;
    }

    this._isLoggedIn = true;
    this.fireUpdate(SupaBaseEvent.USER_LOGIN, true);
    // await this.checkMonthlyContributions();
  }

  async onLoggedOut() {
    if (!this._isLoggedIn) {
      return;
    }

    this._isLoggedIn = false;
    this.fireUpdate(SupaBaseEvent.USER_LOGIN, false);
  }

  // async checkMonthlyContributions() {
  //   const categories = await this.getCategories();
  //   for (let cat of categories) {
  //     await this.checkMonthlyContributionForCategory(cat);
  //   }
  // }

  async loadLatestActionForCategory(
    category_id: number,
    type: TransactionType
  ): Promise<TransactionEntry | null> {
    const { data, error } = await this.client
      .from(Tables.TRANSACTION)
      .select()
      .order("date", {
        ascending: false,
      })
      .eq("category_id", category_id)
      .eq("type", type)
      .limit(1)
      .maybeSingle();

    if (error) {
      debugger;
    }

    return data;
  }

  async loadLatestMonthlyDepositForCategory(
    category_id: number
  ): Promise<TransactionEntry | null> {
    return this.loadLatestActionForCategory(
      category_id,
      TransactionType.MONTHLY_DEPOSIT
    );
  }

  async loadLatestOverrideForCategory(
    category_id: number
  ): Promise<TransactionEntry | null> {
    return this.loadLatestActionForCategory(
      category_id,
      TransactionType.OVERRIDE
    );
  }

  async checkMonthlyContributionForCategory(category: CategoryEntry) {
    // get the latest monthly contribution

    const latestDep = await this.loadLatestMonthlyDepositForCategory(
      category.id
    );

    const latestOverride = await this.loadLatestOverrideForCategory(
      category.id
    );

    if (!latestOverride) {
      throw `Category [${category.name}] is missing initial override transaction`;
    }

    const overrideDate = new Date(latestOverride.date);
    let latestDepDate = overrideDate;

    if (latestDep != null) {
      latestDepDate = new Date(latestDep.date);
    }

    let closestDate =
      latestDepDate.getTime() > overrideDate.getTime()
        ? latestDepDate
        : overrideDate;

    let currentDate = new Date();

    const differenceInMonths = currentDate.getMonth() - closestDate.getMonth();

    for (let i = 1; i <= differenceInMonths; i++) {
      const depositDate = new Date("2025-01-01 00:00:00");
      depositDate.setFullYear(closestDate.getFullYear());
      depositDate.setMonth(closestDate.getMonth() + i);

      const monthStr = depositDate.toLocaleString("default", { month: "long" });

      const success = await this.createTransaction({
        type: TransactionType.MONTHLY_DEPOSIT,
        amount: category.monthly_inc,
        category: category,
        desc: `Auto Deposit: ${monthStr}`,
      });

      if (!success) {
        throw "Something went wrong";
      }

      debugger;
    }

    debugger;
  }

  async loadCategories(): Promise<Categories> {
    const { data, error } = await this.client.from(Tables.CATEGORIES).select();

    if (error) {
      throw error;
    }

    this.categories = data;

    this.fireUpdate(SupaBaseEvent.CATEGORIES_LOADED, this.categories);

    this.categories.map(async (c) => {
      this.fireUpdate(SupaBaseEvent.CATEGORY_LOADED, c);
      const data = await this.loadLatestTransaction(c.id, null);
      this.fireUpdate(SupaBaseEvent.LATEST_TRANSACTIONS_LOADED, data);
    });

    return data;
  }

  async loadLatestTransaction(
    categoryId: number,
    date: Date | null
  ): Promise<TransactionEntry | null> {
    let responseChain: any = this.client.from(Tables.TRANSACTION).select();

    if (date != null) {
      responseChain = responseChain.lte("date", date.toISOString());
    }

    responseChain = responseChain
      .order("date", {
        ascending: false,
      })
      .eq("category_id", categoryId)
      .limit(1)
      .maybeSingle();

    const { data, error } = await responseChain;

    if (error) {
      throw error;
    }

    if (!!data) {
      this.latestTransactions[categoryId] = data;
    }

    return data;
  }

  async loadTransactions(categoryId: number): Promise<Transactions> {
    const { data, error } = await this.client
      .from(Tables.TRANSACTION)
      .select()
      .order("date", {
        ascending: false,
      })
      .eq("category_id", categoryId);

    if (error) {
      throw error;
    }

    this.transactions[categoryId] = data;

    this.fireUpdate(SupaBaseEvent.TRANSACTIONS_LOADED, {
      categoryId,
      transactions: data,
    });

    return data;
  }

  async getCategories(refresh: boolean = false): Promise<Categories> {
    if (this.categories && !refresh) {
      return this.categories;
    }

    return await this.loadCategories();
  }

  getCategoryFromCache(id: number): CategoryEntry | null {
    return this.categories?.find((c) => c.id === id) ?? null;
  }

  async getCategory(id: number, refresh: boolean = false) {
    const category = this.getCategoryFromCache(id);
    if (!!category && !refresh) {
      return category;
    }

    await this.loadCategories();

    return this.getCategoryFromCache(id);
  }

  getCategoryColor(category: CategoryEntry, idx?: number) {
    const index = idx ?? this.categories?.indexOf(category) ?? -1;

    return ORDERED_COLORS[index];
  }

  getTransactionsFromCache(categoryId: number): Transactions | null {
    if (this.transactions[categoryId]) {
      return this.transactions[categoryId];
    }

    return null;
  }

  getLatestTransactionFromCache(categoryId: number): TransactionEntry | null {
    if (this.latestTransactions[categoryId]) {
      return this.latestTransactions[categoryId];
    }

    return null;
  }

  async getTransactions(
    categoryId: number,
    refresh: boolean = false
  ): Promise<Transactions> {
    const cache = this.getTransactionsFromCache(categoryId);
    if (cache && !refresh) {
      return cache;
    }

    return await this.loadTransactions(categoryId);
  }

  // Update the totals of all records after the given start date, using the first entry as the starting total.
  async updateTransactionTotals(categoryId: number, startDate: Date | null) {
    const { data, error } = await this.client
      .from(Tables.TRANSACTION)
      .select()
      .gte(
        "date",
        (startDate == null ? new Date("0") : startDate).toISOString()
      )
      .order("date", {
        ascending: true,
      })
      .eq("category_id", categoryId);

    if (error) {
      console.error("updateTransactionTotals Error:", error);
      return;
    }

    if (!data || data.length === 0) {
      return;
    }

    const changedTransactions: Transactions = [];

    let total: number | null = null;
    for (const transaction of data as Transactions) {
      if (total == null) {
        // Initialize total with the first transaction's total
        total = transaction.total;
        continue;
      }

      if (transaction.type === TransactionType.OVERRIDE) {
        // Override means transactions before it have no effect on transactions after it.
        total = transaction.total;
        continue;
      }

      if (transaction.type === TransactionType.WITHDRAW) {
        total -= transaction.amount;
        if (total === transaction.total) {
          continue;
        }
        transaction.total = total;
        changedTransactions.push(transaction);
        continue;
      }

      if (
        [TransactionType.DEPOSIT, TransactionType.MONTHLY_DEPOSIT].includes(
          transaction.type
        )
      ) {
        total += transaction.amount;
        if (total === transaction.total) {
          continue;
        }
        transaction.total = total;
        changedTransactions.push(transaction);
        continue;
      }

      console.error(
        "updateTransactionTotals: Unhandled transaction type:",
        transaction.type
      );
    }

    if (changedTransactions.length <= 0) {
      return;
    }

    const changeDate = new Date().toISOString();

    const { data: uData, error: uError } = await this.client
      .from(Tables.TRANSACTION)
      .upsert(
        changedTransactions.map(
          (t) =>
            ({
              id: t.id,
              updated_at: changeDate,
              total: t.total,
            } as Partial<TransactionEntry>)
        )
      )
      .select();

    if (uError) {
      console.error("updateTransactionTotals Update Error:", uError);
      return;
    }

    console.log("updateTransactionTotals Updated Transactions:", uData);
  }

  async getLatestTransaction(
    categoryId: number,
    refresh: boolean = false
  ): Promise<TransactionEntry | null> {
    const cache = this.getLatestTransactionFromCache(categoryId);
    if (cache && !refresh) {
      return cache;
    }

    return await this.loadLatestTransaction(categoryId, null);
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  async createCategory(data: {
    name: string;
    cap: number;
    monthlyIncrease: number;
  }): Promise<CategoryEntry | null> {
    const { cap, monthlyIncrease, name } = data;

    const insert: InsertCategory = {
      name,
      cap,
      monthly_inc: monthlyIncrease,
    };

    const result = await this.client.from(Tables.CATEGORIES).insert(insert);

    if (result.error) {
      console.error("createCategory Error:", result.error);
      return null;
    }

    if (result.status === 201) {
      const cats = await this.getCategories(true);
      return cats.find((c) => c.name === name) || null;
    }

    console.error(result);
    throw `createCategory Unhandled response`;
  }

  async loadProfiles(): Promise<Profiles> {
    const { data, error } = await this.client.from(Tables.PROFILES).select();

    if (error) {
      throw error;
    }

    data?.forEach((entry: ProfileEntry) => {
      this.profiles[entry.id] = entry;
      this.fireUpdate(SupaBaseEvent.PROFILE_LOADED, entry);
    });

    return data;
  }

  getUserName(user_id: string): string {
    const profile = this.profiles[user_id];
    if (!profile) {
      this.loadProfiles();
      return "--";
    }

    return profile.name;
  }

  async createTransaction(data: {
    type: TransactionType;
    amount: number;
    desc: string;
    category: CategoryEntry;
    effectiveDate?: Date;
  }): Promise<boolean> {
    if (!this.user_id) {
      console.error("User not signed in");
      return false;
    }

    const { amount, type, desc, category, effectiveDate = new Date() } = data;

    let verifiedAmount: number = amount;
    if (verifiedAmount < 0 && type !== TransactionType.WITHDRAW) {
      verifiedAmount = -verifiedAmount;
    }

    if (type == TransactionType.WITHDRAW) {
      if (verifiedAmount > 0) {
        verifiedAmount = -verifiedAmount;
      }
    }

    if (Object.values(TransactionType).includes(type) == null) {
      throw "Invalid Transaction Type! " + type;
    }

    debugger;

    let total: number;
    if (type === TransactionType.OVERRIDE) {
      total = verifiedAmount;
    } else {
      const lastTransaction = await this.loadLatestTransaction(
        category.id,
        effectiveDate
      );
      total = (lastTransaction?.total ?? 0) + verifiedAmount;
    }

    const insert: InsertTransaction = {
      type,
      amount: verifiedAmount,
      category_id: category.id,
      description: desc,
      date: effectiveDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: this.user_id,
      total,
    };

    const result = await this.client.from(Tables.TRANSACTION).insert(insert);

    if (result.error) {
      console.error("createTransaction Error:", result.error);
      return false;
    }

    if (result.status !== 201) {
      console.error(result);
      throw `createTransaction Unhandled response`;
    }

    await this.updateTransactionTotals(category.id, effectiveDate);

    await this.getLatestTransaction(category.id, true);
    await this.getTransactions(category.id, true);

    return true;
  }

  static toTypeColor(type: string): string {
    switch (type) {
      case TransactionType.WITHDRAW:
        return DefaultColors.BrightRed;
      case TransactionType.MONTHLY_DEPOSIT:
        return DefaultColors.BrightCyan;
      case TransactionType.DEPOSIT:
        return DefaultColors.BrightGreen;
      case TransactionType.OVERRIDE:
        return DefaultColors.BrightOrange;
    }

    throw "Unhandled Type " + type;
  }

  static toTypeTextShort(type: string): string {
    switch (type) {
      case TransactionType.WITHDRAW:
        return "WDR";
      case TransactionType.MONTHLY_DEPOSIT:
        return "MTH";
      case TransactionType.DEPOSIT:
        return "DEP";
      case TransactionType.OVERRIDE:
        return "OVR";
    }

    throw "Unhandled Type " + type;
  }

  static toTypeTextLong(type: string): string {
    switch (type) {
      case TransactionType.WITHDRAW:
        return "Withdraw";
      case TransactionType.MONTHLY_DEPOSIT:
        return "Monthly";
      case TransactionType.DEPOSIT:
        return "Deposit";
      case TransactionType.OVERRIDE:
        return "Override";
    }

    throw "Unhandled Type " + type;
  }

  static getTypeDescription(type?: string | null): string | null {
    if (type == null) {
      return null;
    }

    switch (type) {
      case TransactionType.WITHDRAW:
        return "Take money from the account";
      case TransactionType.MONTHLY_DEPOSIT:
        return "Increased each month based on the defined amount";
      case TransactionType.DEPOSIT:
        return "Add money to the account";
      case TransactionType.OVERRIDE:
        return "Set the current amount, ignoring previous transactions";
    }

    throw "Unhandled Type " + type;
  }
}
