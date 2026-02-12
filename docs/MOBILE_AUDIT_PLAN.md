# Plano de Auditoria de Experiência Mobile

## Objetivo
Verificar e certificar o `lowticket-form` para excelência em dispositivos móveis, garantindo performance de 60fps, áreas de toque perfeitas e sensação de aplicativo nativo.

## 📱 Fase 1: Revisão Técnica Rigorosa Mobile
**Agente:** `mobile-developer`

- [ ] **Viewport & Meta Tags**: Verificar `viewport-fit=cover` e configurações de escala.
- [ ] **Manuseio de Inputs**:
    - Verificar `type="tel"` e `type="email"` para acionamento correto do teclado.
    - Checar tamanho da fonte >= 16px para evitar zoom automático no iOS.
- [ ] **Áreas de Toque**: Garantir que todos os elementos clicáveis tenham pelo menos 44x44px.
- [ ] **Áreas Seguras**: Verificar uso de `env(safe-area-inset-*)` para dispositivos com notch.
- [ ] **Performance**: Checar animações (usar `transform` em vez de `top/left`) e uso de `will-change`.

## 🎨 Fase 2: Polimento de Design Frontend (Visual)
**Agente:** `frontend-specialist`

- [ ] **Espaçamento e Ritmo**: Checar preenchimento em telas pequenas (iPhone SE - 320/375px).
- [ ] **Tipografia**: Garantir legibilidade no mobile (nenhum texto abaixo de 12px para informações críticas).
- [ ] **Feedback Visual**: Verificar se estados ativos (feedback de toque) são instantâneos e visíveis.
- [ ] **Mudanças de Layout**: Garantir que a abertura do teclado não quebre o layout (CLS).

## 🧪 Fase 3: Script de Verificação
**Agente:** `test-engineer`

- [ ] **Checagens Automatizadas**: Rodar linting para propriedades CSS específicas de mobile.
- [ ] **Simulação Manual**: Validação via walkthrough.

---

## 🚀 Estratégia de Execução
1. **Analisar**: `mobile-developer` realiza análise estática de código.
2. **Refinar**: `frontend-specialist` propõe melhorias de CSS se necessário.
3. **Relatar**: Certificação final "Pronto para Mobile".
