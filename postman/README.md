Postman collection and environment for Phone App API

Files:
- phone_app.postman_collection.json — Postman v2.1 collection containing requests for all routes (taikhoan, sanpham, nhomsanpham, dathang, chitietdathang, danhgia).
- phone_app.postman_environment.json — Environment file with `base_url` and `token` variables.

How to use:
1. Import `postman/phone_app.postman_collection.json` into Postman (Collections -> Import).
2. Import the environment `postman/phone_app.postman_environment.json`.
3. Set `base_url` to your server address, e.g. `http://localhost:3000`.
4. Run `Auth - Login` with an existing account (e.g. admin/admin123). The collection test script saves the returned token into `{{token}}` automatically.
5. Use the other requests; requests that need authentication include the header `Authorization: Bearer {{token}}` (you can add this globally in the environment if needed).

Notes:
- The collection assumes images (`anh`) are stored as file paths (strings) in the DB; adjust request bodies accordingly.
- Some endpoints (like insert/update) may require existing IDs (masp, maso, user_id). Use `/taikhoan/all` or `/sanpham/all` to discover IDs before running dependent requests.
- If you prefer, run collection via Newman:

```bash
npm i -g newman
newman run postman/phone_app.postman_collection.json -e postman/phone_app.postman_environment.json
```

If you want I can:
- Add example tests (assertions) to each request for response shapes/status codes.
- Group requests into folders inside the collection for better organization.
- Add a CI-ready Newman command or a script in package.json to run the collection automatically.
