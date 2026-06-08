"""Feedback-portal backend.

Every method scopes data to the single Customer linked to the current Frappe
user (a Website User whose Contact has a Dynamic Link → Customer). If no such
link exists, the methods raise PermissionError. There is no staff impersonation
here — only customers use this portal.

Customer Feedback is owned by the `upande_kaitet` app. This app extends it with
two Custom Fields: `customer` (Link → Customer, the isolation key) and
`credit_note` (Link → Sales Invoice, the resolution). The legacy
`customer_company` Data field is kept in sync (it is required on the doctype and
is what older rows / the existing customer_portal match on).
"""

import json

import frappe
from frappe import _

FEEDBACK_DT = "Customer Feedback"


# ── Identity / scoping ────────────────────────────────────────────────────────

def _resolve_customer():
	"""Return the Customer name linked to the current user, or raise."""
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Please sign in to access the feedback portal."), frappe.PermissionError)

	contact = frappe.db.get_value("Contact", {"user": user}, "name")
	if contact:
		cust = frappe.db.get_value(
			"Dynamic Link",
			{"parenttype": "Contact", "parent": contact, "link_doctype": "Customer"},
			"link_name",
		)
		if cust:
			return cust

	frappe.throw(
		_("Your user account is not linked to a customer record. Contact your account manager."),
		frappe.PermissionError,
	)


def _customer_name(cust):
	return frappe.db.get_value("Customer", cust, "customer_name") or cust


def _scope_or_filters(cust):
	"""or_filters matching either the new `customer` Link or the legacy
	`customer_company` field (which on older rows holds either the customer id
	or its display name)."""
	name = _customer_name(cust)
	ors = [["customer", "=", cust], ["customer_company", "=", cust]]
	if name != cust:
		ors.append(["customer_company", "=", name])
	return ors


@frappe.whitelist()
def get_csrf_token():
	"""Fresh CSRF token for the current session (GET-safe). The React app calls
	this to recover from a stale boot-injected token."""
	return {"csrf_token": frappe.sessions.get_csrf_token()}


@frappe.whitelist()
def get_my_context():
	"""Identity + company + currency. Called once on app boot."""
	cust = _resolve_customer()
	c = frappe.get_doc("Customer", cust)
	user = frappe.session.user

	mgr_user = getattr(c, "account_manager", None)
	manager = None
	if mgr_user:
		manager = {
			"user": mgr_user,
			"name": frappe.db.get_value("User", mgr_user, "full_name") or mgr_user,
			"email": mgr_user,
		}

	cust_currency = getattr(c, "default_currency", None)
	cust_company = getattr(c, "default_company", None)
	company_currency = (
		frappe.db.get_value("Company", cust_company, "default_currency") if cust_company else None
	)
	default_currency = cust_currency or company_currency or frappe.db.get_default("currency") or "USD"

	return {
		"user": user,
		"full_name": frappe.db.get_value("User", user, "full_name") or user,
		"customer": cust,
		"customer_name": c.customer_name,
		"customer_type": c.customer_type,
		"customer_group": c.customer_group,
		"territory": c.territory,
		"currency": default_currency,
		"payment_terms": getattr(c, "payment_terms", None) or None,
		"manager": manager,
	}


# ── Overview ──────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_overview():
	"""KPIs + recent lists for the overview page."""
	cust = _resolve_customer()
	orf = _scope_or_filters(cust)

	def fb_count(extra):
		return len(
			frappe.get_all(FEEDBACK_DT, filters=extra, or_filters=orf, fields=["name"], limit_page_length=0)
		)

	open_feedback = fb_count({"status": ["not in", ["Resolved", "Closed"]]})
	resolved_feedback = fb_count({"status": ["in", ["Resolved", "Closed"]]})
	open_claims = fb_count({"feedback_type": "Quality Claim", "status": ["not in", ["Resolved", "Closed"]]})

	credit_notes = frappe.get_all(
		"Sales Invoice",
		filters={"customer": cust, "is_return": 1, "docstatus": ["<", 2]},
		fields=["name", "posting_date", "grand_total", "currency", "return_against", "status"],
		order_by="posting_date desc, creation desc",
		limit=5,
	)

	recent_feedback = frappe.get_all(
		FEEDBACK_DT,
		or_filters=orf,
		fields=["name", "feedback_date", "feedback_type", "status", "invoice_number"],
		order_by="feedback_date desc, creation desc",
		limit=5,
	)

	return {
		"kpis": {
			"open_feedback": open_feedback,
			"open_claims": open_claims,
			"resolved": resolved_feedback,
			"credit_notes": frappe.db.count("Sales Invoice", {"customer": cust, "is_return": 1, "docstatus": ["<", 2]}),
		},
		"recent_feedback": recent_feedback,
		"recent_credit_notes": credit_notes,
	}


# ── Lists ─────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def list_feedback(limit=200):
	cust = _resolve_customer()
	return frappe.get_all(
		FEEDBACK_DT,
		or_filters=_scope_or_filters(cust),
		fields=[
			"name", "feedback_date", "feedback_type", "status",
			"invoice_number", "consignment_number", "claim_type",
			"total_stems_claimed", "total_claim_cost", "currency",
			"credit_note", "rating",
		],
		order_by="feedback_date desc, creation desc",
		limit_page_length=int(limit),
	) or []


@frappe.whitelist()
def get_feedback(name):
	"""Load one feedback doc + child rows, re-checking ownership."""
	cust = _resolve_customer()
	doc = frappe.get_doc(FEEDBACK_DT, name)
	if doc.get("customer") != cust and doc.get("customer_company") not in (cust, _customer_name(cust)):
		frappe.throw(_("Not your document."), frappe.PermissionError)
	return doc.as_dict()


@frappe.whitelist()
def list_credit_notes(limit=200):
	"""Credit notes = Sales Invoice with is_return=1 for this customer."""
	cust = _resolve_customer()
	return frappe.get_all(
		"Sales Invoice",
		filters={"customer": cust, "is_return": 1, "docstatus": ["<", 2]},
		fields=[
			"name", "posting_date", "grand_total", "outstanding_amount",
			"currency", "return_against", "status", "po_no",
		],
		order_by="posting_date desc, creation desc",
		limit_page_length=int(limit),
	) or []


# ── Message thread on a feedback doc ──────────────────────────────────────────

def _assert_owner(name, cust):
	doc = frappe.get_doc(FEEDBACK_DT, name)
	if doc.get("customer") != cust and doc.get("customer_company") not in (cust, _customer_name(cust)):
		frappe.throw(_("Not your document."), frappe.PermissionError)
	return doc


@frappe.whitelist()
def list_messages(name):
	"""Conversation attached to a feedback doc, oldest first."""
	cust = _resolve_customer()
	_assert_owner(name, cust)
	return frappe.get_all(
		"Communication",
		filters={"reference_doctype": FEEDBACK_DT, "reference_name": name},
		fields=[
			"name", "sender", "sender_full_name", "recipients",
			"content", "communication_date", "sent_or_received",
		],
		order_by="communication_date asc, creation asc",
	) or []


@frappe.whitelist()
def post_message(name, body=""):
	"""Post a message on a feedback doc as the current customer and email it to
	the team (the customer's account manager, falling back to the doc creator)."""
	cust = _resolve_customer()
	if not (body or "").strip():
		frappe.throw(_("Your message is empty."))
	doc = _assert_owner(name, cust)

	reply_to = frappe.db.get_value("Customer", cust, "account_manager")
	if not reply_to:
		owner = doc.owner if doc.owner not in ("Administrator", "Guest") else None
		reply_to = owner or doc.modified_by
	if not reply_to or "@" not in str(reply_to):
		reply_to = None

	subject = f"Re: Feedback {doc.name}"
	sender = frappe.session.user
	sender_name = frappe.db.get_value("User", sender, "full_name") or sender

	comm = frappe.get_doc({
		"doctype": "Communication",
		"communication_type": "Communication",
		"communication_medium": "Email",
		"sent_or_received": "Sent",
		"subject": subject,
		"content": body,
		"sender": sender,
		"sender_full_name": sender_name,
		"recipients": reply_to or "",
		"reference_doctype": FEEDBACK_DT,
		"reference_name": doc.name,
	})
	comm.insert(ignore_permissions=True)

	status = "recorded"
	if reply_to:
		try:
			frappe.sendmail(
				recipients=[r.strip() for r in str(reply_to).split(",") if r.strip()],
				sender=sender,
				subject=subject,
				message=body,
				communication=comm.name,
			)
			status = "sent"
		except Exception as e:
			status = f"queued (mail not configured: {e})"

	frappe.db.commit()
	return {"name": comm.name, "status": status, "recipients": reply_to or None}


# ── Submissions ───────────────────────────────────────────────────────────────

def _read_payload(payload):
	if isinstance(payload, str):
		try:
			return json.loads(payload)
		except Exception:
			return {}
	return payload or {}


def _new_feedback(cust, kind):
	"""Create a Customer Feedback skeleton scoped to `cust`, with both the new
	`customer` Link and the required legacy `customer_company` field set."""
	c = frappe.get_doc("Customer", cust)
	doc = frappe.new_doc(FEEDBACK_DT)
	try:
		doc.naming_series = "CF-.YYYY.-.####"
	except Exception:
		pass
	doc.feedback_date = frappe.utils.nowdate()
	doc.feedback_type = kind
	doc.status = "Submitted"
	doc.customer_company = c.customer_name  # required field
	if hasattr(doc, "customer"):
		doc.customer = cust
	return doc


@frappe.whitelist()
def submit_claim(payload=None, **kwargs):
	"""Create a Customer Feedback of type Quality Claim, with claim line items."""
	cust = _resolve_customer()
	data = _read_payload(payload) or kwargs or {}

	doc = _new_feedback(cust, "Quality Claim")
	doc.contact_name = data.get("contact_name") or frappe.session.user
	doc.contact_email = data.get("contact_email") or frappe.session.user
	if data.get("contact_phone"):
		doc.contact_phone = data["contact_phone"]

	for fld in (
		"invoice_number", "sales_invoice", "consignment_number", "po_number", "shipment_date",
		"control_point", "claim_type", "currency",
		"total_stems_claimed", "total_claim_cost", "additional_description",
	):
		if fld in data and data[fld] not in (None, ""):
			setattr(doc, fld, data[fld])

	for it in (data.get("claim_items") or []):
		doc.append("claim_items", {
			"variety": it.get("variety"),
			"stem_length": it.get("stem_length"),
			"stems_received": it.get("stems_received") or 0,
			"stems_claimed": it.get("stems_claimed") or 0,
			"price_per_stem": it.get("price_per_stem") or 0,
			"claim_cost": it.get("claim_cost") or 0,
			"reason_category": it.get("reason_category"),
			"reason": it.get("reason"),
			"description": it.get("description") or "",
		})

	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return {"name": doc.name, "status": doc.status}


@frappe.whitelist()
def submit_suggestion(payload=None, **kwargs):
	"""Quick suggestion / compliment / general feedback — single text body."""
	cust = _resolve_customer()
	data = _read_payload(payload) or kwargs or {}
	kind = data.get("feedback_type") or "Suggestion"  # Suggestion | Compliment | General Feedback

	doc = _new_feedback(cust, kind)
	doc.contact_name = data.get("contact_name") or frappe.session.user
	doc.contact_email = data.get("contact_email") or frappe.session.user
	if data.get("rating"):
		try:
			doc.rating = int(data["rating"])
		except Exception:
			pass
	doc.feedback_text = data.get("body") or ""
	if data.get("subject"):
		doc.additional_description = f"Subject: {data.get('subject')}\n\n{data.get('body') or ''}"

	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return {"name": doc.name, "status": doc.status}
