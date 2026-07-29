# Logistika Admin Panel

React + Vite + TypeScript + React Query + Axios + shadcn/ui (Tailwind v4) asosida qurilgan admin panel skeleti.
Backend: Laravel API bilan ishlashga moslashtirilgan.

## Ishga tushirish

```bash
npm install
cp .env.example .env   # VITE_API_URL ni Laravel API manzilingizga moslang
npm run dev
```

## Tuzilma

- `src/lib/api.ts` — Axios instance (Laravel Sanctum uchun tayyor: cookie yoki Bearer token)
- `src/lib/utils.ts` — shadcn/ui `cn()` helper
- `src/components/ui/` — shadcn/ui komponentlari (Button, Card, Input, Label, Badge, Table)
- `src/components/ProtectedRoute.tsx` — login qilmagan foydalanuvchini `/login`ga yo'naltiradi
- `src/features/auth/AuthContext.tsx` — token/user holatini saqlash (localStorage), `useAuth()` hook
- `src/features/auth/useLogin.ts` — React Query `useMutation` orqali login (`POST /api/login`)
- `src/features/drivers/useDrivers.ts` — React Query hook namunasi (`GET /api/drivers`)
- `src/layouts/AdminLayout.tsx` — chap menyu, foydalanuvchi ma'lumoti va "Chiqish" tugmasi bilan asosiy admin layout
- `src/pages/LoginPage.tsx` — email/parol bilan kirish sahifasi
- `src/pages/` — qolgan sahifalar: Bosh sahifa, Yuklar, Vaditellar, Verifikatsiya, Statistika, Vakansiyalar

## Login qanday ishlaydi

1. `LoginPage` formasi `useLogin()` hookini chaqiradi → bu `POST /api/login` ga `{ email, password }` yuboradi.
2. Backend (Laravel, Sanctum personal access token orqali) `{ token, user }` qaytarishi kutiladi.
3. Muvaffaqiyatli bo'lsa, token va user `localStorage`ga saqlanadi (`AuthContext` orqali), va har bir keyingi Axios so'roviga `Authorization: Bearer <token>` avtomatik qo'shiladi (`src/lib/api.ts`).
4. `ProtectedRoute` barcha admin sahifalarni himoya qiladi — token yo'q bo'lsa `/login`ga yo'naltiradi.
5. 401 xatosi kelsa (`src/lib/api.ts` interceptor), token tozalanadi va foydalanuvchi login sahifasiga qaytariladi.

**Laravel tarafida kerak bo'ladigan endpoint namunasi** (`routes/api.php`):

```php
Route::post('/login', function (Request $request) {
    $request->validate(['email' => 'required|email', 'password' => 'required']);

    $user = User::where('email', $request->email)->first();
    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages(['email' => ['Email yoki parol noto\'g\'ri']]);
    }

    return [
        'token' => $user->createToken('admin-panel')->plainTextToken,
        'user' => $user->only('id', 'name', 'email'),
    ];
});
```

Agar cookie-based Sanctum SPA autentifikatsiyasini afzal ko'rsangiz (token o'rniga), `api.ts`dagi Bearer token qismini olib tashlab, `withCredentials: true` bilan session-cookie oqimiga o'tkazish mumkin — buning uchun avval `GET /sanctum/csrf-cookie` chaqirilishi kerak.

## Yangi shadcn/ui komponent qo'shish

`ui.shadcn.com` ochiq internet talab qiladi. Agar CLI ishlasa:

```bash
npx shadcn@latest add <component-name>
```

Aks holda kerakli komponentni https://ui.shadcn.com/docs/components dan qo'lda `src/components/ui/` ga qo'shish mumkin — ular oddiy React komponentlari, tashqi bog'liqlik yaratmaydi.

## Backend bilan bog'lash

`src/features/drivers/useDrivers.ts` — Laravel API'dan ma'lumot olishning namunasi. Har bir yangi modul (Yuklar, Verifikatsiya, Statistika, Vakansiyalar) uchun xuddi shu andozada `src/features/<modul>/` papkasida hook yarating.
# egs-hh-admin-panel
# egs-hh-admin-panel
