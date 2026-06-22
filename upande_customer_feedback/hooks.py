app_name = "upande_customer_feedback"
app_title = "Upande Customer Feedback"
app_publisher = "Upande"
app_description = "Customer feedback & quality-claim portal for Upande client farms"
app_email = "support@upande.com"
app_license = "mit"

# Website user (customer) login → feedback portal
get_website_user_home_page = "upande_customer_feedback.api.portal.get_user_home_page"

# Surface the portal as a link in the shared website portal menu, so logged-in
# webshop customers reach it with their existing session (no second login).
standard_portal_menu_items = [
	{
		"title": "Feedback & Claims",
		"route": "/customer-feedback",
		"reference_doctype": "Customer Feedback",
		"role": "",  # any logged-in website customer; the page enforces the customer link
	},
]

# SQL-level customer isolation (belt-and-suspenders on top of the API scoping).
# These only restrict portal customers (the "Customer Feedback User" role);
# desk / staff users are returned an empty condition (see permissions.py).
permission_query_conditions = {
	"Customer Feedback": "upande_customer_feedback.permissions.feedback_query_conditions",
	"Sales Invoice": "upande_customer_feedback.permissions.invoice_query_conditions",
}
has_permission = {
	"Customer Feedback": "upande_customer_feedback.permissions.feedback_has_permission",
}

# Shipped so installs are reproducible. The Custom Fields extend the existing
# (upande_kaitet-owned) Customer Feedback doctype with the portal's isolation key
# and credit-note link; the Role gates portal access.
fixtures = [
	# The Customer Feedback (claim) doctype and its line-item child table are
	# custom doctypes (created in the UI, module CRM). Ship them so the portal's
	# claim/credit-note flow works on a fresh site without manual recreation.
	{"dt": "DocType", "filters": [["name", "in", ["Customer Feedback", "Customer Feedback Item"]]]},
	{"dt": "Role", "filters": [["name", "in", ["Customer Feedback User"]]]},
	{
		"dt": "Custom Field",
		"filters": [
			[
				"name",
				"in",
				[
					"Customer Feedback-customer",
					"Customer Feedback-sales_invoice",
					"Customer Feedback-credit_note",
				],
			]
		],
	},
]

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "upande_customer_feedback",
# 		"logo": "/assets/upande_customer_feedback/logo.png",
# 		"title": "Upande Customer Feedback",
# 		"route": "/upande_customer_feedback",
# 		"has_permission": "upande_customer_feedback.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/upande_customer_feedback/css/upande_customer_feedback.css"
# app_include_js = "/assets/upande_customer_feedback/js/upande_customer_feedback.js"

# include js, css files in header of web template
# web_include_css = "/assets/upande_customer_feedback/css/upande_customer_feedback.css"
# web_include_js = "/assets/upande_customer_feedback/js/upande_customer_feedback.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "upande_customer_feedback/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "upande_customer_feedback/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "upande_customer_feedback.utils.jinja_methods",
# 	"filters": "upande_customer_feedback.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "upande_customer_feedback.install.before_install"
# after_install = "upande_customer_feedback.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "upande_customer_feedback.uninstall.before_uninstall"
# after_uninstall = "upande_customer_feedback.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "upande_customer_feedback.utils.before_app_install"
# after_app_install = "upande_customer_feedback.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "upande_customer_feedback.utils.before_app_uninstall"
# after_app_uninstall = "upande_customer_feedback.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "upande_customer_feedback.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"upande_customer_feedback.tasks.all"
# 	],
# 	"daily": [
# 		"upande_customer_feedback.tasks.daily"
# 	],
# 	"hourly": [
# 		"upande_customer_feedback.tasks.hourly"
# 	],
# 	"weekly": [
# 		"upande_customer_feedback.tasks.weekly"
# 	],
# 	"monthly": [
# 		"upande_customer_feedback.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "upande_customer_feedback.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "upande_customer_feedback.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "upande_customer_feedback.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["upande_customer_feedback.utils.before_request"]
# after_request = ["upande_customer_feedback.utils.after_request"]

# Job Events
# ----------
# before_job = ["upande_customer_feedback.utils.before_job"]
# after_job = ["upande_customer_feedback.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"upande_customer_feedback.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

