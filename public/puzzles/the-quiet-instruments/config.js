// Connection settings for The Quiet Instruments.
// Fill both in from the Supabase dashboard: Project Settings -> API
//   url: the "Project URL"
//   key: the "publishable" (or "anon public") key -- never the secret / service_role key
// Both are safe to publish: the database only allows what supabase/quiet-instruments.sql permits.
// While either is empty, the puzzle page shows "the room opens soon".
window.QI_CONFIG = {
  url: "",
  key: ""
};
