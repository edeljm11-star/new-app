// Anyone can now sign up as a regular user, so admin routes must check the
// logged-in account's email against this allowlist rather than just
// checking whether a session exists.
export const ADMIN_EMAILS = ['edeljm11@gmail.com']
