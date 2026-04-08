const SUPABASE_URL = 'https://yptmcwxvxgvqpzvvtnxv.supabase.co'; // based sa key mo
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwdG1jd3h2eGd2cXB6dnZ0bnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTQxMjksImV4cCI6MjA5MTE5MDEyOX0.HPLKZzAO2_dS9UKFtxdWsvLfyf5syDx9kYZyYCapCtg';

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);