# Implementation Plan - Radio Button Symbol Selector

## Goal
Replace the dropdown-style `SymbolSelector` with a horizontal list of radio-style buttons, matching the design of the filter buttons in the application.

## User Review Required
> [!NOTE]
> The new selector will display all symbols in a horizontal scrollable list. This ensures all options are visible (or accessible via scroll) without needing to open a dropdown, but might require horizontal scrolling on smaller screens or narrow columns.

## Proposed Changes

### `src/App.tsx`

#### [MODIFY] `SymbolSelector` Component
- Remove the dropdown state (`isOpen`) and logic.
- Change the render to a horizontal `div` container with `overflow-x-auto`.
- Render a list of `button` elements for each symbol in `SYMBOLS`.
- Apply the same styling classes and inline styles as the existing filter buttons:
    - **Active**: `text-white border-gray-800` with `backgroundColor: DARK_TEXT`.
    - **Inactive**: `bg-white border-gray-200 hover:bg-gray-50` with `color: MEDIUM_GRAY`.
    - **Layout**: `rounded-full`, `px-3 py-1`, `text-xs font-bold`.

#### [MODIFY] `App` Component (Google Auth)
- Import `GoogleAuthProvider`, `signInWithPopup` from `firebase/auth`.
- Add a state `googleAccessToken` to store the OAuth token.
- Add a `handleGoogleLogin` function:
    - Configures `GoogleAuthProvider` with scope `https://www.googleapis.com/auth/generativelanguage.retriever`.
    - Calls `signInWithPopup`.
    - Sets `googleAccessToken` from the result credentials.
- Add a "Sign in with Google" button in the top bar (or a Settings modal).
- Update `generateReport` to:
    - Check for `googleAccessToken`.
    - If present, use `Authorization: Bearer <token>` header.
    - If not, fallback to the hardcoded/stored `apiKey`.

## Verification Plan

### Manual Verification
- **Symbol Selector**:
    - Verify horizontal list layout.
    - Verify selection works.
- **Google Auth**:
    - Click "Sign in with Google".
    - Verify popup appears (requires Firebase Console setup by user).
    - **Note**: I cannot fully verify the *success* of the login without the user's Firebase project having Google Auth enabled. I will verify the *code* triggers the popup.
- **Report Generation**:
    - Verify it attempts to use the token if logged in.

### Automated Tests
- Run `npm run build`.
