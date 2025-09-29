import { config } from "dotenv";
import { subDays } from "date-fns";
import { drizzle } from "drizzle-orm/neon-http";
import {neon} from "@neondatabase/serverless";
import {categories, accounts, transactions} from "@/db/schema";

config({path: ".env.local"})

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const SEED_USER_ID = "user_332hrrp9y3R9Rr4M16eL00GAM9s"
const SEED_CATEGORIES = [
    {id: "category_1", name: "Food", userId: SEED_USER_ID, plaidId: null},
    {id: "category_2", name: "Rent", userId: SEED_USER_ID, plaidId: null},
    {id: "category_3", name: "Utilities", userId: SEED_USER_ID, plaidId: null},
    {id: "category_4", name: "Clothing", userId: SEED_USER_ID, plaidId: null},
]

const SEED_ACCOUNTS = [
    {id: "account_1", name: "Checking", userId: SEED_USER_ID, plaidId: null},
    {id: "account_2", name: "Savings", userId: SEED_USER_ID, plaidId: null},
]