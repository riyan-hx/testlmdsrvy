# Psychologist survey

A 9-minute, mobile-first survey for psychologists and counsellors in Kerala, built in the Evo v3 design system. Answers go to a Google Sheet.

- Page: `index.html` (static, deploy on Vercel with no build settings)
- Backend: `Code.gs`, a Google Apps Script web app bound to the responses sheet
- Sheet: [Lumid Psychologist Survey — Responses](https://docs.google.com/spreadsheets/d/1WyOloUyGoSxoD1MSwBwEp6wMxx75jDXpD_vg1-A46p4/edit)

## Connect the sheet (one time, ~5 minutes)

1. Open the responses sheet → **Extensions → Apps Script**.
2. Replace the editor contents with `Code.gs` and save.
3. **Deploy → New deployment** → type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise when Google asks (it needs access to this sheet only).
5. Copy the web app URL (ends in `/exec`).
6. In `index.html`, set (already done for the current deployment):
   ```js
   const SHEET_ENDPOINT='https://script.google.com/macros/s/…/exec';
   ```
7. Commit and deploy. Open `/survey`, take it once, and check a row appears.

Changing `Code.gs` later: **Deploy → Manage deployments → Edit → New version**, so the URL stays the same.

## What lands where

| Tab | One row per | Notes |
| --- | --- | --- |
| Responses | respondent | Saved after every screen, so partial answers show drop-off. `status` is `started`, `screened_out` or `completed`; `last_question` is where they stopped. |
| Contacts | respondent | Name (asked first), WhatsApp, email, pilot choice and call slot. Kept apart from answers; don't share this tab. |

Columns hold readable labels (e.g. "Chasing payments"), not codes. New fields added to the survey become new columns automatically.

## Tracking links

Add `?src=` to every link you send so you can see which channel works:

```
https://lumid-psychologist-survey.vercel.app/?src=wa_kozhikode_group
https://lumid-psychologist-survey.vercel.app/?src=instagram_dm
```

## Notes

- Answers are queued on the phone and retried if the network drops.
- `mode: 'no-cors'` means the page can't read the script's reply; check the sheet to confirm rows arrive.
- The Apps Script URL is public by design; it only appends/updates rows. Rotate it (new deployment) if it's abused.
- Helvetica Now Display loads from `/fonts/` if you add the licensed .ttf files there; without the files it falls back to Helvetica Neue / Inter Tight.
