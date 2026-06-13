/* eslint-disable linebreak-style */
// functions/secrets.ts
import {defineSecret} from "firebase-functions/params";


export const JWT_SECRET = defineSecret("JWT_SECRET");
export const WEB_API_KEY = defineSecret("WEB_API_KEY");
export const DB_Url = defineSecret("DB_URL");
export const DB_PROD = defineSecret("DB_PROD");
export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
