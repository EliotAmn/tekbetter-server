from prometheus_client import Gauge

user_total = Gauge('user_total', 'Total number of user accounts', ['campus', 'promotion_year'])
user_total_verified = Gauge('user_total_verified', 'Total number of verified user accounts', ['campus', 'promotion_year'])
users_per_scraper = Gauge('users_per_scraper', 'Number of users per scraper', ['scraper'])
