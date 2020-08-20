# PageSpeedInsights
Description: Run Googles Page Speed Insights API

---

## Set Up
1. Clone Repo [using repo url](https://github.com/broffis/PageSpeedInsights.git)
2. Install package dependencies
```
  npm install
```
3. Run the command `cp .env.example .env` to create a local `.env` file
4. Visit the (Google Developers Credentials Page) [https://console.developers.google.com/apis/credentials] and create an API key. Paste this key into your `.env` file as the `PAGE_SPEED_INSIGHTS_API_KEY=`

5. Run the scripts in the `package.json` file

---

## Scripts
- `all` : runs the `all-pages` test using the preset `pages`
- `select` : runs the `psi-checks` test allowing the user to select which page they'd like to test from the preset `pages`
- `choose` : runs the `choose-page` test that will prompt the user for a URL, LABEL, and repeat number

---

## Updating for your site(s)
If you'd like to be able to run these tests on your own pages, `all-pages.js` and `psi-checks.js` both have objects (`pages`) in them that you can update with a label and url
1. Navigate to the `.js` file you'd like to update
2. Update the `pages` object, the KEY will be used as the label and the VALUE will be the tested url
3. Run the correlating script for that page

---

## Google Page Speed Insights API
### [View the docs](https://developers.google.com/speed/docs/insights/v5/get-started)

Googles Page Speed Insights API makes use of lighthouse scores, as well as their own Chrome User Experience report. This package is based on the initial setup documented in the `javascript` implementation. The API returns a large amount of data that you can also add in as needed. 