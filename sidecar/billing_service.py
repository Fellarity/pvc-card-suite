import base64
import json
import razorpay
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256

# Hardcoded Public Key for Offline License Verification
# In a real scenario, keep the private key securely offline to generate licenses.
PUBLIC_KEY_PEM = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyY4b3/9Kj6WkZq1XyR+T
5Z+QGzJ6x7XfJ/7+ZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq
ZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq
ZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq
ZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq
ZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq
JwIDAQAB
-----END PUBLIC KEY-----"""

def get_public_key():
    try:
        return RSA.import_key(PUBLIC_KEY_PEM)
    except ValueError:
        # Fallback for dev: Generate a dummy key pair if the hardcoded one is structurally invalid
        # (The dummy PEM above is just filler text that might fail parsing).
        key = RSA.generate(2048)
        return key.publickey()

# Generate a consistent dummy key for development so we don't break on the fake PEM
DEV_KEY = RSA.generate(2048)

class LicenseError(Exception):
    pass

def validate_offline_license(license_key_b64: str) -> dict:
    """
    Validates a base64 encoded license string: base64(payload_json_b64 + "." + signature_b64)
    """
    try:
        decoded_str = base64.b64decode(license_key_b64).decode('utf-8')
        payload_b64, signature_b64 = decoded_str.split('.')
        
        payload_json = base64.b64decode(payload_b64).decode('utf-8')
        signature = base64.b64decode(signature_b64)
        
        # Verify Signature
        h = SHA256.new(payload_b64.encode('utf-8'))
        
        # In prod, use get_public_key(). Here we use DEV_KEY.publickey() for a guaranteed working mock
        pkcs1_15.new(DEV_KEY.publickey()).verify(h, signature)
        
        payload = json.loads(payload_json)
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        raise LicenseError("Invalid license format")
    except Exception as e:
        raise LicenseError(f"License verification failed: Signature invalid")

# Razorpay Client Mock/Setup
RAZORPAY_KEY_ID = "rzp_test_mock123"
RAZORPAY_KEY_SECRET = "mock_secret"
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def create_razorpay_order(amount_inr: int):
    # Razorpay amount is in paise
    try:
        # Mocking for local dev without real keys
        # order = rzp_client.order.create({'amount': amount_inr * 100, 'currency': 'INR', 'payment_capture': '1'})
        order = {'id': 'order_mock_' + str(amount_inr), 'amount': amount_inr * 100}
        return order
    except Exception as e:
        raise Exception(f"Razorpay Order Error: {str(e)}")

def verify_razorpay_payment(payment_id: str, order_id: str, signature: str):
    # try:
    #     rzp_client.utility.verify_payment_signature({
    #         'razorpay_order_id': order_id,
    #         'razorpay_payment_id': payment_id,
    #         'razorpay_signature': signature
    #     })
    #     return True
    # except:
    return True # Always true for mock

# Dev Helper: Generate a valid mock license for 100 credits
def _generate_test_license():
    payload_dict = {"credits": 100, "type": "offline_activation"}
    payload_json = json.dumps(payload_dict)
    payload_b64 = base64.b64encode(payload_json.encode('utf-8')).decode('utf-8')
    
    h = SHA256.new(payload_b64.encode('utf-8'))
    signature = pkcs1_15.new(DEV_KEY).sign(h)
    signature_b64 = base64.b64encode(signature).decode('utf-8')
    
    combined = f"{payload_b64}.{signature_b64}"
    final_key = base64.b64encode(combined.encode('utf-8')).decode('utf-8')
    return final_key

TEST_LICENSE = _generate_test_license()
print(f"=== DEV MOCK LICENSE KEY (100 Credits) ===\n{TEST_LICENSE}\n==========================================")
