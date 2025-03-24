import requests

BOC_URL = "https://elearning.ubpkarawang.ac.id/webservice/rest/server.php"
BOC_KEY = "5675caf640a47a04ef039ac2dc68ea1c"

def get_users():
    """Mendapatkan daftar pengguna dari Moodle."""
    params = {
        "wstoken": BOC_KEY,
        "wsfunction": "core_user_get_users",
        "moodlewsrestformat": "json"
    }

    try:
        response = requests.get(BOC_URL, params=params, timeout=30)
        data = response.json()

        if "users" in data and len(data["users"]) > 0:
            print("Daftar Pengguna:")
            for user in data["users"]:
                print(f"\nNama: {user.get('fullname', 'Tidak tersedia')}")
                print(f"Email: {user.get('email', 'Tidak tersedia')}")
                print(f"Kota: {user.get('city', 'Tidak tersedia')}")
                print(f"Negara: {user.get('country', 'Tidak tersedia')}")
                print(f"Terakhir Akses: {user.get('lastaccess', 'Tidak tersedia')}")
                print(f"ID Pengguna: {user.get('id', 'Tidak tersedia')}")
        else:
            print("Tidak ada pengguna yang ditemukan.")

    except requests.exceptions.RequestException as e:
        print(f"Request gagal: {e}")

def create_user(username, password, firstname, lastname, email, city="Jakarta", country="ID"):
    """Membuat pengguna baru di Moodle."""
    # Validasi input
    if not username or not password or not firstname or not lastname or not email:
        print("Error: Semua field wajib diisi (username, password, firstname, lastname, email).")
        return
    
    # Data pengguna baru
    user_data = {
        "users": [
            {
                "username": username,
                "password": password,
                "firstname": firstname,
                "lastname": lastname,
                "email": email,
                "city": city,
                "country": country,
                "auth": "manual",  # Tambahkan auth untuk menghindari error
                "suspended": 0  # Pastikan user tidak dinonaktifkan
            }
        ]
    }

    params = {
        "wstoken": BOC_KEY,
        "wsfunction": "core_user_create_users",
        "moodlewsrestformat": "json"
    }

    try:
        response = requests.post(BOC_URL, params=params, json=user_data, timeout=30)
        data = response.json()

        if isinstance(data, list) and len(data) > 0 and "id" in data[0]:
            print(f"Pengguna berhasil dibuat dengan ID: {data[0]['id']}")
        else:
            print("Gagal membuat pengguna. Respon dari server:", data)

    except requests.exceptions.RequestException as e:
        print(f"Request gagal: {e}")

# Contoh penggunaan
if __name__ == "__main__":
    # Menampilkan daftar pengguna
    get_users()

    # Menambahkan pengguna baru
    create_user(
        username="TheB",  # Pastikan username unik dan tidak mengandung spasi
        password="Password123!",  # Pastikan password memenuhi kebijakan keamanan
        firstname="B",
        lastname="My",
        email="The.B@ubpkarawang.ac.id",  # Pastikan email unik dan valid
        city="Jakarta",
        country="ID"
    )
