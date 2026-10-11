# TankerGuard frontend

React + Vite operations dashboard for the TankerGuard Spring Boot API.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Default API base URL: `http://localhost:8081`. Start the backend in a separate terminal first. Run `npm run build` to create the production bundle in `dist/`.

The UI deliberately uses API responses instead of hardcoded dashboard metrics. Demo scenario results and incident coordinates are synthetic; the map plots available incident coordinates only, not live vehicle movement.
