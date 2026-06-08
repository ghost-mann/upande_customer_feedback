import frappe


def get_user_home_page(user):
	"""Login landing for website users → the feedback portal.

	Wired via the `get_website_user_home_page` hook in hooks.py."""
	return "/customer-feedback"
