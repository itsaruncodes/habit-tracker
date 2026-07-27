import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Paste your values from Supabase dashboard -> Project Settings -> API

const SUPABASE_URL = 'https://rpzdllbpxbgnqessozof.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_wPU-IZkIZV5-h_O-5v68RA_3eeI79QQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
