# The Quiet Instruments: backend setup

The puzzle page (`public/puzzles/the-quiet-instruments/`) is static. Sign-in codes, seal limits
(5 / 4 / 3 / 2 for instruments I–IV) and the leaderboard run on a free Supabase project.
Until `config.js` is filled in, the page shows "The room opens soon", so the PR can be merged at any point.

About 20 minutes, once.

## 1. Create the project

1. Sign up at [supabase.com](https://supabase.com) and create a new project (Free plan is fine).
   Pick any name and region, and save the database password somewhere safe.

## 2. Install the database

1. In the dashboard, open **SQL Editor → New query**.
2. Paste the whole of [`quiet-instruments.sql`](quiet-instruments.sql) and click **Run**.

This creates a private `qi_private` schema (answers, progress, every seal attempt) that the browser
cannot read, plus four functions the page calls. Running it again later is safe.

## 3. Let it send email

Supabase's built-in mailer only delivers to members of your Supabase team, so public players need
your own sender. Under **Authentication → Emails → SMTP Settings**, turn on custom SMTP and use one of:

- **Gmail** (easiest without your own domain). Turn on 2-step verification for the Google account,
  create an [app password](https://myaccount.google.com/apppasswords), then enter:
  host `smtp.gmail.com`, port `465`, username = the Gmail address, password = the app password,
  sender email = the same Gmail address, sender name `The Quiet Instruments`.
  Gmail allows roughly 500 messages a day.
- **Brevo, Resend, Postmark or SendGrid**, if you'd rather use a mail service.
  (Resend needs a domain you own; Brevo can verify a single sender address.)

## 4. Put the code in the emails

The page asks for a typed code, so both emails must show `{{ .Token }}`.
Under **Authentication → Emails → Templates**, edit **Confirm signup** (sent to first-time players)
and **Magic Link** (sent to returning players). For each, set:

- Subject: `Your code for The Quiet Instruments`
- Body:

```html
<p>Your code for The Quiet Instruments:</p>
<p style="font-size:26px;letter-spacing:4px;font-family:Georgia,serif"><b>{{ .Token }}</b></p>
<p>Enter it on the puzzle page. It expires in an hour. If you didn't ask for it, ignore this email.</p>
```

## 5. Check the limits

- **Authentication → Rate Limits**: "emails sent per hour" defaults low. Raise it to what your sender
  allows (e.g. 100).
- **Authentication → Sign In / Providers → Email**: keep Email enabled. The code length is 6 by default;
  the page accepts 6–10 digits.

## 6. Connect the page

1. **Project Settings → API Keys**: copy the **Project URL** and the **publishable** key
   (labelled "anon public" on older projects). Never use the secret / `service_role` key.
2. Paste them into `public/puzzles/the-quiet-instruments/config.js`:

   ```js
   window.QI_CONFIG = {
     url: "https://YOUR-PROJECT.supabase.co",
     key: "sb_publishable_..."
   };
   ```

3. Commit and push to `main`. GitHub Pages redeploys in a minute or two.

Try it once with your own email. To clear your test run afterwards, see "Reset a player" below.

## Looking at the results

In **SQL Editor**:

```sql
-- who has played, how far they got, and when they solved it
select u.email, p.started_at, p.sealed, p.used, p.solved_at, p.display_name
from qi_private.progress p join auth.users u on u.id = p.user_id
order by p.solved_at nulls last, p.started_at;

-- every seal attempt
select u.email, g.instrument, g.guess, g.correct, g.at
from qi_private.guesses g join auth.users u on u.id = g.user_id
order by g.at desc;
```

## Common changes

```sql
-- reset a player (e.g. your own test run)
delete from qi_private.progress where user_id = (select id from auth.users where email = 'you@example.com');
delete from qi_private.guesses  where user_id = (select id from auth.users where email = 'you@example.com');

-- change a seal limit (the page reads limits from the server)
update qi_private.answers set max_seals = 3 where instrument = 'IV';

-- remove a name from the leaderboard
update qi_private.progress set display_name = null where display_name = 'Offending Name';
```

If you edit the limits, also update the sentence "five for the first, four for the second…" near the top of the puzzle page.

## What this does and doesn't prevent

- Seals are checked on the server, the answers never reach the browser, and limits can't be reset by
  clearing the browser or switching devices.
- One set of seals per email address. Someone with several email addresses can still enter several times.
  Requiring a particular domain (e.g. `.edu`) would narrow this; ask if you want that.
- Questions asked of the instruments are free and unlimited by design; their small-range answers are
  part of the page.
