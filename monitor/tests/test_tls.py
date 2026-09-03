import unittest
import truststore
import ssl

class TestTLS(unittest.TestCase):
    def test_truststore_active(self):
        truststore.inject_into_ssl()
        ctx = ssl.create_default_context()
        self.assertEqual(ctx.verify_mode, ssl.CERT_REQUIRED)
        self.assertTrue(ctx.check_hostname)
