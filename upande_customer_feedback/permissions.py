"""SQL-level customer isolation for the feedback portal.

These hooks are belt-and-suspenders on top of the whitelisted API scoping in
`api/feedback.py`. They only ever *restrict* portal customers (users holding the
`Customer Feedback User` role); desk/staff users are left untouched so existing
Sales Invoice / Customer Feedback access in the desk is unaffected.

Isolation key: the `customer` Link field (a Custom Field this app adds to
Customer Feedback). For rows created before that field existed, we also match on
the legacy `customer_company` Data field, which the portal sets to the
customer's display name.
"""

import frappe

PORTAL_ROLE = "Customer Feedback User"


def _user_customer(user=None):
	"""The single Customer linked to the user's Contact via Dynamic Link, else None."""
	user = user or frappe.session.user
	if not user or user == "Guest":
		return None
	contact = frappe.db.get_value("Contact", {"user": user}, "name")
	if not contact:
		return None
	return frappe.db.get_value(
		"Dynamic Link",
		{"parenttype": "Contact", "parent": contact, "link_doctype": "Customer"},
		"link_name",
	)


def _is_portal_customer(user=None):
	"""True only for portal customers we should scope — never for staff/admin.

	A user is scoped when they hold the portal role and are NOT a System Manager
	(System Managers and Administrator always see everything)."""
	user = user or frappe.session.user
	if not user or user == "Guest" or user == "Administrator":
		return False
	roles = set(frappe.get_roles(user))
	if "System Manager" in roles:
		return False
	return PORTAL_ROLE in roles


def feedback_query_conditions(user=None):
	"""permission_query_conditions hook for Customer Feedback."""
	user = user or frappe.session.user
	if not _is_portal_customer(user):
		return ""  # staff / desk users: no extra restriction
	cust = _user_customer(user)
	if not cust:
		return "1=0"  # portal user with no customer link → see nothing
	cust_name = frappe.db.get_value("Customer", cust, "customer_name") or cust
	c = frappe.db.escape(cust)
	cn = frappe.db.escape(cust_name)
	return (
		f"(`tabCustomer Feedback`.`customer` = {c} "
		f"OR `tabCustomer Feedback`.`customer_company` IN ({c}, {cn}))"
	)


def feedback_has_permission(doc, ptype, user):
	"""has_permission hook for Customer Feedback. Returns None for non-portal
	users so standard role permissions apply unchanged."""
	if not _is_portal_customer(user):
		return None
	cust = _user_customer(user)
	if not cust:
		return False
	cust_name = frappe.db.get_value("Customer", cust, "customer_name") or cust
	owner_link = doc.get("customer")
	owner_company = doc.get("customer_company")
	return owner_link == cust or owner_company in (cust, cust_name)


def invoice_query_conditions(user=None):
	"""permission_query_conditions hook for Sales Invoice — scopes portal
	customers to their own invoices (so a credit-note list is isolated)."""
	user = user or frappe.session.user
	if not _is_portal_customer(user):
		return ""
	cust = _user_customer(user)
	if not cust:
		return "1=0"
	return f"`tabSales Invoice`.`customer` = {frappe.db.escape(cust)}"
