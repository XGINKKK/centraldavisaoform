# Plan: n8n Webhook Integration & Custom Feedback

## 🎯 Objective
Replace the current WhatsApp redirect with a robust internal submission flow. The user will stay on the page, see a loading state while waiting for n8n, receive a success message, and trigger the Facebook Lead event directly from the browser.

## 👥 Agent Assignments

| Domain | Agent | Responsibilities |
|--------|-------|------------------|
| **UI/Logic** | `frontend-specialist` | State management (loading/success), API call, UI components, Pixel tracking. |
| **Testing** | `test-engineer` | Verify webhook trigger, loading state duration, and Pixel event firing. |

## 📅 Implementation Phases

### Phase 1: Logic & State Management (`frontend-specialist`)
- [ ] **State Implementation**:
  - Add `isSubmitting` (bool) and `isSuccess` (bool) to `App.jsx`.
  - Create `submitForm` async function.
- [ ] **API Integration**:
  - Replace `window.open` with `fetch(N8N_WEBHOOK_URL, { method: 'POST', body: ... })`.
  - Handle success (200 OK) and error states.
- [ ] **Tracking**:
  - Move `fbq('track', 'Lead')` to the success block of the `fetch` call.

### Phase 2: UI/UX Components (`frontend-specialist`)
- [ ] **Loading State**:
  - Replace the "Agendar" button with a spinner/loading text during `isSubmitting`.
  - Ensure Glassmorphism style is maintained.
- [ ] **Success View**:
  - Create a new view (conditional render) replacing the form content.
  - **Content**:
    - Icon: Checkmark/Success badge.
    - Title: "Solicitação Recebida!"
    - Text: "Vamos entrar em contato com você para o agendamento."
  - Remove/Hide the WhatsApp button in this state.

### Phase 3: Verification (`test-engineer`)
- [ ] **Manual Test**: Submit form, check network tab for webhook call.
- [ ] **Pixel Helper**: Verify "Lead" event fires ONLY after success response.
- [ ] **UI Polish**: Check loading animation and success screen on mobile.

## 🔍 Technical Details

```javascript
// Draft Logic
const submitForm = async () => {
  setIsSubmitting(true);
  try {
    const response = await fetch(N8N_WEBHOOK_URL, { ... });
    if (response.ok) {
        setIsSuccess(true);
        fbq('track', 'Lead'); // Client-side tracking
    }
  } catch (error) {
    // Handle error
  } finally {
    setIsSubmitting(false);
  }
}
```
