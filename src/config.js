/*
 * Site configuration.
 *
 * AIRTABLE_BETA_FORM_URL is the *shared form* URL for the "Beta" base — the
 * one Airtable gives you under Share form. It is a public URL, not a
 * credential: it accepts submissions and exposes nothing else. That is the
 * whole reason this site uses a form URL rather than the Airtable API. An API
 * token in a static site would ship inside the JavaScript bundle, published to
 * a public repo and a public site, handing anyone read/write on the base.
 *
 * The form is *linked*, never embedded in an iframe. An embed would make the
 * page call airtable.com on load, disclosing every visitor's IP address to
 * Airtable whether or not they ever sign up — and would falsify the "no
 * external requests" claim in privacy.html. A link only reaches Airtable once
 * someone chooses to follow it.
 *
 * While this is empty, the sign-up page shows a "not yet connected" notice and
 * the button stays disabled, rather than presenting a link that goes nowhere.
 */
export const AIRTABLE_BETA_FORM_URL = '';
