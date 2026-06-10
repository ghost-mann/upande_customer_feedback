"""Server-side boot context for the feedback portal at /customer-feedback.

Requires login. Boot exposes the CSRF token + user info; all data is loaded by
the React app via upande_customer_feedback.api.feedback.* methods.
"""

import frappe

no_cache = 1


def get_context(context):
	# The portal is self-contained: guests get the SPA's own branded login
	# screen (never the ERP /login). Once signed in, the page re-boots with the
	# user's identity + CSRF token and the SPA loads the portal.
	# NOTE: use `portal_boot` (not `boot`) — Frappe's website renderer injects its
	# own `boot` into the page context and overwrites anything we set under that
	# key, which would drop is_guest/csrf_token/frappe_user and leave the SPA stuck
	# on its login screen.
	user = frappe.session.user
	if user == "Guest":
		context.portal_boot = {"is_guest": True}
		return context

	context.portal_boot = {
		"is_guest": False,
		"csrf_token": frappe.sessions.get_csrf_token(),
		"frappe_user": user,
		"frappe_user_full": frappe.db.get_value("User", user, "full_name") or user,
	}
	return context
